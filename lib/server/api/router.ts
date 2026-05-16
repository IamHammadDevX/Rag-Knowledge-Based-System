import { env } from "@/lib/config/env";
import { signSessionToken, AUTH_COOKIE_NAME } from "@/lib/server/auth/session-token";
import { getSessionUserFromRequest } from "@/lib/server/auth/session";
import { loginWithAppwrite, logoutFromAppwrite, registerWithAppwrite } from "@/lib/server/integrations/appwrite-auth";
import {
  deleteKnowledgeDocument,
  listConversationMessages,
  listKnowledgeDocuments,
} from "@/lib/server/integrations/appwrite-documents";
import { deleteFileFromAppwriteStorage } from "@/lib/server/integrations/appwrite-storage";
import { answerQuestionWithRag } from "@/lib/server/rag/retrieval";
import { completeChunkedUpload, initChunkedUpload, storeUploadChunk } from "@/lib/server/uploads/chunked-upload";
import { createAndIngestDocument, retryDocumentIngestion } from "@/lib/server/rag/ingestion";
import { deleteVectorsByDocument } from "@/lib/server/integrations/pinecone";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.CORS_ORIGINS || "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const json = (payload: unknown, status = 200) =>
  NextResponse.json(payload, {
    status,
    headers: corsHeaders,
  });

