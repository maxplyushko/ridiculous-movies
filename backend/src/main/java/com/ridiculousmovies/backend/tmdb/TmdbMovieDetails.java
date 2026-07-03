package com.ridiculousmovies.backend.tmdb;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

record TmdbMovieDetails(
    long id,
    String title,
    String overview,
    String tagline,
    @JsonProperty("vote_average") double voteAverage,
    @JsonProperty("release_date") String releaseDate,
    @JsonProperty("poster_path") String posterPath,
    List<TmdbGenre> genres,
    TmdbCredits credits
) {}
