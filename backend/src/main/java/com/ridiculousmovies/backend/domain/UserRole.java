package com.ridiculousmovies.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;

@Getter
@Entity
@Table(name = "user_role")
public class UserRole {

  @Id
  @Column(length = 64)
  private String id;

  @Column(nullable = false, unique = true, length = 50)
  private String name;
}
