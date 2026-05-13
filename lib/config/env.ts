export const env = {
  appwriteEndpoint: process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "",
  appwriteProjectId: process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "",
  appwriteApiKey: process.env.APPWRITE_API_KEY || "",
  appwriteDatabaseId: process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "",
  appwriteBucketId: process.env.APPWRITE_BUCKET_ID || process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "",
  pineconeApiKey: process.env.PINECONE_API_KEY || process.env.PINECONE_API || "",
  pineconeHost: process.env.PINECONE_HOST || "",
  pineconeIndex: process.env.PINECONE_INDEX_NAME || process.env.PINECONE_INDEX || "",
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "",
  huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY || "",
  huggingfaceModel: process.env.HUGGINGFACE_EMBED_MODEL || "",
};

export const integrationStatus = {
  appwrite: Boolean(env.appwriteEndpoint && env.appwriteProjectId && env.appwriteApiKey),
  pinecone: Boolean(env.pineconeApiKey && env.pineconeHost),
  groq: Boolean(env.groqApiKey),
  huggingFace: Boolean(env.huggingfaceApiKey),
};
