import { createConversationMessage, listConversationMessages } from "@/lib/server/integrations/appwrite-documents";
import { generateGroqCompletion } from "@/lib/server/integrations/groq";
import { generateEmbedding } from "@/lib/server/integrations/huggingface";
import { queryVectors } from "@/lib/server/integrations/pinecone";

export const answerQuestionWithRag = async (input: {
  userId: string;
  question: string;
  sessionId: string;
}) => {
  const questionEmbedding = await generateEmbedding(input.question);

  const matches = await queryVectors({
    vector: questionEmbedding,
    topK: 6,
    filter: {
      userId: { $eq: input.userId },
    },
  });

  const sources = matches.map((match) => ({
    id: match.id,
    score: match.score,
    documentId: String(match.metadata?.documentId || ""),
    fileName: String(match.metadata?.fileName || ""),
    chunkText: String(match.metadata?.chunkText || ""),
  }));

  const history = await listConversationMessages(input.userId, input.sessionId);
  const recentHistory = history.slice(-8).map((item) => ({ role: item.role, content: item.content }));

  await createConversationMessage({
    userId: input.userId,
    sessionId: input.sessionId,
    role: "user",
    content: input.question,
  });

  const context = sources
    .map((source, index) => `Source ${index + 1} (${source.fileName || "document"}):\n${source.chunkText}`)
    .join("\n\n");

  const completion = await generateGroqCompletion([
    {
      role: "system",
      content:
        "You are an enterprise knowledge assistant. Answer based on retrieved context. If context is insufficient, say so clearly.",
    },
    ...recentHistory,
    {
      role: "user",
      content: `Question: ${input.question}\n\nRetrieved Context:\n${context || "No indexed context found."}`,
    },
  ]);

  await createConversationMessage({
    userId: input.userId,
    sessionId: input.sessionId,
    role: "assistant",
    content: completion.content,
    sources,
  });

  return {
    sessionId: input.sessionId,
    answer: completion.content,
    sources,
    mode: "live-rag",
  };
};
