package com.ridiculousmovies.backend.service;

import com.ridiculousmovies.backend.repository.MovieRepository;
import com.ridiculousmovies.backend.web.dto.MovieHighlightDto;
import com.ridiculousmovies.backend.web.dto.StatsResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StatsService {

  private final MovieRepository movieRepository;
  private final UserStatsService userStatsService;

  public StatsService(MovieRepository movieRepository, UserStatsService userStatsService) {
    this.movieRepository = movieRepository;
    this.userStatsService = userStatsService;
  }

  @Transactional(readOnly = true)
  public StatsResponse getStats(String sort) {
    return new StatsResponse(
        mapMovieHighlights(movieRepository.findTop3BestRated(), "best"),
        mapMovieHighlights(movieRepository.findTop3WorstRated(), "worst"),
        userStatsService.listUsers(sort)
    );
  }

  private static List<MovieHighlightDto> mapMovieHighlights(List<Object[]> rows, String which) {
    if (rows.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "no_rated_movies_for_" + which);
    }
    List<MovieHighlightDto> result = new ArrayList<>(rows.size());
    int place = 1;
    for (Object[] row : rows) {
      String id = Objects.requireNonNull(row[0]).toString();
      String title = (String) row[1];
      String host = (String) row[2];
      Double avg = ((Number) row[3]).doubleValue();
      result.add(new MovieHighlightDto(id, title, host, avg, place));
      place++;
    }
    return result;
  }

}
