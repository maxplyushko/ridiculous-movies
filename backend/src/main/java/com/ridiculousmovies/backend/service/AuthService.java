package com.ridiculousmovies.backend.service;

import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.repository.AppUserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

  public static final String PRIVATE_USE_MESSAGE = "Sorry for now this app is for private use only";

  private final AppUserRepository appUserRepository;

  public AuthService(AppUserRepository appUserRepository) {
    this.appUserRepository = appUserRepository;
  }

  @Transactional(readOnly = true)
  public AppUser requireUser(String userId) {
    if (userId == null || userId.isBlank()) {
      throw denied();
    }
    return appUserRepository.findByIdWithGroupAndRole(userId.trim())
        .orElseThrow(this::denied);
  }

  @Transactional(readOnly = true)
  public void assertUserInGroup(String userId, String groupId) {
    AppUser user = appUserRepository.findByIdWithGroupAndRole(userId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    if (!user.getUserGroup().getId().equals(groupId)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not in your group");
    }
  }

  @Transactional(readOnly = true)
  public long countGroupMembers(String groupId) {
    return appUserRepository.countByUserGroup_Id(groupId);
  }

  private ResponseStatusException denied() {
    return new ResponseStatusException(HttpStatus.FORBIDDEN, PRIVATE_USE_MESSAGE);
  }
}
