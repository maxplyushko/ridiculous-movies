import type { User } from "./User";
import type {Rating} from "./Rating.ts";

export type Movie = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updateAt: string;
  owner: User;
  averageRating: number;
  ratings: [ Rating ]
};