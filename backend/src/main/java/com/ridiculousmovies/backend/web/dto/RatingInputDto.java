package com.ridiculousmovies.backend.web.dto;

import java.math.BigDecimal;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.ridiculousmovies.backend.web.json.FlexibleIdDeserializer;

public record RatingInputDto(
		@JsonDeserialize(using = FlexibleIdDeserializer.class) String userId,
		BigDecimal score
) {
}