const withSessionCookie = (response: NextResponse, token: string) => {
  response.headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE_NAME}=${token}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`
  );
  return response;
};

const clearSessionCookie = (response: NextResponse) => {
  response.headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
  );
  return response;
};

const getRoutePath = async (context: RouteContext) => {
  const params = await context.params;
  return `/${(params.path ?? []).join("/")}`;
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

const requireSessionUser = (request: Request) => {
  const user = getSessionUserFromRequest(request);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
};

async function handleRequest(request: Request, context: RouteContext) {
  const route = await getRoutePath(context);
  const method = request.method;

  try {
    if ((route === "/" || route === "/health") && method === "GET") {
      return json({
        success: true,
        data: {
          service: "Knowledge IQ API",
          version: "live-rag-v1",
          integrations: {
            appwrite: Boolean(env.appwriteEndpoint && env.appwriteProjectId && env.appwriteApiKey),
            pinecone: Boolean(env.pineconeApiKey && env.pineconeHost),
            groq: Boolean(env.groqApiKey),
            huggingFace: Boolean(env.huggingfaceApiKey),
          },
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (route === "/auth/register" && method === "POST") {
      const body = await request.json();
      if (!body?.name || !body?.email || !body?.password) {
        return json({ success: false, error: "Name, email, and password are required." }, 400);
      }

      const registration = await registerWithAppwrite(body.name, body.email, body.password);
      const sessionToken = signSessionToken({
        userId: registration.user.id,
        email: registration.user.email,
        name: registration.user.name,
        role: registration.user.role,
        appwriteSessionId: registration.sessionId,
      });

      const response = json({
        success: true,
        data: {
          user: registration.user,
          sessionToken,
        },
      });

      return withSessionCookie(response, sessionToken);
    }

    if (route === "/auth/login" && method === "POST") {
      const body = await request.json();
      if (!body?.email || !body?.password) {
        return json({ success: false, error: "Email and password are required." }, 400);
      }

      const login = await loginWithAppwrite(body.email, body.password);
      const sessionToken = signSessionToken({
        userId: login.user.id,
        email: login.user.email,
        name: login.user.name,
        role: login.user.role,
        appwriteSessionId: login.sessionId,
      });

      const response = json({
        success: true,
        data: {
          user: login.user,
          sessionToken,
        },
      });

      return withSessionCookie(response, sessionToken);
    }

    if (route === "/auth/logout" && method === "POST") {
      const sessionUser = getSessionUserFromRequest(request);
      await logoutFromAppwrite(sessionUser?.appwriteSessionId).catch(() => undefined);
      return clearSessionCookie(
        json({
          success: true,
          data: { loggedOut: true },
        })
      );
    }

    if (route === "/documents" && method === "GET") {
      const user = requireSessionUser(request);
      const documents = await listKnowledgeDocuments(user.id);
      return json({ success: true, data: documents });
    }

    if (route.match(/^\/documents\/[^/]+\/retry$/) && method === "POST") {
      const user = requireSessionUser(request);
      const documentId = route.replace("/documents/", "").replace("/retry", "");
      const result = await retryDocumentIngestion({
        documentId,
        userId: user.id,
      });

      return json({
        success: true,
        data: result,
        message: "Document re-indexing started.",
      });
    }

    if (route.startsWith("/documents/") && method === "DELETE") {
      const user = requireSessionUser(request);
      const documentId = route.replace("/documents/", "");
      const deleted = await deleteKnowledgeDocument(documentId, user.id);
      await Promise.allSettled([
        deleteFileFromAppwriteStorage(deleted.storageFileId),
        deleteVectorsByDocument(documentId),
      ]);
      return json({ success: true, data: { id: documentId } });
    }

    if (route === "/uploads/init" && method === "POST") {
      const user = requireSessionUser(request);
      const body = await request.json();

      if (!body?.fileName || !body?.totalChunks || !body?.fileSize) {
        return json({ success: false, error: "fileName, fileSize and totalChunks are required." }, 400);
      }

      const uploadId = await initChunkedUpload({
        userId: user.id,
        fileName: body.fileName,
        mimeType: body.mimeType || "application/octet-stream",
        totalChunks: Number(body.totalChunks),
        fileSize: Number(body.fileSize),
      });

      return json({ success: true, data: { uploadId } });
    }

    if (route === "/uploads/chunk" && method === "POST") {
      const user = requireSessionUser(request);
      const form = await request.formData();

      const uploadId = String(form.get("uploadId") || "");
      const chunkIndex = Number(form.get("chunkIndex") || 0);
      const chunk = form.get("chunk");

      if (!uploadId || !(chunk instanceof File)) {
        return json({ success: false, error: "uploadId and chunk are required." }, 400);
      }

      const buffer = Buffer.from(await chunk.arrayBuffer());
      await storeUploadChunk({
        uploadId,
        chunkIndex,
        userId: user.id,
        chunkBuffer: buffer,
      });

      return json({ success: true, data: { uploadId, chunkIndex } });
    }

    if (route === "/uploads/complete" && method === "POST") {
      const user = requireSessionUser(request);
      const body = await request.json();
      const uploadId = body?.uploadId;

      if (!uploadId) {
        return json({ success: false, error: "uploadId is required." }, 400);
      }

      const completed = await completeChunkedUpload({
        uploadId,
        userId: user.id,
      });

      const document = await createAndIngestDocument({
        userId: user.id,
        uploadedBy: user.email,
        fileName: completed.fileName,
        mimeType: completed.mimeType,
        size: completed.fileSize,
        buffer: completed.fileBuffer,
      });

      return json({
        success: true,
        data: document,
        message: "File uploaded to Appwrite and queued for extraction/indexing.",
      });
    }

    if (route === "/chat/ask" && method === "POST") {
      const user = requireSessionUser(request);
      const body = await request.json();

      if (!body?.question || !body?.sessionId) {
        return json({ success: false, error: "question and sessionId are required." }, 400);
      }

      const answer = await answerQuestionWithRag({
        userId: user.id,
        question: body.question,
        sessionId: body.sessionId,
      });

      return json({ success: true, data: answer });
    }

    if (route === "/chat/history" && method === "GET") {
      const user = requireSessionUser(request);
      const sessionId = new URL(request.url).searchParams.get("sessionId");

      if (!sessionId) {
        return json({ success: false, error: "sessionId is required." }, 400);
      }

      const history = await listConversationMessages(user.id, sessionId);
      return json({ success: true, data: history });
    }

    return json({ success: false, error: `Route ${route} with method ${method} not found.` }, 404);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    console.error("API live-rag error:", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      500
    );
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
export const PATCH = handleRequest;
