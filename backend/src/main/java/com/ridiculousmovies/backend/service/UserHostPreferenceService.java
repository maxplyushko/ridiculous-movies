package com.ridiculousmovies.backend.service;

import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.store.AppRepository;
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
        .map(UserHostPreferenceService::mapRow)
        .toList();
  }

  private static UserHostPreferenceResponse mapRow(Object[] row) {
    return new UserHostPreferenceResponse(
        (String) row[0],
        (String) row[1],
        (Double) row[2],
        (String) row[3],
        (Double) row[4],
        (String) row[5],
        (Double) row[6]
    );
  }
}
