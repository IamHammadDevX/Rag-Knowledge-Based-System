export type DocumentStatus = "indexed" | "processing" | "failed";

export interface KnowledgeDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  status: DocumentStatus;
  createdAt: string;
  uploadedBy: string;
}
