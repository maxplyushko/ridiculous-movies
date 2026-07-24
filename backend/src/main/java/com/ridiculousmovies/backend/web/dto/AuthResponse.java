package com.ridiculousmovies.backend.web.dto;

import com.ridiculousmovies.backend.domain.AppUser;

public record AuthResponse(
    String userId,
    String userName,
    String role,
    String groupId,
    String groupName,
    String theme,
    String defaultPage,
    String lang,
    String tmdbLang,
    boolean personalListPublic
) {

  public static AuthResponse from(AppUser user) {
    return new AuthResponse(
        user.getId(),
        user.getName(),
        user.getRole().getName(),
        user.getUserGroup() == null ? null : user.getUserGroup().getId(),
        user.getUserGroup() == null ? null : user.getUserGroup().getName(),
        user.getTheme(),
        user.getDefaultPage(),
        user.getLang(),
        user.getTmdbLang(),
        user.getPersonalListPublic() == null || user.getPersonalListPublic()
    );
  }
}
