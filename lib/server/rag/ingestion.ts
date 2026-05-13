import { createKnowledgeDocument, updateKnowledgeDocumentStatus } from "@/lib/server/integrations/appwrite-documents";
import { uploadFileToAppwriteStorage } from "@/lib/server/integrations/appwrite-storage";
import { generateEmbedding } from "@/lib/server/integrations/huggingface";
import { upsertVectors } from "@/lib/server/integrations/pinecone";
import { splitIntoChunks } from "@/lib/server/rag/chunker";
import { extractTextFromFile } from "@/lib/server/rag/text-extraction";

export const createAndIngestDocument = async (input: {
  userId: string;
  uploadedBy: string;
  fileName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}) => {
  const storageFile = await uploadFileToAppwriteStorage(input.buffer, input.fileName);

  const createdDocument = await createKnowledgeDocument({
    userId: input.userId,
    uploadedBy: input.uploadedBy,
    name: input.fileName,
    type: input.mimeType || "application/octet-stream",
    size: input.size,
    storageFileId: storageFile.id,
  });

  const runIngestion = async () => {
    try {
      const text = await extractTextFromFile(input.buffer, input.mimeType, input.fileName);
      const chunks = splitIntoChunks(text);

      if (!chunks.length) {
        await updateKnowledgeDocumentStatus(createdDocument.id, input.userId, "failed", {
          errorMessage: "No readable text extracted from file.",
          chunkCount: 0,
        });
        return;
      }

      const vectors: Array<{ id: string; values: number[]; metadata: Record<string, unknown> }> = [];

      for (let index = 0; index < chunks.length; index += 1) {
        const chunkText = chunks[index];
        const embedding = await generateEmbedding(chunkText);

        if (!embedding.length) {
          continue;
        }

        vectors.push({
          id: `${createdDocument.id}::${index}`,
          values: embedding,
          metadata: {
            documentId: createdDocument.id,
            userId: input.userId,
            fileName: input.fileName,
            chunkIndex: index,
            chunkText,
          },
        });

        if (vectors.length === 40 || index === chunks.length - 1) {
          await upsertVectors([...vectors]);
          vectors.length = 0;
        }
      }

      await updateKnowledgeDocumentStatus(createdDocument.id, input.userId, "indexed", {
        chunkCount: chunks.length,
        errorMessage: "",
      });
    } catch (error) {
      await updateKnowledgeDocumentStatus(createdDocument.id, input.userId, "failed", {
        chunkCount: 0,
        errorMessage: error instanceof Error ? error.message : "Ingestion failed.",
      });
    }
  };

  setTimeout(() => {
    runIngestion().catch(() => {
      // Best effort background processing
    });
  }, 10);

  return createdDocument;
};
