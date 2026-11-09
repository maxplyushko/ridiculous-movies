package com.ridiculousmovies.backend.service;

import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.store.AppRepository;
import com.ridiculousmovies.backend.store.UserStatsProjection;
import com.ridiculousmovies.backend.web.dto.UserStatsResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserStatsService {

  private final AppRepository dataStore;
  private final AuthService authService;

  public UserStatsService(AppRepository dataStore, AuthService authService) {
    this.dataStore = dataStore;
    this.authService = authService;
  }

  public List<UserStatsResponse> listUsers(String userId, String sort) {
    AppUser user = authService.requireGroup(userId);
    String groupId = user.getUserGroup().getId();
    String s = sort == null || sort.isBlank() ? "desc" : sort.trim().toLowerCase();
    boolean ascending = switch (s) {
      case "desc" -> false;
      case "asc" -> true;
      default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sort must be asc or desc");
    };
    return dataStore.userStatsByGroup(groupId, ascending).stream()
        .map(UserStatsService::mapProjection)
        .toList();
  }

  private static UserStatsResponse mapProjection(UserStatsProjection projection) {
    return new UserStatsResponse(projection.userId(), projection.name(), projection.averageRating(),
        projection.ratingCount(), projection.personalListPublic(), projection.hostAverageRating(),
        projection.role());
  }
}
