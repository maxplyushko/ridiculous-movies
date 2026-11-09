package com.ridiculousmovies.backend.service;

import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.store.AppRepository;
import com.ridiculousmovies.backend.store.UserHostPreferenceProjection;
import com.ridiculousmovies.backend.web.dto.UserHostPreferenceResponse;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class UserHostPreferenceService {

  private final AppRepository dataStore;
  private final AuthService authService;

  public UserHostPreferenceService(AppRepository dataStore, AuthService authService) {
    this.dataStore = dataStore;
    this.authService = authService;
  }

  public List<UserHostPreferenceResponse> listPreferences(String userId) {
    AppUser user = authService.requireGroup(userId);
    String groupId = user.getUserGroup().getId();
    return dataStore.userHostPreferencesByGroup(groupId).stream()
        .map(UserHostPreferenceService::mapProjection)
        .toList();
  }

  private static UserHostPreferenceResponse mapProjection(UserHostPreferenceProjection projection) {
    return new UserHostPreferenceResponse(
        projection.userId(),
        projection.name(),
        projection.overallAverage(),
        projection.mostFavoriteHost(),
        projection.mostFavoriteAverage(),
        projection.leastFavoriteHost(),
        projection.leastFavoriteAverage()
    );
  }
}
