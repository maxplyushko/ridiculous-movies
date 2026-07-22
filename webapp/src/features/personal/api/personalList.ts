import { apiFetch } from "@/api/client";
import type { PersonalMovie } from "../types/PersonalMovie";
import type { TmdbMediaType } from "@/types/TmdbMovie";

export interface PersonalMoviePayload {
  title: string;
  description: string;
  rating: number | null;
  tmdbId?: number | null;
  tmdbMediaType?: TmdbMediaType | null;
}

export interface UpdatePersonalMoviePayload extends PersonalMoviePayload {
  watched: boolean;
}

export async function fetchPersonalList(): Promise<PersonalMovie[]> {
  return apiFetch<PersonalMovie[]>("/api/personal-list");
}

export async function fetchPersonalListForUser(userId: string): Promise<PersonalMovie[]> {
  return apiFetch<PersonalMovie[]>(`/api/personal-list/user/${userId}`);
}

export async function addPersonalMovie(data: PersonalMoviePayload): Promise<PersonalMovie> {
  return apiFetch<PersonalMovie>("/api/personal-list", { method: "POST", body: data });
}

export async function editPersonalMovie(id: string, data: UpdatePersonalMoviePayload): Promise<PersonalMovie> {
  return apiFetch<PersonalMovie>(`/api/personal-list/${id}`, { method: "PUT", body: data });
}

export async function fetchGroupMembersWhoAdded(tmdbId?: number | null, title?: string): Promise<string[]> {
  const params = new URLSearchParams();
  if (tmdbId != null) params.set("tmdbId", String(tmdbId));
  if (title) params.set("title", title);
  return apiFetch<string[]>(`/api/personal-list/added-by?${params.toString()}`);
}

export async function deletePersonalMovie(id: string): Promise<void> {
  await apiFetch<void>(`/api/personal-list/${id}`, { method: "DELETE" });
}
