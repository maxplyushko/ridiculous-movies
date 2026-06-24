import type {Movie} from "./Movie.ts";

export type MovieGroup = {
  groupId: number;
  movies: Movie[];
};

export type MovieGroupsResponse = {
  currentRound: number;
  maxRound: number;
  lastRound: number;
  groups: MovieGroup[];
};
