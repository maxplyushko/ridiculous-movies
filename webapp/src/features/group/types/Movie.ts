import type {User} from "@/types/User";
import type {Rating} from "@/types/Rating.ts";
import type {TmdbMediaType} from "@/types/TmdbMovie";

export type Movie = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updateAt: string;
  owner: User;
  round: number;
  averageRating: number;
  ratings: Rating[];
  tmdbId?: number;
  tmdbMediaType?: TmdbMediaType;
};