package com.ridiculousmovies.backend.tmdb;

import com.fasterxml.jackson.annotation.JsonProperty;

record TmdbMovie(
    long id,
    String title,
    String overview,
    @JsonProperty("vote_average") double voteAverage,
    @JsonProperty("release_date") String releaseDate,
    @JsonProperty("poster_path") String posterPath
) {}
