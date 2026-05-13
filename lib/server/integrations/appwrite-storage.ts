import { appwriteConfig, appwriteStorage, appwriteId } from "@/lib/server/integrations/appwrite-admin";

export const uploadFileToAppwriteStorage = async (buffer: Buffer, fileName: string) => {
  const file = new File([buffer], fileName, {
    type: "application/octet-stream",
  });

  const uploadedFile = await appwriteStorage.createFile(
    appwriteConfig.bucketId,
    appwriteId.unique(),
    file
  );

  return {
    id: uploadedFile.$id,
    name: uploadedFile.name,
    size: uploadedFile.sizeOriginal,
  };
};

export const downloadFileFromAppwriteStorage = async (fileId: string) => {
  if (!fileId) {
    throw new Error("Missing storage file id for reindex.");
  }

  const response = await fetch(
    `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucketId}/files/${fileId}/download`,
    {
      method: "GET",
      headers: {
        "X-Appwrite-Project": appwriteConfig.projectId,
        "X-Appwrite-Key": appwriteConfig.apiKey,
      },
    }
  );

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || "Failed to download file from Appwrite storage.");
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

export const deleteFileFromAppwriteStorage = async (fileId: string) => {
  await appwriteStorage.deleteFile(appwriteConfig.bucketId, fileId);
};
