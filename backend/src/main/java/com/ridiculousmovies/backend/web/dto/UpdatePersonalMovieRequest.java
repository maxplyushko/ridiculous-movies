package com.ridiculousmovies.backend.web.dto;

import java.math.BigDecimal;

public record UpdatePersonalMovieRequest(
    String title,
    String description,
    String tagline,
    BigDecimal rating,
    boolean watched,
    Boolean inList,
    Long tmdbId,
    String tmdbMediaType
) {}
