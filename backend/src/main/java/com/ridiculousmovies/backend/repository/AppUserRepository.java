package com.ridiculousmovies.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.ridiculousmovies.backend.domain.AppUser;

public interface AppUserRepository extends JpaRepository<AppUser, String> {

	@Query(value = """
			SELECT u.id, u.name, AVG(r.score) AS avg_given, COUNT(r.id) AS rating_count
			FROM app_user u
			LEFT JOIN rating r ON r.user_id = u.id
			GROUP BY u.id, u.name
			ORDER BY avg_given DESC NULLS LAST
			""", nativeQuery = true)
	List<Object[]> findAllUserStatsByAverageDesc();

	@Query(value = """
			SELECT u.id, u.name, AVG(r.score) AS avg_given, COUNT(r.id) AS rating_count
			FROM app_user u
			LEFT JOIN rating r ON r.user_id = u.id
			GROUP BY u.id, u.name
			ORDER BY avg_given ASC NULLS LAST
			""", nativeQuery = true)
	List<Object[]> findAllUserStatsByAverageAsc();

	@Query(value = """
			WITH cur AS (SELECT COALESCE(MAX(round), 0) AS r FROM movie)
			SELECT c.r AS current_round, u.id, u.name
			FROM app_user u CROSS JOIN cur c
			WHERE u.id NOT IN (
				SELECT DISTINCT m.owner_id FROM movie m WHERE m.round = c.r
			)
			ORDER BY u.name
			""", nativeQuery = true)
	List<Object[]> findUsersLeftInCurrentRound();

}
