package com.ridiculousmovies.backend.web.dto;

import java.math.BigDecimal;

public record CreatePersonalMovieRequest(
    String title,
    String description,
    BigDecimal rating
) {}
