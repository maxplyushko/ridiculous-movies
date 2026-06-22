package com.ridiculousmovies.backend.domain;

import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Rating {
  private String id;
  private Movie movie;
  private AppUser user;
  private BigDecimal score;
}
