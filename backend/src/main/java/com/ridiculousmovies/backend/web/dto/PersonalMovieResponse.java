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
    boolean inList,
    Instant createdAt,
    Instant updatedAt,
    Long tmdbId,
    String tmdbMediaType
) {
  public static PersonalMovieResponse from(PersonalMovie pm) {
    return new PersonalMovieResponse(
        pm.getId(), pm.getTitle(), pm.getDescription(),
        pm.getRating(), pm.isWatched(), pm.getInList() == null || pm.getInList(),
        pm.getCreatedAt(), pm.getUpdatedAt(),
        pm.getTmdbId(), pm.getTmdbMediaType()
    );
  }
}
