export interface IntegrationPlaceholderResult {
  ready: boolean;
  message: string;
  metadata?: Record<string, unknown>;
}

class AppwriteService {
  health(): IntegrationPlaceholderResult {
    return {
      ready: false,
      message: "Appwrite integration scaffolded. Add keys to enable live auth/database/storage.",
    };
  }

  async createSession(): Promise<IntegrationPlaceholderResult> {
    return {
      ready: false,
      message: "Session creation is disabled in scaffold mode.",
    };
  }
}

export const appwriteService = new AppwriteService();
