package com.ridiculousmovies.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

@Getter
@Entity
@Table(
    name = "rating",
    uniqueConstraints = @UniqueConstraint(columnNames = {"movie_id", "user_id"})
)
public class Rating {

  @Id
  @Column(length = 64)
  @GeneratedValue
  @UuidGenerator
  private String id;

  @Setter
  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "movie_id", nullable = false)
  private Movie movie;

  @Setter
  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private AppUser user;

  @Setter
  @Column(nullable = false, precision = 5, scale = 2)
  private BigDecimal score;
}
