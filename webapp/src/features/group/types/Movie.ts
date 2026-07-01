import type {User} from "@/types/User";
import type {Rating} from "@/types/Rating.ts";

export type Movie = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updateAt: string;
  owner: User;
  round: number;
  averageRating: number;
  ratings: Rating[]
};