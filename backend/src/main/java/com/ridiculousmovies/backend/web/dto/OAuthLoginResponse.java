package com.ridiculousmovies.backend.web.dto;

import com.ridiculousmovies.backend.domain.AppUser;

public record OAuthLoginResponse(
    String accessToken,
    String userId,
    String userName,
    String role,
    String groupId,
    String groupName,
    String theme,
    String defaultPage,
    String lang
) {
  public static OAuthLoginResponse of(String accessToken, AppUser user) {
    return new OAuthLoginResponse(
        accessToken,
        user.getId(),
        user.getName(),
        user.getRole().getName(),
        user.getUserGroup() == null ? null : user.getUserGroup().getId(),
        user.getUserGroup() == null ? null : user.getUserGroup().getName(),
        user.getTheme(),
        user.getDefaultPage(),
        user.getLang()
    );
  }
}