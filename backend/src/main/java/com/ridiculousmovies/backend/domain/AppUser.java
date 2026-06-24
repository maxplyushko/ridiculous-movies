package com.ridiculousmovies.backend.domain;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AppUser {
  private String id;
  private String name;
  private UserGroup userGroup;
  private UserRole role;
  private String theme;
}
