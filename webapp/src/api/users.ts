import type {User} from "../types/User";
import {apiFetch} from "./client";

export async function fetchUsers(): Promise<User[]> {
  return apiFetch<User[]>("/api/users");
}

export async function savePreferences(prefs: { theme?: "dark" | "light"; defaultPage?: "list" | "watchlist" }): Promise<void> {
  await apiFetch<void>("/api/users/me/preferences", { method: "PUT", body: prefs });
}