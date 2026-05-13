const pineconeApiKey = process.env.PINECONE_API_KEY || process.env.PINECONE_API;
const pineconeHost = process.env.PINECONE_HOST;
const pineconeNamespace = process.env.PINECONE_NAMESPACE || "default";

type VectorPayload = {
  id: string;
  values: number[];
  metadata: Record<string, unknown>;
};

const getHeaders = () => {
  if (!pineconeApiKey) {
    throw new Error("PINECONE_API_KEY is missing.");
  }

  return {
    "Api-Key": pineconeApiKey,
    "Content-Type": "application/json",
  };
};

const getHost = () => {
  if (!pineconeHost) {
    throw new Error("PINECONE_HOST is missing.");
  }

  return pineconeHost.replace(/\/$/, "");
};

export const upsertVectors = async (vectors: VectorPayload[], namespace = pineconeNamespace) => {
  const response = await fetch(`${getHost()}/vectors/upsert`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      vectors,
      namespace,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Pinecone upsert failed.");
  }

  return data;
};

export const queryVectors = async (input: {
  vector: number[];
  topK?: number;
  namespace?: string;
  filter?: Record<string, unknown>;
}) => {
  const response = await fetch(`${getHost()}/query`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      vector: input.vector,
      topK: input.topK ?? 6,
      includeMetadata: true,
      namespace: input.namespace || pineconeNamespace,
      filter: input.filter,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Pinecone query failed.");
  }

  return (data?.matches || []) as Array<{
    id: string;
    score: number;
    metadata?: Record<string, unknown>;
  }>;
};

export const deleteVectorsByDocument = async (documentId: string, namespace = pineconeNamespace) => {
  const response = await fetch(`${getHost()}/vectors/delete`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      namespace,
      filter: {
        documentId: { $eq: documentId },
      },
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || data?.error || "Pinecone delete failed.");
  }
};
