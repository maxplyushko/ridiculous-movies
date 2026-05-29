package com.ridiculousmovies.backend.repository;

import com.ridiculousmovies.backend.domain.Movie;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MovieRepository extends JpaRepository<Movie, String> {

  @EntityGraph(attributePaths = {"owner", "ratings", "ratings.user"})
  @Query("SELECT DISTINCT m FROM Movie m LEFT JOIN FETCH m.owner LEFT JOIN FETCH m.ratings r LEFT JOIN FETCH r.user ORDER BY m.createdAt DESC, m.id ASC")
  List<Movie> findAllFetchedSortedByCreatedAtDesc();

  @EntityGraph(attributePaths = {"owner", "ratings", "ratings.user"})
  @Query("SELECT DISTINCT m FROM Movie m LEFT JOIN FETCH m.owner LEFT JOIN FETCH m.ratings r LEFT JOIN FETCH r.user ORDER BY m.createdAt ASC, m.id ASC")
  List<Movie> findAllFetchedSortedByCreatedAtAsc();

  @EntityGraph(attributePaths = {"owner", "ratings", "ratings.user"})
  @Query("SELECT DISTINCT m FROM Movie m LEFT JOIN FETCH m.owner LEFT JOIN FETCH m.ratings r LEFT JOIN FETCH r.user WHERE m.id IN :ids ORDER BY m.id")
  List<Movie> findAllFetchedByIdIn(@Param("ids") Collection<String> ids);

  @Query("SELECT COALESCE(MAX(m.round), 0) FROM Movie m")
  int findMaxRound();

  Optional<Movie> findFirstByOrderByCreatedAtDescIdAsc();

  default int findLatestRound() {
    return findFirstByOrderByCreatedAtDescIdAsc()
        .map(m -> m.getRound() != null ? m.getRound() : 0)
        .orElse(0);
  }

  @Query(value = """
      WITH stats AS (
      	SELECT m.id AS mid, AVG(r.score) AS avg_score, COUNT(r.id) AS cnt
      	FROM movie m
      	INNER JOIN rating r ON r.movie_id = m.id
      	GROUP BY m.id
      	HAVING COUNT(r.id) >= :minRatings
      	AND (
      		CAST(:requireAllUsers AS boolean) = false
      		OR COUNT(r.id) = 5
      	)
      ),
      bound AS (
      	SELECT MAX(avg_score) AS v FROM stats
      )
      SELECT s.mid FROM stats s JOIN bound b ON s.avg_score = b.v
      """, nativeQuery = true)
  List<String> findIdsWithHighestAverage(
      @Param("minRatings") int minRatings,
      @Param("requireAllUsers") boolean requireAllUsers
  );

  @Query(value = """
      WITH stats AS (
      	SELECT m.id AS mid, AVG(r.score) AS avg_score, COUNT(r.id) AS cnt
      	FROM movie m
      	INNER JOIN rating r ON r.movie_id = m.id
      	GROUP BY m.id
      	HAVING COUNT(r.id) >= :minRatings
      	AND (
      		CAST(:requireAllUsers AS boolean) = false
      		OR COUNT(r.id) = 5
      	)
      ),
      bound AS (
      	SELECT MIN(avg_score) AS v FROM stats
      )
      SELECT s.mid FROM stats s JOIN bound b ON s.avg_score = b.v
      """, nativeQuery = true)
  List<String> findIdsWithLowestAverage(
      @Param("minRatings") int minRatings,
      @Param("requireAllUsers") boolean requireAllUsers
  );

  @Query(value = """
      SELECT m.id, m.title, u.name, AVG(r.score) AS avg_score
      FROM movie m
      INNER JOIN app_user u ON u.id = m.owner_id
      INNER JOIN rating r ON r.movie_id = m.id
      GROUP BY m.id, m.title, u.name, m.created_at
      ORDER BY avg_score DESC, m.created_at DESC
      LIMIT 3
      """, nativeQuery = true)
  List<Object[]> findTop3BestRated();

  @Query(value = """
      SELECT m.id, m.title, u.name, AVG(r.score) AS avg_score
      FROM movie m
      INNER JOIN app_user u ON u.id = m.owner_id
      INNER JOIN rating r ON r.movie_id = m.id
      GROUP BY m.id, m.title, u.name, m.created_at
      ORDER BY avg_score ASC, m.created_at DESC
      LIMIT 3
      """, nativeQuery = true)
  List<Object[]> findTop3WorstRated();

}
