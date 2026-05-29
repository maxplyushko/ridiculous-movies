package com.ridiculousmovies.backend.repository;

import com.ridiculousmovies.backend.domain.AppUser;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppUserRepository extends JpaRepository<AppUser, String> {

  @Query("""
      SELECT u FROM AppUser u
      JOIN FETCH u.userGroup
      JOIN FETCH u.role
      WHERE u.id = :id
      """)
  Optional<AppUser> findByIdWithGroupAndRole(@Param("id") String id);

  long countByUserGroup_Id(String groupId);

  @Query(value = """
      SELECT u.id, u.name, AVG(r.score) AS avg_given, COUNT(r.id) AS rating_count
      FROM app_user u
      LEFT JOIN rating r ON r.user_id = u.id
      WHERE u.user_group_id = :groupId
      GROUP BY u.id, u.name
      ORDER BY avg_given DESC NULLS LAST
      """, nativeQuery = true)
  List<Object[]> findUserStatsByGroupOrderByAverageDesc(@Param("groupId") String groupId);

  @Query(value = """
      SELECT u.id, u.name, AVG(r.score) AS avg_given, COUNT(r.id) AS rating_count
      FROM app_user u
      LEFT JOIN rating r ON r.user_id = u.id
      WHERE u.user_group_id = :groupId
      GROUP BY u.id, u.name
      ORDER BY avg_given ASC NULLS LAST
      """, nativeQuery = true)
  List<Object[]> findUserStatsByGroupOrderByAverageAsc(@Param("groupId") String groupId);

}
