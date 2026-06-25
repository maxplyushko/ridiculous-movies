package com.ridiculousmovies.backend.web.dto;

import java.math.BigDecimal;

public record CreateWatchlistMovieRequest(
    String title,
    String description,
    BigDecimal rating
) {}
