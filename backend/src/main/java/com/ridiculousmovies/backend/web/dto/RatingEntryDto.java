package com.ridiculousmovies.backend.web.dto;

import java.math.BigDecimal;

public record RatingEntryDto(String id, UserRefDto user, BigDecimal score) {
}
