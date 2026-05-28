package com.ridiculousmovies.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.ridiculousmovies.backend.domain.Rating;

public interface RatingRepository extends JpaRepository<Rating, String> {

	@EntityGraph(attributePaths = "user")
	List<Rating> findByMovie_Id(String movieId);
}
