package com.ridiculousmovies.backend.web.dto;

import com.ridiculousmovies.backend.domain.AppUser;

public record AuthResponse(
    String userId,
    String userName,
    String role,
    String groupId,
    String groupName,
    String theme
) {

  public static AuthResponse from(AppUser user) {
    return new AuthResponse(
        user.getId(),
        user.getName(),
        user.getRole().getName(),
        user.getUserGroup().getId(),
        user.getUserGroup().getName(),
        user.getTheme()
    );
  }
}
