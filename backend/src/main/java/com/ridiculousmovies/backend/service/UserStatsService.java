package com.ridiculousmovies.backend.service;

import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.store.AppRepository;
import com.ridiculousmovies.backend.web.dto.UserStatsResponse;
import java.util.List;
import java.util.Objects;
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
    AppUser user = authService.requireUser(userId);
    String groupId = user.getUserGroup().getId();
    String s = sort == null || sort.isBlank() ? "desc" : sort.trim().toLowerCase();
    boolean ascending = switch (s) {
      case "desc" -> false;
      case "asc" -> true;
      default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sort must be asc or desc");
    };
    return dataStore.userStatsByGroup(groupId, ascending).stream()
        .map(UserStatsService::mapRow)
        .toList();
  }

  private static UserStatsResponse mapRow(Object[] row) {
    String id = Objects.requireNonNull(row[0]).toString();
    String name = (String) row[1];
    Double avg = row[2] == null ? null : ((Number) row[2]).doubleValue();
    long count = ((Number) row[3]).longValue();
    boolean personalListPublic = (Boolean) row[4];
    Double hostAvg = row[5] == null ? null : ((Number) row[5]).doubleValue();
    String role = (String) row[6];
    return new UserStatsResponse(id, name, avg, count, personalListPublic, hostAvg, role);
  }
}
