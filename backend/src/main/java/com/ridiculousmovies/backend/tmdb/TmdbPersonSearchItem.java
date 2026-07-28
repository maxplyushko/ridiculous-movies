package com.ridiculousmovies.backend.tmdb;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

record TmdbPersonSearchItem(
    long id,
    String name,
    @JsonProperty("profile_path") String profilePath,
    @JsonProperty("known_for_department") String knownForDepartment,
    @JsonProperty("known_for") List<TmdbMultiSearchItem> knownFor
) {}
