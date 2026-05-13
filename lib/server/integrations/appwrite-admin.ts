import { Client, Databases, Storage, Users, ID, Query } from "node-appwrite";

const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !projectId || !apiKey) {
  console.warn("Appwrite env is incomplete. Live integrations may fail until env vars are set.");
}

const adminClient = new Client()
  .setEndpoint(endpoint || "")
  .setProject(projectId || "")
  .setKey(apiKey || "");

export const appwriteDatabases = new Databases(adminClient);
export const appwriteStorage = new Storage(adminClient);
export const appwriteUsers = new Users(adminClient);

export const appwriteId = ID;
export const appwriteQuery = Query;

export const appwriteConfig = {
  endpoint: endpoint || "",
  projectId: projectId || "",
  apiKey: apiKey || "",
  databaseId:
    process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "",
  bucketId: process.env.APPWRITE_BUCKET_ID || process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "",
  documentsCollectionId: process.env.APPWRITE_COLLECTION_DOCUMENTS || "rag_documents",
  conversationsCollectionId: process.env.APPWRITE_COLLECTION_CONVERSATIONS || "rag_conversations",
};
