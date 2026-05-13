import { ApiResponse } from "@/types/api";

export async function apiClient<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;

  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || payload.message || "Request failed");
  }

  return payload;
}
