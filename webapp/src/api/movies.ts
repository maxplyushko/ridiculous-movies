import type {Movie} from "../types/Movie";
import type {MovieGroupsResponse} from "../types/MovieGroup";
import {apiFetch} from "./client";

const BASE = "/api/movies";

export type MovieFormPayload = {
  title: string;
  description: string;
  ownerId: string;
  round?: number;
  ratings: { userId: string; score: number }[];
};

export type MovieListParams = {
  filter?: "top_rating" | "lowest_rating";
  sort?: "asc" | "desc";
  minRatings?: number;
  requireAllUsers?: boolean;
};

export async function fetchMovieGroups(
    params: MovieListParams = {}
): Promise<MovieGroupsResponse> {
  const query = new URLSearchParams(
      Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
      )
  ).toString();

  const url = query ? `${BASE}/groups?${query}` : `${BASE}/groups`;
  return apiFetch<MovieGroupsResponse>(url);
}

export async function addMovie(data: MovieFormPayload): Promise<Movie> {
  return apiFetch<Movie>(BASE, {method: "POST", body: data});
}

export async function editMovie(movieId: string, data: MovieFormPayload): Promise<Movie> {
  return apiFetch<Movie>(`${BASE}/${movieId}`, {method: "PUT", body: data});
}

export async function deleteMovie(movieId: string): Promise<void> {
  return apiFetch<void>(`${BASE}/${movieId}`, {method: "DELETE"});
}