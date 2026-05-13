export interface ChatMessageRecord {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  sources?: Array<Record<string, unknown>>;
}
