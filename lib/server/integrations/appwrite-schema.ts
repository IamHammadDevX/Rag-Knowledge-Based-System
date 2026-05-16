import { appwriteConfig, appwriteDatabases } from "@/lib/server/integrations/appwrite-admin";

let schemaReady = false;
let schemaInitializing = false;

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
    const responseText = typeof (error as any)?.response === "string" ? (error as any).response : "";
    const fullText = `${message} ${responseText}`.toLowerCase();

    if (
      fullText.includes("already exists") ||
      fullText.includes("409") ||
      fullText.includes("attribute_not_available") ||
      fullText.includes("maximum number or size of attributes") ||
      fullText.includes("attribute_limit_exceeded")
    ) {
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
  if (schemaReady) return; // Skip if already initialized
  
  const collectionId = appwriteConfig.documentsCollectionId;
  const db = appwriteConfig.databaseId;

  // Run in parallel with Promise.allSettled to not fail on individual errors
  await Promise.allSettled([
    safeAttribute(() =>
      (appwriteDatabases as any).createStringAttribute(db, collectionId, "userId", 128, true)
    ),
    safeAttribute(() =>
      (appwriteDatabases as any).createStringAttribute(db, collectionId, "name", 512, true)
    ),
    safeAttribute(() =>
      (appwriteDatabases as any).createStringAttribute(db, collectionId, "type", 128, true)
    ),
    safeAttribute(() =>
      (appwriteDatabases as any).createIntegerAttribute(db, collectionId, "size", true, 0, 2147483647)
    ),
    safeAttribute(() =>
      (appwriteDatabases as any).createStringAttribute(db, collectionId, "status", 32, true)
    ),
    safeAttribute(() =>
      (appwriteDatabases as any).createStringAttribute(db, collectionId, "uploadedBy", 255, true)
    ),
    safeAttribute(() =>
      (appwriteDatabases as any).createStringAttribute(db, collectionId, "storageFileId", 128, true)
    ),
    safeAttribute(() =>
      (appwriteDatabases as any).createIntegerAttribute(db, collectionId, "chunkCount", false, 0, 100000)
    ),
    safeAttribute(() =>
      (appwriteDatabases as any).createStringAttribute(db, collectionId, "errorMessage", 2048, false)
    ),
    safeAttribute(() =>
      (appwriteDatabases as any).createDatetimeAttribute(db, collectionId, "createdAt", true)
    ),
    safeAttribute(() =>
      (appwriteDatabases as any).createIndex(db, collectionId, "documents_userId_idx", "key", ["userId"])
    ),
  ]);
};

const ensureConversationAttributes = async () => {
  if (schemaReady) return; // Skip if already initialized
  
  const collectionId = appwriteConfig.conversationsCollectionId;
  const db = appwriteConfig.databaseId;

  // Run in parallel with Promise.allSettled to not fail on individual errors
  await Promise.allSettled([
    safeAttribute(() =>
      (appwriteDatabases as any).createStringAttribute(db, collectionId, "userId", 128, true)
    ),
    safeAttribute(() =>
      (appwriteDatabases as any).createStringAttribute(db, collectionId, "sessionId", 128, true)
    ),
    safeAttribute(() =>
      (appwriteDatabases as any).createStringAttribute(db, collectionId, "role", 32, true)
    ),
    safeAttribute(() =>
      (appwriteDatabases as any).createStringAttribute(db, collectionId, "content", 12000, true)
    ),
    safeAttribute(() =>
      (appwriteDatabases as any).createStringAttribute(db, collectionId, "sourcesJson", 12000, false)
    ),
    safeAttribute(() =>
      (appwriteDatabases as any).createDatetimeAttribute(db, collectionId, "createdAt", true)
    ),
    safeAttribute(() =>
      (appwriteDatabases as any).createIndex(db, collectionId, "conversation_session_idx", "key", ["sessionId"])
    ),
  ]);
};

const initializeSchemaInBackground = async () => {
  if (!appwriteConfig.databaseId) {
    console.warn("[Appwrite Schema] DATABASE_ID missing, skipping initialization");
    schemaReady = true;
    return;
  }

  try {
    // Add 5s timeout to background initialization
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Schema initialization timeout")), 5000)
    );

    await Promise.race([
      Promise.all([
        ensureCollection(appwriteConfig.documentsCollectionId, "Knowledge Documents"),
        ensureCollection(appwriteConfig.conversationsCollectionId, "Conversation Messages"),
        ensureDocumentAttributes(),
        ensureConversationAttributes(),
      ]),
      timeoutPromise,
    ]);

    console.log("[Appwrite Schema] Initialization complete");
    schemaReady = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[Appwrite Schema] Initialization failed:", message);
    schemaReady = true; // Mark ready to stop retrying
  }
};

export const ensureAppwriteSchema = async () => {
  // Return immediately if already initialized
  if (schemaReady) {
    return;
  }

  // Start background initialization if not already running
  if (!schemaInitializing) {
    schemaInitializing = true;
    initializeSchemaInBackground().catch((err) => {
      console.warn("[Appwrite Schema] Background initialization failed:", err instanceof Error ? err.message : err);
      schemaReady = true; // Mark ready anyway to avoid blocking
    });
  }

  // Don't wait - return immediately to unblock request
};
