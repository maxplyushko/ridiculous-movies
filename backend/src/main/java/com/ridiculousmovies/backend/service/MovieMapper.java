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

  public MovieResponse toResponse(Movie m, String groupId) {
    String ownerId = m.getOwner().getId();
    List<Rating> groupRatings = m.getRatings().stream()
        .filter(r -> r.getUser().getUserGroup().getId().equals(groupId))
        .sorted(Comparator.comparing(r -> r.getUser().getId()))
        .toList();
    List<RatingEntryDto> ratings = groupRatings.stream()
        .map(r -> toRatingEntry(r, ownerId))
        .toList();
    List<Rating> nonHostRatings = groupRatings.stream()
        .filter(r -> !r.getUser().getId().equals(ownerId))
        .toList();
    Double avg = averageRating(nonHostRatings);
    UserRefDto owner = new UserRefDto(m.getOwner().getId(), m.getOwner().getName());
    return new MovieResponse(
        m.getId(),
        m.getTitle(),
        m.getDescription(),
        m.getTagline(),
        m.getCreatedAt(),
        m.getUpdatedAt(),
        owner,
        m.getRound(),
        avg,
        ratings,
        m.getTmdbId(),
        m.getTmdbMediaType()
    );
  }

  private RatingEntryDto toRatingEntry(Rating r, String ownerId) {
    UserRefDto u = new UserRefDto(r.getUser().getId(), r.getUser().getName());
    return new RatingEntryDto(r.getId(), u, r.getScore().setScale(2, RoundingMode.HALF_UP),
        r.getUser().getId().equals(ownerId));
  }

  private Double averageRating(List<Rating> ratings) {
    if (ratings.isEmpty()) {
      return null;
    }
    BigDecimal sum = ratings.stream()
        .map(Rating::getScore)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    return sum.divide(BigDecimal.valueOf(ratings.size()), 4, RoundingMode.HALF_UP)
        .doubleValue();
  }

}
