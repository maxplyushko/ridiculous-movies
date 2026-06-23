package com.ridiculousmovies.backend.service;

import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.store.DataStore;
import com.ridiculousmovies.backend.web.dto.MovieHighlightDto;
import com.ridiculousmovies.backend.web.dto.StatsResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StatsService {

  private final DataStore dataStore;
  private final UserStatsService userStatsService;
  private final UserHostPreferenceService userHostPreferenceService;
  private final AuthService authService;

  public StatsService(
      DataStore dataStore,
      UserStatsService userStatsService,
      UserHostPreferenceService userHostPreferenceService,
      AuthService authService
  ) {
    this.dataStore = dataStore;
    this.userStatsService = userStatsService;
    this.userHostPreferenceService = userHostPreferenceService;
    this.authService = authService;
  }

  public StatsResponse getStats(String userId, String sort) {
    AppUser user = authService.requireUser(userId);
    String groupId = user.getUserGroup().getId();
    return new StatsResponse(
        mapMovieHighlights(dataStore.findTop3ForGroup(groupId, true), "best"),
        mapMovieHighlights(dataStore.findTop3ForGroup(groupId, false), "worst"),
        userStatsService.listUsers(userId, sort),
        userHostPreferenceService.listPreferences(userId)
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
