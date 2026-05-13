import { API_ROUTES } from "@/lib/api/routes";

const CHUNK_SIZE = 1024 * 1024;

type UploadInitResponse = {
  uploadId: string;
};

const initUpload = async (file: File): Promise<string> => {
  const response = await fetch(`/api${API_ROUTES.uploadInit}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      totalChunks: Math.ceil(file.size / CHUNK_SIZE),
      fileSize: file.size,
    }),
  });

  const payload = await response.json();
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || "Failed to initialize upload.");
  }

  return (payload.data as UploadInitResponse).uploadId;
};

const uploadChunk = async (uploadId: string, chunkIndex: number, chunk: Blob) => {
  const formData = new FormData();
  formData.append("uploadId", uploadId);
  formData.append("chunkIndex", String(chunkIndex));
  formData.append("chunk", chunk, `chunk-${chunkIndex}.part`);

  const response = await fetch(`/api${API_ROUTES.uploadChunk}`, {
    method: "POST",
    body: formData,
  });

  const payload = await response.json();
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || `Failed at chunk ${chunkIndex + 1}.`);
  }
};

const completeUpload = async (uploadId: string) => {
  const response = await fetch(`/api${API_ROUTES.uploadComplete}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uploadId }),
  });

  const payload = await response.json();
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || "Failed to complete upload.");
  }

  return payload.data;
};

export const uploadFileInChunks = async (
  file: File,
  onProgress?: (value: number) => void
) => {
  const uploadId = await initUpload(file);
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(file.size, start + CHUNK_SIZE);
    const chunk = file.slice(start, end);

    await uploadChunk(uploadId, chunkIndex, chunk);

    if (onProgress) {
      onProgress(Math.round(((chunkIndex + 1) / totalChunks) * 100));
    }
  }

  return completeUpload(uploadId);
};
