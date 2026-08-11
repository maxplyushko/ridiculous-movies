package com.ridiculousmovies.backend.web.dto;

import java.time.Instant;
import java.util.List;

public record MovieResponse(
    String id,
    String title,
    String description,
    String tagline,
    Instant createdAt,
    Instant updatedAt,
    UserRefDto owner,
    Integer round,
    Double averageRating,
    List<RatingEntryDto> ratings,
    Long tmdbId,
    String tmdbMediaType,
    long version
) {

}
