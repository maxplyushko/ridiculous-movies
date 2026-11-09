package com.ridiculousmovies.backend.service;

import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.store.AppRepository;
import com.ridiculousmovies.backend.store.MovieHighlightProjection;
import com.ridiculousmovies.backend.web.dto.MovieHighlightDto;
import com.ridiculousmovies.backend.web.dto.StatsResponse;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class StatsService {

  private final AppRepository dataStore;
  private final UserStatsService userStatsService;
  private final UserHostPreferenceService userHostPreferenceService;
  private final AuthService authService;

  public StatsService(
      AppRepository dataStore,
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
    AppUser user = authService.requireGroup(userId);
    String groupId = user.getUserGroup().getId();
    return new StatsResponse(
        mapMovieHighlights(dataStore.findTop3ForGroup(groupId, true)),
        mapMovieHighlights(dataStore.findTop3ForGroup(groupId, false)),
        userStatsService.listUsers(userId, sort),
        userHostPreferenceService.listPreferences(userId)
    );
  }

  private static List<MovieHighlightDto> mapMovieHighlights(List<MovieHighlightProjection> rows) {
    List<MovieHighlightDto> result = new ArrayList<>(rows.size());
    int place = 1;
    for (MovieHighlightProjection row : rows) {
      result.add(new MovieHighlightDto(row.movieId(), row.title(), row.host(), row.averageRating(), place));
      place++;
    }
    return result;
  }
}
