import {apiFetch} from "./client.ts";

export {PRIVATE_USE_MESSAGE} from "./messages.ts";

export type AuthResponse = {
  userId: string;
  userName: string;
  role: "user" | "admin";
  groupId: string;
  groupName: string;
  theme: "dark" | "light" | null;
  defaultPage: "list" | "watchlist" | null;
};

export async function checkAccess(): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth");
}
