package com.ridiculousmovies.backend.service;

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

  public UserStatsService(AppUserRepository appUserRepository) {
    this.appUserRepository = appUserRepository;
  }

  @Transactional(readOnly = true)
  public List<UserStatsResponse> listUsers(String sort) {
    String s = sort == null || sort.isBlank() ? "desc" : sort.trim().toLowerCase();
    List<Object[]> rows = switch (s) {
      case "desc" -> appUserRepository.findAllUserStatsByAverageDesc();
      case "asc" -> appUserRepository.findAllUserStatsByAverageAsc();
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
