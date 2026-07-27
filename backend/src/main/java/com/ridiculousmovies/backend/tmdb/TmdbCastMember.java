package com.ridiculousmovies.backend.tmdb;

import com.fasterxml.jackson.annotation.JsonProperty;

record TmdbCastMember(
    long id,
    String name,
    String character,
    @JsonProperty("profile_path") String profilePath
) {}
