import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/server/auth/session-token";

type CookieMap = Record<string, string>;

const parseCookies = (cookieHeader: string | null): CookieMap => {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<CookieMap>((acc, pair) => {
    const [rawKey, ...rest] = pair.trim().split("=");
    if (!rawKey || rest.length === 0) {
      return acc;
    }

    acc[rawKey] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
};

export const getSessionUserFromRequest = (request: Request) => {
  const cookies = parseCookies(request.headers.get("cookie"));
  const token = cookies[AUTH_COOKIE_NAME];
  const session = verifySessionToken(token);

  if (!session) {
    return null;
  }

  return {
    id: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
    appwriteSessionId: session.appwriteSessionId,
  };
};
