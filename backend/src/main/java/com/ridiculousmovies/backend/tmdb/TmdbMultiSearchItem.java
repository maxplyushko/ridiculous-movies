package com.ridiculousmovies.backend.tmdb;

import com.fasterxml.jackson.annotation.JsonProperty;

record TmdbMultiSearchItem(
    long id,
    @JsonProperty("media_type") String mediaType,
    String title,
    String name,
    String overview,
    @JsonProperty("vote_average") double voteAverage,
    @JsonProperty("release_date") String releaseDate,
    @JsonProperty("first_air_date") String firstAirDate,
    @JsonProperty("poster_path") String posterPath
) {}
