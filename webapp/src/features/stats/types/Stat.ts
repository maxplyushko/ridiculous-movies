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
  averageRatingAsHost: number | null;
};

export type UserHostPreference = {
  userId: string;
  userName: string;
  overallAverage: number | null;
  mostFavHostName: string | null;
  mostFavHostAvg: number | null;
  leastFavHostName: string | null;
  leastFavHostAvg: number | null;
};

export type Stats = {
  bestMovies: MovieHighlight[];
  worstMovies: MovieHighlight[];
  usersByRating: UserStats[];
  userHostPreferences: UserHostPreference[];
};
