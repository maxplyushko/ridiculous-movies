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

export type OAuthLoginResponse = {
  accessToken: string;
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

export async function oauthLogin(idToken: string): Promise<OAuthLoginResponse> {
  return apiFetch<OAuthLoginResponse>("/api/auth/login", { method: "POST", body: { idToken } });
}

export async function telegramLogin(initData: string): Promise<OAuthLoginResponse> {
  return apiFetch<OAuthLoginResponse>("/api/auth/telegram", { method: "POST", body: { initData } });
}

export async function guestLogin(): Promise<OAuthLoginResponse> {
  return apiFetch<OAuthLoginResponse>("/api/auth/guest", { method: "POST" });
}
