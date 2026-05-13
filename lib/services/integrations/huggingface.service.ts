import { IntegrationPlaceholderResult } from "@/lib/services/integrations/appwrite.service";

class HuggingFaceService {
  health(): IntegrationPlaceholderResult {
    return {
      ready: false,
      message: "HuggingFace embeddings scaffolded. Configure HUGGINGFACE_API_KEY to enable.",
    };
  }

  async embedText(): Promise<IntegrationPlaceholderResult> {
    return {
      ready: false,
      message: "Embedding generation is disabled in scaffold mode.",
    };
  }
}

export const huggingFaceService = new HuggingFaceService();
