package com.ridiculousmovies.backend.web.dto;

import java.math.BigDecimal;

public record UpdateWatchlistMovieRequest(
    String title,
    String description,
    BigDecimal rating,
    boolean watched
) {}
