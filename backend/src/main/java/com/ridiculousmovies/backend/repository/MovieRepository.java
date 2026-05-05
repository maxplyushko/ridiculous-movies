package com.ridiculousmovies.backend.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ridiculousmovies.backend.domain.Movie;

public interface MovieRepository extends JpaRepository<Movie, Long> {

	@EntityGraph(attributePaths = { "owner", "ratings", "ratings.user" })
	@Query("SELECT DISTINCT m FROM Movie m LEFT JOIN FETCH m.owner LEFT JOIN FETCH m.ratings r LEFT JOIN FETCH r.user ORDER BY m.createdAt DESC, m.id ASC")
	List<Movie> findAllFetchedSortedByCreatedAtDesc();

	@EntityGraph(attributePaths = { "owner", "ratings", "ratings.user" })
	@Query("SELECT DISTINCT m FROM Movie m LEFT JOIN FETCH m.owner LEFT JOIN FETCH m.ratings r LEFT JOIN FETCH r.user ORDER BY m.createdAt ASC, m.id ASC")
	List<Movie> findAllFetchedSortedByCreatedAtAsc();

	@EntityGraph(attributePaths = { "owner", "ratings", "ratings.user" })
	@Query("SELECT DISTINCT m FROM Movie m LEFT JOIN FETCH m.owner LEFT JOIN FETCH m.ratings r LEFT JOIN FETCH r.user WHERE m.id IN :ids ORDER BY m.id")
	List<Movie> findAllFetchedByIdIn(@Param("ids") Collection<Long> ids);

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
	List<Long> findIdsWithHighestAverage(
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
	List<Long> findIdsWithLowestAverage(
			@Param("minRatings") int minRatings,
			@Param("requireAllUsers") boolean requireAllUsers
	);

}
