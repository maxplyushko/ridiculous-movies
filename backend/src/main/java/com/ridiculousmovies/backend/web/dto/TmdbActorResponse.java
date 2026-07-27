package com.ridiculousmovies.backend.web.dto;

import java.util.List;

public record TmdbActorResponse(
    long id,
    String name,
    String biography,
    String birthday,
    String placeOfBirth,
    String profileUrl,
    List<TmdbMovieResponse> knownFor
) {}
