package com.ridiculousmovies.backend.domain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Movie {
  private String id;
  private String title;
  private String description = "";
  private AppUser owner;
  private List<Rating> ratings = new ArrayList<>();
  private Integer round;
  private Instant createdAt;
  private Instant updatedAt;
}
