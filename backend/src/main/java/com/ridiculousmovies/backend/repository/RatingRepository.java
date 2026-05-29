package com.ridiculousmovies.backend.repository;

import com.ridiculousmovies.backend.domain.Rating;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RatingRepository extends JpaRepository<Rating, String> {

  @EntityGraph(attributePaths = "user")
  List<Rating> findByMovie_Id(String movieId);
}
