import { appwriteConfig, appwriteUsers, appwriteId, appwriteQuery } from "@/lib/server/integrations/appwrite-admin";

type SessionResponse = {
  $id: string;
  userId: string;
};

const createEmailPasswordSession = async (email: string, password: string) => {
  const response = await fetch(`${appwriteConfig.endpoint}/account/sessions/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": appwriteConfig.projectId,
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Unable to create Appwrite session.");
  }

  return data as SessionResponse;
};

export const registerWithAppwrite = async (name: string, email: string, password: string) => {
  try {
    await appwriteUsers.create(appwriteId.unique(), email, undefined, password, name);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    if (message.includes("already exists") || message.includes("409")) {
      throw new Error("User already exists.");
    }
    throw error;
  }

  const session = await createEmailPasswordSession(email, password);
  const user = await appwriteUsers.get(session.userId);

  return {
    sessionId: session.$id,
    user: {
      id: user.$id,
      name: user.name,
      email: user.email,
      role: "admin" as const,
    },
  };
};

export const loginWithAppwrite = async (email: string, password: string) => {
  const session = await createEmailPasswordSession(email, password);
  const user = await appwriteUsers.get(session.userId);

  return {
    sessionId: session.$id,
    user: {
      id: user.$id,
      name: user.name,
      email: user.email,
      role: "admin" as const,
    },
  };
};

export const logoutFromAppwrite = async (sessionId: string | undefined) => {
  if (!sessionId) {
    return;
  }

  await fetch(`${appwriteConfig.endpoint}/users/${sessionId}/sessions`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": appwriteConfig.projectId,
      "X-Appwrite-Key": appwriteConfig.apiKey,
    },
  }).catch(() => {
    // Non-blocking for logout fallback
  });
};

export const userExistsByEmail = async (email: string) => {
  const result = await appwriteUsers.list([appwriteQuery.equal("email", email)]);
  return result.total > 0;
};
