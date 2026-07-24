package com.ridiculousmovies.backend.service;

import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.store.AppRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

  public static final String GUEST_USER_ID = "guest";

  private final AppRepository dataStore;

  public AuthService(AppRepository dataStore) {
    this.dataStore = dataStore;
  }

  public AppUser requireUser(String userId) {
    if (userId == null || userId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired token");
    }
    return dataStore.findUserById(userId.trim())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "User not registered"));
  }

  public void assertUserInGroup(String userId, String groupId) {
    AppUser user = dataStore.findUserById(userId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    if (!user.getUserGroup().getId().equals(groupId)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not in your group");
    }
  }

  public long countGroupMembers(String groupId) {
    return dataStore.countUsersByGroupId(groupId);
  }

  public boolean isGuest(AppUser user) {
    return GUEST_USER_ID.equals(user.getId());
  }

  public void requireAdmin(AppUser user) {
    if (!"admin".equals(user.getRole().getName())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
    }
  }
}
