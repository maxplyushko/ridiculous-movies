package com.ridiculousmovies.backend.service;

import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.repository.AppUserRepository;
import com.ridiculousmovies.backend.web.dto.UserStatsResponse;
import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserStatsService {

  private final AppUserRepository appUserRepository;
  private final AuthService authService;

  public UserStatsService(AppUserRepository appUserRepository, AuthService authService) {
    this.appUserRepository = appUserRepository;
    this.authService = authService;
  }

  @Transactional(readOnly = true)
  public List<UserStatsResponse> listUsers(String userId, String sort) {
    AppUser user = authService.requireUser(userId);
    String groupId = user.getUserGroup().getId();
    String s = sort == null || sort.isBlank() ? "desc" : sort.trim().toLowerCase();
    List<Object[]> rows = switch (s) {
      case "desc" -> appUserRepository.findUserStatsByGroupOrderByAverageDesc(groupId);
      case "asc" -> appUserRepository.findUserStatsByGroupOrderByAverageAsc(groupId);
      default ->
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sort must be asc or desc");
    };
    return rows.stream().map(UserStatsService::mapRow).toList();
  }

  private static UserStatsResponse mapRow(Object[] row) {
    String id = Objects.requireNonNull(row[0]).toString();
    String name = (String) row[1];
    Double avg = row[2] == null ? null : ((Number) row[2]).doubleValue();
    long count = ((Number) row[3]).longValue();
    return new UserStatsResponse(id, name, avg, count);
  }

}
