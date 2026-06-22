package com.ridiculousmovies.backend.store;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class AppData {

  private List<UserGroupRecord> userGroups = new ArrayList<>();
  private List<UserRoleRecord> userRoles = new ArrayList<>();
  private List<UserRecord> users = new ArrayList<>();
  private List<MovieRecord> movies = new ArrayList<>();
  private List<RatingRecord> ratings = new ArrayList<>();

  public List<UserGroupRecord> getUserGroups() { return userGroups; }
  public void setUserGroups(List<UserGroupRecord> v) { this.userGroups = v; }

  public List<UserRoleRecord> getUserRoles() { return userRoles; }
  public void setUserRoles(List<UserRoleRecord> v) { this.userRoles = v; }

  public List<UserRecord> getUsers() { return users; }
  public void setUsers(List<UserRecord> v) { this.users = v; }

  public List<MovieRecord> getMovies() { return movies; }
  public void setMovies(List<MovieRecord> v) { this.movies = v; }

  public List<RatingRecord> getRatings() { return ratings; }
  public void setRatings(List<RatingRecord> v) { this.ratings = v; }

  public record UserGroupRecord(String id, String name) {}
  public record UserRoleRecord(String id, String name) {}
  public record UserRecord(String id, String name, String userGroupId, String roleId) {}
  public record MovieRecord(String id, String title, String description,
                            String ownerId, Integer round, Instant createdAt, Instant updatedAt) {}
  public record RatingRecord(String id, String movieId, String userId, BigDecimal score) {}
}
