package com.ridiculousmovies.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

@Getter
@Entity
@Table(name = "app_user")
public class AppUser {

  @Id
  @Column(length = 64)
  @GeneratedValue
  @UuidGenerator
  private String id;

  @Setter
  @Column(nullable = false, unique = true, length = 100)
  private String name;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "user_group_id", nullable = false)
  private UserGroup userGroup;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "role_id", nullable = false)
  private UserRole role;
}
