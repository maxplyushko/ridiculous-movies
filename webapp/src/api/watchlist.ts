import { apiFetch } from "./client";
import type { WatchlistMovie } from "../types/WatchlistMovie";

export interface WatchlistMoviePayload {
  title: string;
  description: string;
  rating: number | null;
}

export interface UpdateWatchlistMoviePayload extends WatchlistMoviePayload {
  watched: boolean;
}

export async function fetchWatchlist(): Promise<WatchlistMovie[]> {
  return apiFetch<WatchlistMovie[]>("/api/watchlist");
}

export async function addWatchlistMovie(data: WatchlistMoviePayload): Promise<WatchlistMovie> {
  return apiFetch<WatchlistMovie>("/api/watchlist", { method: "POST", body: data });
}

export async function editWatchlistMovie(id: string, data: UpdateWatchlistMoviePayload): Promise<WatchlistMovie> {
  return apiFetch<WatchlistMovie>(`/api/watchlist/${id}`, { method: "PUT", body: data });
}

export async function deleteWatchlistMovie(id: string): Promise<void> {
  await apiFetch<void>(`/api/watchlist/${id}`, { method: "DELETE" });
}
