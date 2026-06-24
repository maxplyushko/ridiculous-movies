package com.ridiculousmovies.backend.web;

import com.ridiculousmovies.backend.service.UserStatsService;
import com.ridiculousmovies.backend.store.DataStore;
import com.ridiculousmovies.backend.web.dto.UserStatsResponse;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

  private final UserStatsService userStatsService;
  private final DataStore dataStore;

  public UserController(UserStatsService userStatsService, DataStore dataStore) {
    this.userStatsService = userStatsService;
    this.dataStore = dataStore;
  }

  @GetMapping
  public List<UserStatsResponse> list(
      @RequestHeader("User-Id") String userId,
      @RequestParam(defaultValue = "desc") String sort
  ) {
    return userStatsService.listUsers(userId, sort);
  }

  public record PreferencesRequest(String theme) {}

  @PutMapping("/me/preferences")
  public ResponseEntity<Void> savePreferences(
      @RequestHeader("User-Id") String userId,
      @RequestBody PreferencesRequest body
  ) {
    dataStore.saveUserPreferences(userId, body.theme());
    return ResponseEntity.noContent().build();
  }
}
