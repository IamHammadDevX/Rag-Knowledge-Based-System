import crypto from "crypto";

export const AUTH_COOKIE_NAME = "rag_scaffold_session";

type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: "admin" | "member";
  appwriteSessionId?: string;
  issuedAt: number;
};

const getSecret = () => process.env.APP_AUTH_SECRET || "development-auth-secret";

export const signSessionToken = (payload: Omit<SessionPayload, "issuedAt">) => {
  const fullPayload: SessionPayload = {
    ...payload,
    issuedAt: Date.now(),
  };

  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
};

export const verifySessionToken = (token: string | undefined) => {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  const expectedSignature = crypto
    .createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("base64url");

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8")) as SessionPayload;
  } catch {
    return null;
  }
};
