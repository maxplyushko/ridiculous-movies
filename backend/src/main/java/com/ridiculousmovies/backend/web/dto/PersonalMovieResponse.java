package com.ridiculousmovies.backend.web.dto;

import com.ridiculousmovies.backend.domain.PersonalMovie;
import java.math.BigDecimal;
import java.time.Instant;

public record PersonalMovieResponse(
    String id,
    String title,
    String description,
    BigDecimal rating,
    boolean watched,
    Instant createdAt,
    Instant updatedAt
) {
  public static PersonalMovieResponse from(PersonalMovie pm) {
    return new PersonalMovieResponse(
        pm.getId(), pm.getTitle(), pm.getDescription(),
        pm.getRating(), pm.isWatched(), pm.getCreatedAt(), pm.getUpdatedAt()
    );
  }
}
