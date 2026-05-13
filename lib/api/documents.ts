import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import { KnowledgeDocument } from "@/types/documents";

export async function getDocuments() {
  return apiClient<KnowledgeDocument[]>(API_ROUTES.documents, {
    method: "GET",
    cache: "no-store",
  });
}

export async function retryDocument(id: string) {
  return apiClient<{ id: string; status: string }>(`${API_ROUTES.documents}/${id}/retry`, {
    method: "POST",
  });
}

export async function deleteDocument(id: string) {
  return apiClient<{ id: string }>(`${API_ROUTES.documents}/${id}`, {
    method: "DELETE",
  });
}
