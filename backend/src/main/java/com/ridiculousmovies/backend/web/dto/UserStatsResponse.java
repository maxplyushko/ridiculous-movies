package com.ridiculousmovies.backend.web.dto;

public record UserStatsResponse(
    String id,
    String name,
    Double averageRatingGiven,
    long ratingCount
) {

}
