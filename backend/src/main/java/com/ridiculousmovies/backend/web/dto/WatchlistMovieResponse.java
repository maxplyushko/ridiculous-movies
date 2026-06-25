package com.ridiculousmovies.backend.web.dto;

import com.ridiculousmovies.backend.domain.WatchlistMovie;
import java.math.BigDecimal;
import java.time.Instant;

public record WatchlistMovieResponse(
    String id,
    String title,
    String description,
    BigDecimal rating,
    boolean watched,
    Instant createdAt,
    Instant updatedAt
) {
  public static WatchlistMovieResponse from(WatchlistMovie wm) {
    return new WatchlistMovieResponse(
        wm.getId(), wm.getTitle(), wm.getDescription(),
        wm.getRating(), wm.isWatched(), wm.getCreatedAt(), wm.getUpdatedAt()
    );
  }
}
