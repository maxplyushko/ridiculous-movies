import { apiFetch } from "@/api/client";
import type { PersonalMovie } from "../types/PersonalMovie";

export interface PersonalMoviePayload {
  title: string;
  description: string;
  rating: number | null;
}

export interface UpdatePersonalMoviePayload extends PersonalMoviePayload {
  watched: boolean;
}

export async function fetchPersonalList(): Promise<PersonalMovie[]> {
  return apiFetch<PersonalMovie[]>("/api/personal-list");
}

export async function addPersonalMovie(data: PersonalMoviePayload): Promise<PersonalMovie> {
  return apiFetch<PersonalMovie>("/api/personal-list", { method: "POST", body: data });
}

export async function editPersonalMovie(id: string, data: UpdatePersonalMoviePayload): Promise<PersonalMovie> {
  return apiFetch<PersonalMovie>(`/api/personal-list/${id}`, { method: "PUT", body: data });
}

export async function deletePersonalMovie(id: string): Promise<void> {
  await apiFetch<void>(`/api/personal-list/${id}`, { method: "DELETE" });
}
