export type Role = "admin" | "member";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthPayload {
  user: AuthUser;
  sessionToken: string;
}
