export type MovieHighlight = {
  id: string;
  title: string;
  host: string;
  averageRating: number;
};

export type UserStats = {
  id: string;
  name: string;
  averageRatingGiven: number | null;
  ratingCount: number;
};

export type Stats = {
  bestMovie: MovieHighlight;
  worstMovie: MovieHighlight;
  usersByRating: UserStats[];
};