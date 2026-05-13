import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import { ChatMessageRecord } from "@/types/chat";

export const askRagQuestion = async (input: { question: string; sessionId: string }) => {
  return apiClient<{ answer: string; sources: Array<Record<string, unknown>>; sessionId: string }>(
    API_ROUTES.ask,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
};

export const getChatHistory = async (sessionId: string) => {
  return apiClient<ChatMessageRecord[]>(`${API_ROUTES.chatHistory}?sessionId=${encodeURIComponent(sessionId)}`, {
    method: "GET",
    cache: "no-store",
  });
};
