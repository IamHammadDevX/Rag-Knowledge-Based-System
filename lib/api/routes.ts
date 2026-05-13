export const API_ROUTES = {
  health: "/health",
  login: "/auth/login",
  register: "/auth/register",
  logout: "/auth/logout",
  documents: "/documents",
  ask: "/chat/ask",
  chatHistory: "/chat/history",
  uploadInit: "/uploads/init",
  uploadChunk: "/uploads/chunk",
  uploadComplete: "/uploads/complete",
} as const;
