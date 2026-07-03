export type TmdbMediaType = "movie" | "tv";

export type TmdbMovie = {
  id: number;
  title: string;
  overview: string;
  tmdbScore: number;
  releaseYear: string;
  posterUrl: string | null;
  mediaType: TmdbMediaType;
};

export type TmdbCastMember = {
  name: string;
  character: string | null;
  profileUrl: string | null;
};

export type TmdbMovieDetails = TmdbMovie & {
  director: string | null;
  tagline: string | null;
  numberOfSeasons: number | null;
  genres: string[];
  cast: TmdbCastMember[];
};
