package com.ridiculousmovies.backend.domain;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

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
}
