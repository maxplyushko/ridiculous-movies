package com.ridiculousmovies.backend.tmdb;

import com.fasterxml.jackson.annotation.JsonProperty;

record TmdbPerson(
    long id,
    String name,
    String biography,
    String birthday,
    @JsonProperty("place_of_birth") String placeOfBirth,
    @JsonProperty("profile_path") String profilePath,
    @JsonProperty("movie_credits") TmdbPersonMovieCredits movieCredits
) {}
