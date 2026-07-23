package com.ridiculousmovies.backend.web.dto;

import java.math.BigDecimal;

public record PersonalMovieStateRequest(
    Long tmdbId,
    String title,
    String description,
    String tmdbMediaType,
    Boolean inList,
    Boolean watched,
    BigDecimal rating
) {}
