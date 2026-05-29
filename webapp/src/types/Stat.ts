export type MovieHighlight = {
  id: string;
  title: string;
  host: string;
  averageRating: number;
  place: number;
};

export type UserStats = {
  id: string;
  name: string;
  averageRatingGiven: number | null;
  ratingCount: number;
};

export type Stats = {
  bestMovies: MovieHighlight[];
  worstMovies: MovieHighlight[];
  usersByRating: UserStats[];
};
