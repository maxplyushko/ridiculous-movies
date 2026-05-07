import type { Movie } from "./Movie.ts";
import type {User} from "./User.ts";

export type MovieGroup = {
  groupId: number;
  movies: Movie[];
};

export type MovieGroupsResponse = {
  currentRound: number;
  usersLeft: User[];
  groups: MovieGroup[];
};