package com.ridiculousmovies.backend.domain;

import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WatchlistMovie {
  private String id;
  private String userId;
  private String title;
  private String description;
  private BigDecimal rating;
  private boolean watched;
  private Instant createdAt;
  private Instant updatedAt;
}
