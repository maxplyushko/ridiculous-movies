package com.ridiculousmovies.backend.web.dto;

import java.math.BigDecimal;

public record RatingEntryDto(Long id, UserRefDto user, BigDecimal score) {
}
