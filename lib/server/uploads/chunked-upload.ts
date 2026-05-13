import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

type UploadSession = {
  id: string;
  userId: string;
  fileName: string;
  mimeType: string;
  totalChunks: number;
  fileSize: number;
  createdAt: number;
  uploadDir: string;
};

const uploadSessions = new Map<string, UploadSession>();
const BASE_UPLOAD_DIR = "/tmp/knowledge-chunked-uploads";

const cleanupOldSessions = () => {
  const now = Date.now();
  uploadSessions.forEach((session, key) => {
    if (now - session.createdAt > 1000 * 60 * 30) {
      uploadSessions.delete(key);
      fs.rm(session.uploadDir, { recursive: true, force: true }).catch(() => undefined);
    }
  });
};

export const initChunkedUpload = async (input: {
  userId: string;
  fileName: string;
  mimeType: string;
  totalChunks: number;
  fileSize: number;
}) => {
  cleanupOldSessions();

  const uploadId = uuidv4();
  const uploadDir = path.join(BASE_UPLOAD_DIR, uploadId);
  await fs.mkdir(uploadDir, { recursive: true });

  uploadSessions.set(uploadId, {
    id: uploadId,
    userId: input.userId,
    fileName: input.fileName,
    mimeType: input.mimeType,
    totalChunks: input.totalChunks,
    fileSize: input.fileSize,
    createdAt: Date.now(),
    uploadDir,
  });

  return uploadId;
};

export const storeUploadChunk = async (input: {
  uploadId: string;
  chunkIndex: number;
  userId: string;
  chunkBuffer: Buffer;
}) => {
  const session = uploadSessions.get(input.uploadId);
  if (!session) {
    throw new Error("Upload session not found or expired.");
  }

  if (session.userId !== input.userId) {
    throw new Error("Unauthorized chunk upload request.");
  }

  const chunkPath = path.join(session.uploadDir, `${input.chunkIndex}.part`);
  await fs.writeFile(chunkPath, input.chunkBuffer);

  return {
    uploadId: input.uploadId,
    chunkIndex: input.chunkIndex,
  };
};

export const completeChunkedUpload = async (input: { uploadId: string; userId: string }) => {
  const session = uploadSessions.get(input.uploadId);

  if (!session) {
    throw new Error("Upload session not found or expired.");
  }

  if (session.userId !== input.userId) {
    throw new Error("Unauthorized completion request.");
  }

  const buffers: Buffer[] = [];
  for (let index = 0; index < session.totalChunks; index += 1) {
    const chunkPath = path.join(session.uploadDir, `${index}.part`);
    const chunkBuffer = await fs.readFile(chunkPath);
    buffers.push(chunkBuffer);
  }

  const fileBuffer = Buffer.concat(buffers);

  uploadSessions.delete(input.uploadId);
  await fs.rm(session.uploadDir, { recursive: true, force: true });

  return {
    fileBuffer,
    fileName: session.fileName,
    mimeType: session.mimeType,
    fileSize: session.fileSize,
  };
};
