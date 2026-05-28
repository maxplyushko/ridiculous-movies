package com.ridiculousmovies.backend.web.dto;

import java.util.List;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.ridiculousmovies.backend.web.json.FlexibleIdDeserializer;

public record UpdateMovieRequest(
		String title,
		String description,
		@JsonDeserialize(using = FlexibleIdDeserializer.class) String ownerId,
		List<RatingInputDto> ratings
) {
}
