export const env = {
  appwriteEndpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "",
  appwriteProjectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "",
  appwriteDatabaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "",
  appwriteBucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID ?? "",
  pineconeApiKey: process.env.PINECONE_API_KEY ?? "",
  pineconeIndex: process.env.PINECONE_INDEX ?? "",
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY ?? "",
};

export const integrationStatus = {
  appwrite: Boolean(env.appwriteEndpoint && env.appwriteProjectId),
  pinecone: Boolean(env.pineconeApiKey && env.pineconeIndex),
  groq: Boolean(env.groqApiKey),
  huggingFace: Boolean(env.huggingfaceApiKey),
};
