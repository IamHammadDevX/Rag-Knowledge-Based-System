import { appwriteConfig, appwriteDatabases } from "@/lib/server/integrations/appwrite-admin";

let schemaReady = false;

const ensureCollection = async (collectionId: string, name: string) => {
  try {
    await appwriteDatabases.getCollection(appwriteConfig.databaseId, collectionId);
    return;
  } catch {
    await appwriteDatabases.createCollection(
      appwriteConfig.databaseId,
      collectionId,
      name,
      [],
      false,
      true
    );
  }
};

const safeAttribute = async (runner: () => Promise<unknown>) => {
  try {
    await runner();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("already exists") || message.includes("409") || message.includes("attribute_not_available")) {
      return;
    }
    throw error;
  }
};

const waitForAttributes = async (collectionId: string, keys: string[]) => {
  const timeoutMs = 30_000;
  const intervalMs = 1_500;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const attributeList = await (appwriteDatabases as any).listAttributes(
      appwriteConfig.databaseId,
      collectionId
    );

    const existingKeys = new Set(
      (attributeList?.attributes || [])
        .filter((attribute: any) => attribute.status === "available" || !attribute.status)
        .map((attribute: any) => attribute.key)
    );

    if (keys.every((key) => existingKeys.has(key))) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Timed out while waiting for Appwrite attributes in ${collectionId}.`);
};

const ensureDocumentAttributes = async () => {
  const collectionId = appwriteConfig.documentsCollectionId;
  const db = appwriteConfig.databaseId;

  await safeAttribute(() =>
    (appwriteDatabases as any).createStringAttribute(db, collectionId, "userId", 128, true)
  );
  await safeAttribute(() =>
    (appwriteDatabases as any).createStringAttribute(db, collectionId, "name", 512, true)
  );
  await safeAttribute(() =>
    (appwriteDatabases as any).createStringAttribute(db, collectionId, "type", 128, true)
  );
  await safeAttribute(() =>
    (appwriteDatabases as any).createIntegerAttribute(db, collectionId, "size", true, 0, 2147483647, false)
  );
  await safeAttribute(() =>
    (appwriteDatabases as any).createStringAttribute(db, collectionId, "status", 32, true)
  );
  await safeAttribute(() =>
    (appwriteDatabases as any).createStringAttribute(db, collectionId, "uploadedBy", 255, true)
  );
  await safeAttribute(() =>
    (appwriteDatabases as any).createStringAttribute(db, collectionId, "storageFileId", 128, true)
  );
  await safeAttribute(() =>
    (appwriteDatabases as any).createIntegerAttribute(db, collectionId, "chunkCount", false, 0, 100000, undefined, false)
  );
  await safeAttribute(() =>
    (appwriteDatabases as any).createStringAttribute(db, collectionId, "errorMessage", 2048, false)
  );
  await safeAttribute(() =>
    (appwriteDatabases as any).createDatetimeAttribute(db, collectionId, "createdAt", true)
  );

  await safeAttribute(() =>
    (appwriteDatabases as any).createIndex(db, collectionId, "documents_userId_idx", "key", ["userId"])
  );

  await waitForAttributes(collectionId, [
    "userId",
    "name",
    "type",
    "size",
    "status",
    "uploadedBy",
    "storageFileId",
    "chunkCount",
    "createdAt",
  ]);
};

const ensureConversationAttributes = async () => {
  const collectionId = appwriteConfig.conversationsCollectionId;
  const db = appwriteConfig.databaseId;

  await safeAttribute(() =>
    (appwriteDatabases as any).createStringAttribute(db, collectionId, "userId", 128, true)
  );
  await safeAttribute(() =>
    (appwriteDatabases as any).createStringAttribute(db, collectionId, "sessionId", 128, true)
  );
  await safeAttribute(() =>
    (appwriteDatabases as any).createStringAttribute(db, collectionId, "role", 32, true)
  );
  await safeAttribute(() =>
    (appwriteDatabases as any).createStringAttribute(db, collectionId, "content", 12000, true)
  );
  await safeAttribute(() =>
    (appwriteDatabases as any).createStringAttribute(db, collectionId, "sourcesJson", 12000, false)
  );
  await safeAttribute(() =>
    (appwriteDatabases as any).createDatetimeAttribute(db, collectionId, "createdAt", true)
  );

  await safeAttribute(() =>
    (appwriteDatabases as any).createIndex(db, collectionId, "conversation_session_idx", "key", ["sessionId"])
  );

  await waitForAttributes(collectionId, ["userId", "sessionId", "role", "content", "createdAt"]);
};

export const ensureAppwriteSchema = async () => {
  if (schemaReady) {
    return;
  }

  if (!appwriteConfig.databaseId) {
    throw new Error("APPWRITE_DATABASE_ID is missing.");
  }

  await ensureCollection(appwriteConfig.documentsCollectionId, "Knowledge Documents");
  await ensureCollection(appwriteConfig.conversationsCollectionId, "Conversation Messages");
  await ensureDocumentAttributes();
  await ensureConversationAttributes();

  schemaReady = true;
};
