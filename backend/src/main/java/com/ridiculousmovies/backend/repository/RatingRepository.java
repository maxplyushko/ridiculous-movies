package com.ridiculousmovies.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ridiculousmovies.backend.domain.Rating;

public interface RatingRepository extends JpaRepository<Rating, String> {
}
