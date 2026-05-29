package com.ridiculousmovies.backend.web.dto;

import java.time.Instant;
import java.util.List;

public record MovieResponse(
    String id,
    String title,
    String description,
    Instant createdAt,
    Instant updatedAt,
    UserRefDto owner,
    Double averageRating,
    List<RatingEntryDto> ratings
) {

}
