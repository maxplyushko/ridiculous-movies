import type {User} from "@/types/User";
import {apiFetch} from "@/api/client";

export async function fetchUsers(): Promise<User[]> {
  return apiFetch<User[]>("/api/users");
}

export async function savePreferences(prefs: { theme?: "dark" | "light"; defaultPage?: "list" | "watchlist"; lang?: string; tmdbLang?: string }): Promise<void> {
  await apiFetch<void>("/api/users/me/preferences", { method: "PUT", body: prefs });
}