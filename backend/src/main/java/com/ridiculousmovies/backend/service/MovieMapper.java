package com.ridiculousmovies.backend.service;

import com.ridiculousmovies.backend.domain.Movie;
import com.ridiculousmovies.backend.domain.Rating;
import com.ridiculousmovies.backend.web.dto.MovieResponse;
import com.ridiculousmovies.backend.web.dto.RatingEntryDto;
import com.ridiculousmovies.backend.web.dto.UserRefDto;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class MovieMapper {

  public MovieResponse toResponse(Movie m) {
    List<RatingEntryDto> ratings = m.getRatings().stream()
        .sorted(Comparator.comparing(r -> r.getUser().getId()))
        .map(this::toRatingEntry)
        .toList();
    Double avg = averageRating(m);
    UserRefDto owner = new UserRefDto(m.getOwner().getId(), m.getOwner().getName());
    return new MovieResponse(
        m.getId(),
        m.getTitle(),
        m.getDescription(),
        m.getCreatedAt(),
        m.getUpdatedAt(),
        owner,
        avg,
        ratings
    );
  }

  private RatingEntryDto toRatingEntry(Rating r) {
    UserRefDto u = new UserRefDto(r.getUser().getId(), r.getUser().getName());
    return new RatingEntryDto(r.getId(), u, r.getScore().setScale(2, RoundingMode.HALF_UP));
  }

  private Double averageRating(Movie m) {
    if (m.getRatings().isEmpty()) {
      return null;
    }
    BigDecimal sum = m.getRatings().stream()
        .map(Rating::getScore)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    return sum.divide(BigDecimal.valueOf(m.getRatings().size()), 4, RoundingMode.HALF_UP)
        .doubleValue();
  }

}
