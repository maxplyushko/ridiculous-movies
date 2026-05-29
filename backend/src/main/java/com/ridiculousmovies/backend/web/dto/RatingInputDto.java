package com.ridiculousmovies.backend.web.dto;

import java.math.BigDecimal;

public record RatingInputDto(
    String userId,
    BigDecimal score
) {

}
