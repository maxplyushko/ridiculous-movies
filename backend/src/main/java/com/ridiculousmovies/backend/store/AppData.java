package com.ridiculousmovies.backend.store;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class AppData {

  private List<UserRecord> users = new ArrayList<>();
  private List<MovieRecord> movies = new ArrayList<>();

  public List<UserRecord> getUsers() { return users; }
  public void setUsers(List<UserRecord> v) { this.users = v; }

  public List<MovieRecord> getMovies() { return movies; }
  public void setMovies(List<MovieRecord> v) { this.movies = v; }

  public record UserRecord(String id, String name, String group, String role) {}
  public record RatingRecord(String id, String userId, BigDecimal score) {}
  public record MovieRecord(String id, String title, String description,
                            String ownerId, Integer round, Instant createdAt, Instant updatedAt,
                            List<RatingRecord> ratings) {}
}
