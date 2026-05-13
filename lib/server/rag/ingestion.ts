import {
  createKnowledgeDocument,
  getKnowledgeDocumentById,
  updateKnowledgeDocumentStatus,
} from "@/lib/server/integrations/appwrite-documents";
import {
  downloadFileFromAppwriteStorage,
  uploadFileToAppwriteStorage,
} from "@/lib/server/integrations/appwrite-storage";
import { deleteVectorsByDocument, upsertVectors } from "@/lib/server/integrations/pinecone";
import { generateEmbedding } from "@/lib/server/integrations/huggingface";
import { splitIntoChunks } from "@/lib/server/rag/chunker";
import { extractTextFromFile } from "@/lib/server/rag/text-extraction";

type RunIngestionInput = {
  documentId: string;
  userId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
};

const runIngestionForDocument = async (input: RunIngestionInput) => {
  try {
    await deleteVectorsByDocument(input.documentId).catch(() => undefined);

    const extraction = await extractTextFromFile(input.buffer, input.mimeType, input.fileName);
    const chunks = splitIntoChunks(extraction.text);

    if (!chunks.length) {
      await updateKnowledgeDocumentStatus(input.documentId, input.userId, "failed", {
        errorMessage: "No readable text extracted from file.",
        chunkCount: 0,
      });
      return;
    }

    const vectors: Array<{ id: string; values: number[]; metadata: Record<string, unknown> }> = [];
    let indexedChunkCount = 0;

    for (let index = 0; index < chunks.length; index += 1) {
      const chunkText = chunks[index];
      const embedding = await generateEmbedding(chunkText);

      if (!embedding.length) {
        continue;
      }

      indexedChunkCount += 1;

      vectors.push({
        id: `${input.documentId}::${index}`,
        values: embedding,
        metadata: {
          documentId: input.documentId,
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

    if (indexedChunkCount === 0) {
      await updateKnowledgeDocumentStatus(input.documentId, input.userId, "failed", {
        chunkCount: 0,
        errorMessage:
          "Text was extracted but embeddings could not be generated. Please retry in a few moments.",
      });
      return;
    }

    await updateKnowledgeDocumentStatus(input.documentId, input.userId, "indexed", {
      chunkCount: indexedChunkCount,
      errorMessage: extraction.warning || "",
    });
  } catch (error) {
    await updateKnowledgeDocumentStatus(input.documentId, input.userId, "failed", {
      chunkCount: 0,
      errorMessage: error instanceof Error ? error.message : "Ingestion failed.",
    });
  }
};

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

  setTimeout(() => {
    runIngestionForDocument({
      documentId: createdDocument.id,
      userId: input.userId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      buffer: input.buffer,
    }).catch(() => {
      // Best effort background processing
    });
  }, 10);

  return createdDocument;
};

export const retryDocumentIngestion = async (input: { documentId: string; userId: string }) => {
  const document = await getKnowledgeDocumentById(input.documentId, input.userId);

  await updateKnowledgeDocumentStatus(input.documentId, input.userId, "processing", {
    chunkCount: 0,
    errorMessage: "",
  });

  const fileBuffer = await downloadFileFromAppwriteStorage(document.storageFileId || "");

  setTimeout(() => {
    runIngestionForDocument({
      documentId: input.documentId,
      userId: input.userId,
      fileName: document.name,
      mimeType: document.type,
      buffer: fileBuffer,
    }).catch(() => {
      // Best effort background processing
    });
  }, 10);

  return {
    id: input.documentId,
    status: "processing",
  };
};
