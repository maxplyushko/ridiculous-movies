package com.ridiculousmovies.backend.web.dto;

public record TmdbMovieResponse(
    long id,
    String title,
    String overview,
    double tmdbScore,
    String releaseYear,
    String posterUrl
) {}
