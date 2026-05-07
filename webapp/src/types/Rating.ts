import type {User} from "./User.ts";

export type Rating = {
  id: string;
  score: number;
  user: User;
};