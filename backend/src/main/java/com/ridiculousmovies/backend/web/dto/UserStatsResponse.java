package com.ridiculousmovies.backend.web.dto;

public record UserStatsResponse(
		Long id,
		String name,
		Double averageRatingGiven,
		long ratingCount
) {
}
