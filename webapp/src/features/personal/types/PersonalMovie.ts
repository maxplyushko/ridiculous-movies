import type { TmdbMediaType } from "@/types/TmdbMovie";

export interface PersonalMovie {
  id: string;
  title: string;
  description: string;
  rating: number | null;
  watched: boolean;
  createdAt: string;
  updatedAt: string;
  tmdbId?: number;
  tmdbMediaType?: TmdbMediaType;
  alreadyAddedBy?: string | null;
}
