package com.ridiculousmovies.backend.web.dto;

import java.util.List;

public record TmdbMovieDetailsResponse(
    long id,
    String title,
    String overview,
    String tagline,
    double tmdbScore,
    String releaseYear,
    String posterUrl,
    String director,
    Integer numberOfSeasons,
    List<String> genres,
    List<TmdbCastMemberResponse> cast
) {}
