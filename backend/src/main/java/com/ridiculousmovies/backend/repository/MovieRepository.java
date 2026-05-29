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

  @EntityGraph(attributePaths = {"owner", "owner.userGroup", "ratings", "ratings.user", "ratings.user.userGroup"})
  @Query("""
      SELECT DISTINCT m FROM Movie m
      LEFT JOIN FETCH m.owner o
      LEFT JOIN FETCH m.ratings r
      LEFT JOIN FETCH r.user
      WHERE o.userGroup.id = :groupId
      ORDER BY m.createdAt DESC, m.id ASC
      """)
  List<Movie> findAllFetchedSortedByCreatedAtDescForGroup(@Param("groupId") String groupId);

  @EntityGraph(attributePaths = {"owner", "owner.userGroup", "ratings", "ratings.user", "ratings.user.userGroup"})
  @Query("""
      SELECT DISTINCT m FROM Movie m
      LEFT JOIN FETCH m.owner o
      LEFT JOIN FETCH m.ratings r
      LEFT JOIN FETCH r.user
      WHERE o.userGroup.id = :groupId
      ORDER BY m.createdAt ASC, m.id ASC
      """)
  List<Movie> findAllFetchedSortedByCreatedAtAscForGroup(@Param("groupId") String groupId);

  @EntityGraph(attributePaths = {"owner", "owner.userGroup", "ratings", "ratings.user", "ratings.user.userGroup"})
  @Query("""
      SELECT DISTINCT m FROM Movie m
      LEFT JOIN FETCH m.owner o
      LEFT JOIN FETCH m.ratings r
      LEFT JOIN FETCH r.user
      WHERE m.id IN :ids AND o.userGroup.id = :groupId
      ORDER BY m.id
      """)
  List<Movie> findAllFetchedByIdInForGroup(
      @Param("ids") Collection<String> ids,
      @Param("groupId") String groupId
  );

  @Query("SELECT COALESCE(MAX(m.round), 0) FROM Movie m WHERE m.owner.userGroup.id = :groupId")
  int findMaxRoundForGroup(@Param("groupId") String groupId);

  @Query("""
      SELECT m FROM Movie m
      JOIN FETCH m.owner o
      WHERE o.userGroup.id = :groupId
      ORDER BY m.createdAt DESC, m.id ASC
      """)
  List<Movie> findByGroupOrderByCreatedAtDescIdAsc(@Param("groupId") String groupId);

  default int findLatestRoundForGroup(String groupId) {
    return findByGroupOrderByCreatedAtDescIdAsc(groupId).stream()
        .findFirst()
        .map(m -> m.getRound() != null ? m.getRound() : 0)
        .orElse(0);
  }

  @Query(value = """
      WITH stats AS (
      	SELECT m.id AS mid, AVG(r.score) AS avg_score, COUNT(r.id) AS cnt
      	FROM movie m
      	INNER JOIN app_user owner ON owner.id = m.owner_id AND owner.user_group_id = :groupId
      	INNER JOIN rating r ON r.movie_id = m.id
      	GROUP BY m.id
      	HAVING COUNT(r.id) >= :minRatings
      	AND (
      		CAST(:requireAllUsers AS boolean) = false
      		OR COUNT(r.id) = :groupMemberCount
      	)
      ),
      bound AS (
      	SELECT MAX(avg_score) AS v FROM stats
      )
      SELECT s.mid FROM stats s JOIN bound b ON s.avg_score = b.v
      """, nativeQuery = true)
  List<String> findIdsWithHighestAverageForGroup(
      @Param("groupId") String groupId,
      @Param("minRatings") int minRatings,
      @Param("requireAllUsers") boolean requireAllUsers,
      @Param("groupMemberCount") long groupMemberCount
  );

  @Query(value = """
      WITH stats AS (
      	SELECT m.id AS mid, AVG(r.score) AS avg_score, COUNT(r.id) AS cnt
      	FROM movie m
      	INNER JOIN app_user owner ON owner.id = m.owner_id AND owner.user_group_id = :groupId
      	INNER JOIN rating r ON r.movie_id = m.id
      	GROUP BY m.id
      	HAVING COUNT(r.id) >= :minRatings
      	AND (
      		CAST(:requireAllUsers AS boolean) = false
      		OR COUNT(r.id) = :groupMemberCount
      	)
      ),
      bound AS (
      	SELECT MIN(avg_score) AS v FROM stats
      )
      SELECT s.mid FROM stats s JOIN bound b ON s.avg_score = b.v
      """, nativeQuery = true)
  List<String> findIdsWithLowestAverageForGroup(
      @Param("groupId") String groupId,
      @Param("minRatings") int minRatings,
      @Param("requireAllUsers") boolean requireAllUsers,
      @Param("groupMemberCount") long groupMemberCount
  );

  @Query(value = """
      SELECT m.id, m.title, u.name, AVG(r.score) AS avg_score
      FROM movie m
      INNER JOIN app_user u ON u.id = m.owner_id AND u.user_group_id = :groupId
      INNER JOIN rating r ON r.movie_id = m.id
      GROUP BY m.id, m.title, u.name, m.created_at
      ORDER BY avg_score DESC, m.created_at DESC
      LIMIT 3
      """, nativeQuery = true)
  List<Object[]> findTop3BestRatedForGroup(@Param("groupId") String groupId);

  @Query(value = """
      SELECT m.id, m.title, u.name, AVG(r.score) AS avg_score
      FROM movie m
      INNER JOIN app_user u ON u.id = m.owner_id AND u.user_group_id = :groupId
      INNER JOIN rating r ON r.movie_id = m.id
      GROUP BY m.id, m.title, u.name, m.created_at
      ORDER BY avg_score ASC, m.created_at DESC
      LIMIT 3
      """, nativeQuery = true)
  List<Object[]> findTop3WorstRatedForGroup(@Param("groupId") String groupId);

  @Query("""
      SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END
      FROM Movie m
      WHERE m.id = :movieId AND m.owner.userGroup.id = :groupId
      """)
  boolean existsByIdAndOwnerGroupId(@Param("movieId") String movieId, @Param("groupId") String groupId);

  Optional<Movie> findById(String id);

}
