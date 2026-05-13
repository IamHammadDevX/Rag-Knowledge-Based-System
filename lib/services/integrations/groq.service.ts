import { IntegrationPlaceholderResult } from "@/lib/services/integrations/appwrite.service";

class GroqService {
  health(): IntegrationPlaceholderResult {
    return {
      ready: false,
      message: "Groq LLM service scaffolded. Configure GROQ_API_KEY to enable.",
    };
  }

  async generateAnswer(question: string): Promise<string> {
    return `Scaffold response: answer generation for \"${question}\" will use Groq once enabled.`;
  }
}

export const groqService = new GroqService();
