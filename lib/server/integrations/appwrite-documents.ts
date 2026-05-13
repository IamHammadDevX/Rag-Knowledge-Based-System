import { appwriteConfig, appwriteDatabases, appwriteId, appwriteQuery } from "@/lib/server/integrations/appwrite-admin";
import { ensureAppwriteSchema } from "@/lib/server/integrations/appwrite-schema";
import { KnowledgeDocument } from "@/types/documents";

type DocumentStatus = "indexed" | "processing" | "failed";
type ChatRole = "user" | "assistant";

const mapDocument = (raw: any): KnowledgeDocument => ({
  id: raw.$id,
  name: raw.name,
  type: raw.type,
  size: raw.size,
  status: raw.status,
  createdAt: raw.createdAt,
  uploadedBy: raw.uploadedBy,
  chunkCount: raw.chunkCount || 0,
  storageFileId: raw.storageFileId,
  errorMessage: raw.errorMessage,
});

export const createKnowledgeDocument = async (input: {
  userId: string;
  name: string;
  type: string;
  size: number;
  uploadedBy: string;
  storageFileId: string;
}) => {
  await ensureAppwriteSchema();

  const created = await appwriteDatabases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.documentsCollectionId,
    appwriteId.unique(),
    {
      userId: input.userId,
      name: input.name,
      type: input.type,
      size: input.size,
      status: "processing",
      uploadedBy: input.uploadedBy,
      storageFileId: input.storageFileId,
      chunkCount: 0,
      errorMessage: "",
      createdAt: new Date().toISOString(),
    }
  );

  return mapDocument(created);
};

export const updateKnowledgeDocumentStatus = async (
  documentId: string,
  userId: string,
  status: DocumentStatus,
  updates?: Partial<{ chunkCount: number; errorMessage: string }>
) => {
  await ensureAppwriteSchema();

  const existing = await appwriteDatabases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.documentsCollectionId,
    documentId
  );

  if (existing.userId !== userId) {
    throw new Error("Unauthorized to update this document.");
  }

  const updated = await appwriteDatabases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.documentsCollectionId,
    documentId,
    {
      status,
      chunkCount: updates?.chunkCount ?? existing.chunkCount ?? 0,
      errorMessage: updates?.errorMessage ?? existing.errorMessage ?? "",
    }
  );

  return mapDocument(updated);
};

export const listKnowledgeDocuments = async (userId: string) => {
  await ensureAppwriteSchema();

  const list = await appwriteDatabases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.documentsCollectionId,
    [appwriteQuery.equal("userId", userId), appwriteQuery.orderDesc("$createdAt"), appwriteQuery.limit(100)]
  );

  return list.documents.map(mapDocument);
};

export const deleteKnowledgeDocument = async (documentId: string, userId: string) => {
  await ensureAppwriteSchema();

  const existing = await appwriteDatabases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.documentsCollectionId,
    documentId
  );

  if (existing.userId !== userId) {
    throw new Error("Unauthorized to delete this document.");
  }

  await appwriteDatabases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.documentsCollectionId,
    documentId
  );

  return {
    id: documentId,
    storageFileId: existing.storageFileId as string,
  };
};

export const createConversationMessage = async (input: {
  userId: string;
  sessionId: string;
  role: ChatRole;
  content: string;
  sources?: Array<Record<string, unknown>>;
}) => {
  await ensureAppwriteSchema();

  await appwriteDatabases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.conversationsCollectionId,
    appwriteId.unique(),
    {
      userId: input.userId,
      sessionId: input.sessionId,
      role: input.role,
      content: input.content,
      sourcesJson: JSON.stringify(input.sources ?? []),
      createdAt: new Date().toISOString(),
    }
  );
};

export const listConversationMessages = async (userId: string, sessionId: string) => {
  await ensureAppwriteSchema();

  const list = await appwriteDatabases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.conversationsCollectionId,
    [
      appwriteQuery.equal("userId", userId),
      appwriteQuery.equal("sessionId", sessionId),
      appwriteQuery.orderAsc("$createdAt"),
      appwriteQuery.limit(100),
    ]
  );

  return list.documents.map((item: any) => ({
    id: item.$id,
    role: item.role as ChatRole,
    content: item.content,
    createdAt: item.createdAt,
    sources: (() => {
      try {
        return JSON.parse(item.sourcesJson || "[]") as Array<Record<string, unknown>>;
      } catch {
        return [];
      }
    })(),
  }));
};
