import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { integrationStatus } from "@/lib/config/env";
import { orchestrateRagAnswer } from "@/lib/services/rag/rag-orchestrator.service";
import { KnowledgeDocument } from "@/types/documents";
import { AuthUser } from "@/types/auth";

type RouteContext = {
  params: {
    path?: string[];
  };
};

type MockState = {
  users: AuthUser[];
  documents: KnowledgeDocument[];
};

const globalScope = globalThis as unknown as {
  __KNOWLEDGE_IQ_MOCK_DB__?: MockState;
};

if (!globalScope.__KNOWLEDGE_IQ_MOCK_DB__) {
  globalScope.__KNOWLEDGE_IQ_MOCK_DB__ = {
    users: [],
    documents: [
      {
        id: uuidv4(),
        name: "Enterprise Security Policy.pdf",
        size: 920000,
        type: "application/pdf",
        status: "indexed",
        createdAt: new Date().toISOString(),
        uploadedBy: "system@knowledgeiq.ai",
      },
      {
        id: uuidv4(),
        name: "Onboarding Handbook.docx",
        size: 440000,
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        status: "processing",
        createdAt: new Date().toISOString(),
        uploadedBy: "system@knowledgeiq.ai",
      },
    ],
  };
}

const db = globalScope.__KNOWLEDGE_IQ_MOCK_DB__;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const json = (payload: unknown, status = 200) =>
  NextResponse.json(payload, {
    status,
    headers: corsHeaders,
  });

const getRoutePath = (context: RouteContext) => `/${(context.params.path ?? []).join("/")}`;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

async function handleRequest(request: Request, context: RouteContext) {
  try {
    const route = getRoutePath(context);
    const method = request.method;

    if (route === "/" || route === "/health") {
      return json({
        success: true,
        data: {
          service: "Knowledge IQ API",
          version: "mvp-scaffold-v1",
          integrations: integrationStatus,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (route === "/auth/login" && method === "POST") {
      const body = await request.json();
      if (!body?.email || !body?.password) {
        return json({ success: false, error: "Email and password are required." }, 400);
      }

      const foundUser = db.users.find((user) => user.email === body.email);
      const user: AuthUser =
        foundUser ?? {
          id: uuidv4(),
          email: body.email,
          name: body.email.split("@")[0],
          role: "admin",
        };

      if (!foundUser) {
        db.users.push(user);
      }

      return json({
        success: true,
        data: {
          user,
          sessionToken: uuidv4(),
        },
        message: "Logged in (scaffold mode).",
      });
    }

    if (route === "/auth/register" && method === "POST") {
      const body = await request.json();
      if (!body?.email || !body?.password || !body?.name) {
        return json({ success: false, error: "Name, email, and password are required." }, 400);
      }

      if (db.users.some((user) => user.email === body.email)) {
        return json({ success: false, error: "User already exists." }, 409);
      }

      const user: AuthUser = {
        id: uuidv4(),
        email: body.email,
        name: body.name,
        role: "admin",
      };

      db.users.push(user);

      return json({
        success: true,
        data: {
          user,
          sessionToken: uuidv4(),
        },
        message: "Account created (scaffold mode).",
      });
    }

    if (route === "/auth/logout" && method === "POST") {
      return json({
        success: true,
        data: { loggedOut: true },
      });
    }

    if (route === "/documents" && method === "GET") {
      return json({ success: true, data: db.documents });
    }

    if (route === "/documents" && method === "POST") {
      const body = await request.json();
      if (!body?.name || !body?.type || !body?.uploadedBy) {
        return json({ success: false, error: "name, type, and uploadedBy are required." }, 400);
      }

      const document: KnowledgeDocument = {
        id: uuidv4(),
        name: body.name,
        type: body.type,
        size: Number(body.size ?? 0),
        status: "processing",
        createdAt: new Date().toISOString(),
        uploadedBy: body.uploadedBy,
      };

      db.documents.unshift(document);

      return json({
        success: true,
        data: document,
        message: "Document metadata queued for indexing scaffold.",
      });
    }

    if (route.startsWith("/documents/") && method === "DELETE") {
      const id = route.replace("/documents/", "");
      const currentLength = db.documents.length;
      db.documents = db.documents.filter((doc) => doc.id !== id);

      if (db.documents.length === currentLength) {
        return json({ success: false, error: "Document not found." }, 404);
      }

      return json({
        success: true,
        data: { id },
        message: "Document removed from scaffold library.",
      });
    }

    if (route === "/chat/ask" && method === "POST") {
      const body = await request.json();
      if (!body?.question || !body?.sessionId) {
        return json({ success: false, error: "question and sessionId are required." }, 400);
      }

      const answer = await orchestrateRagAnswer({
        question: body.question,
        sessionId: body.sessionId,
        indexedDocumentCount: db.documents.length,
      });

      return json({ success: true, data: answer });
    }

    return json({ success: false, error: `Route ${route} with method ${method} not found.` }, 404);
  } catch (error) {
    console.error("API scaffold error:", error);
    return json({ success: false, error: "Internal server error" }, 500);
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
export const PATCH = handleRequest;
