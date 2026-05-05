import type {User} from "./User.ts";

export type Rating = {
  id: number;
  score: number;
  user: User;
};