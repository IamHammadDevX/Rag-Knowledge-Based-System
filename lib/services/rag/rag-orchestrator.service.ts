import { groqService } from "@/lib/services/integrations/groq.service";

interface AskInput {
  question: string;
  sessionId: string;
  indexedDocumentCount: number;
}

export async function orchestrateRagAnswer(input: AskInput) {
  const llmDraft = await groqService.generateAnswer(input.question);

  return {
    sessionId: input.sessionId,
    answer: `${llmDraft} Current indexed docs in workspace: ${input.indexedDocumentCount}.`,
    sources: [],
    mode: "scaffold",
  };
}
