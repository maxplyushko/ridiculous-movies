import {apiFetch} from "@/api/client.ts";

export type AuthResponse = {
  userId: string;
  userName: string;
  role: "user" | "admin";
  groupId: string;
  groupName: string;
  theme: "dark" | "light" | null;
  defaultPage: "list" | "watchlist" | null;
  lang: string | null;
  tmdbLang: "ru" | "en" | null;
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
  lang: string | null;
  tmdbLang: "ru" | "en" | null;
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

export async function getGoogleAuthUrl(): Promise<string> {
  const res = await apiFetch<{ url: string }>("/api/auth/google/url");
  return res.url;
}

export async function exchangeGoogleToken(token: string): Promise<OAuthLoginResponse> {
  return apiFetch<OAuthLoginResponse>(`/api/auth/google/token?token=${encodeURIComponent(token)}`);
}
