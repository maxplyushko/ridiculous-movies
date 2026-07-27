import type { TmdbMovie } from "@/types/TmdbMovie";

export type TmdbActor = {
  id: number;
  name: string;
  biography: string | null;
  birthday: string | null;
  placeOfBirth: string | null;
  profileUrl: string | null;
  knownFor: TmdbMovie[];
};
