import type { TmdbMediaType } from "@/types/TmdbMovie";

export interface PersonalMovie {
  id: string;
  title: string;
  description: string;
  tagline: string;
  rating: number | null;
  watched: boolean;
  inList: boolean;
  createdAt: string;
  updatedAt: string;
  tmdbId?: number;
  tmdbMediaType?: TmdbMediaType;
}
