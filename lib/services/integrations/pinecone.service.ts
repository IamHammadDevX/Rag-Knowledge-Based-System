import { IntegrationPlaceholderResult } from "@/lib/services/integrations/appwrite.service";

class PineconeService {
  health(): IntegrationPlaceholderResult {
    return {
      ready: false,
      message: "Pinecone vector layer scaffolded. Configure PINECONE_API_KEY and PINECONE_INDEX.",
    };
  }

  async upsertVectors(): Promise<IntegrationPlaceholderResult> {
    return {
      ready: false,
      message: "Vector upsert is disabled in scaffold mode.",
    };
  }
}

export const pineconeService = new PineconeService();
