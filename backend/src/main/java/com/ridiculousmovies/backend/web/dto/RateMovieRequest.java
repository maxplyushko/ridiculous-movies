package com.ridiculousmovies.backend.web.dto;

import java.math.BigDecimal;

public record RateMovieRequest(
    BigDecimal score
) {

}
