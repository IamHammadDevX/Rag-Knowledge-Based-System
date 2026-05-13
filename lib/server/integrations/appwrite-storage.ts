import { appwriteConfig, appwriteStorage, appwriteId } from "@/lib/server/integrations/appwrite-admin";

export const uploadFileToAppwriteStorage = async (buffer: Buffer, fileName: string) => {
  // In node-appwrite v24+, convert Buffer to File object
  const blob = new Blob([buffer]);
  const file = new File([blob], fileName);
  
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

export const deleteFileFromAppwriteStorage = async (fileId: string) => {
  await appwriteStorage.deleteFile(appwriteConfig.bucketId, fileId);
};
