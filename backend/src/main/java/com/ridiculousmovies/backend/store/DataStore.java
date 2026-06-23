package com.ridiculousmovies.backend.store;

import tools.jackson.databind.ObjectMapper;
import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.domain.Movie;
import com.ridiculousmovies.backend.domain.Rating;
import com.ridiculousmovies.backend.domain.UserGroup;
import com.ridiculousmovies.backend.domain.UserRole;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class DataStore {

  private final ObjectMapper objectMapper;
  private final GoogleDriveClient driveClient;
  private final String fileId;

  private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

  private Map<String, AppUser> usersById;
  private Map<String, Movie> moviesById;

  public DataStore(
      ObjectMapper objectMapper,
      GoogleDriveClient driveClient,
      @Value("${google.drive.file-id}") String fileId
  ) {
    this.objectMapper = objectMapper;
    this.driveClient = driveClient;
    this.fileId = fileId;
  }

  public void initialize(String json) {
    AppData data = objectMapper.readValue(json, AppData.class);
    lock.writeLock().lock();
    try {
      rebuildFrom(data);
    } finally {
      lock.writeLock().unlock();
    }
  }

  private void rebuildFrom(AppData data) {
    Map<String, UserGroup> groupsByName = new LinkedHashMap<>();
    Map<String, UserRole> rolesByName = new LinkedHashMap<>();

    usersById = new LinkedHashMap<>();
    for (AppData.UserRecord r : data.getUsers()) {
      UserGroup g = groupsByName.computeIfAbsent(r.group(), name -> {
        UserGroup ug = new UserGroup();
        ug.setId(name);
        ug.setName(name);
        return ug;
      });
      UserRole role = rolesByName.computeIfAbsent(r.role(), name -> {
        UserRole ur = new UserRole();
        ur.setId(name);
        ur.setName(name);
        return ur;
      });
      AppUser u = new AppUser();
      u.setId(r.id());
      u.setName(r.name());
      u.setUserGroup(g);
      u.setRole(role);
      usersById.put(u.getId(), u);
    }

    moviesById = new LinkedHashMap<>();
    for (AppData.MovieRecord r : data.getMovies()) {
      Movie m = new Movie();
      m.setId(r.id());
      m.setTitle(r.title());
      m.setDescription(r.description() != null ? r.description() : "");
      m.setOwner(usersById.get(r.ownerId()));
      m.setRound(r.round());
      m.setCreatedAt(r.createdAt());
      m.setUpdatedAt(r.updatedAt());
      List<Rating> ratings = new ArrayList<>();
      if (r.ratings() != null) {
        for (AppData.RatingRecord rr : r.ratings()) {
          Rating rating = new Rating();
          rating.setId(rr.id());
          rating.setMovie(m);
          rating.setUser(usersById.get(rr.userId()));
          rating.setScore(rr.score());
          ratings.add(rating);
        }
      }
      m.setRatings(ratings);
      moviesById.put(m.getId(), m);
    }
  }

  // ---- Read methods ----

  public Optional<AppUser> findUserById(String id) {
    lock.readLock().lock();
    try {
      return Optional.ofNullable(usersById.get(id));
    } finally {
      lock.readLock().unlock();
    }
  }

  public long countUsersByGroupId(String groupId) {
    lock.readLock().lock();
    try {
      return usersById.values().stream()
          .filter(u -> groupId.equals(u.getUserGroup().getId()))
          .count();
    } finally {
      lock.readLock().unlock();
    }
  }

  public List<Object[]> userStatsByGroup(String groupId, boolean ascending) {
    lock.readLock().lock();
    try {
      List<Object[]> rows = usersById.values().stream()
          .filter(u -> groupId.equals(u.getUserGroup().getId()))
          .map(u -> {
            List<BigDecimal> scores = moviesById.values().stream()
                .flatMap(m -> m.getRatings().stream())
                .filter(r -> u.getId().equals(r.getUser().getId()))
                .map(Rating::getScore)
                .toList();
            Double avg = scores.isEmpty() ? null
                : scores.stream().mapToDouble(BigDecimal::doubleValue).average().orElse(0);
            return new Object[]{u.getId(), u.getName(), avg, (long) scores.size()};
          })
          .collect(Collectors.toList());
      Comparator<Object[]> cmp = Comparator.comparing(
          (Object[] row) -> (Double) row[2],
          ascending
              ? Comparator.nullsLast(Comparator.naturalOrder())
              : Comparator.nullsLast(Comparator.reverseOrder())
      );
      rows.sort(cmp);
      return rows;
    } finally {
      lock.readLock().unlock();
    }
  }

  public List<Movie> findMoviesForGroup(String groupId, boolean ascending) {
    lock.readLock().lock();
    try {
      Comparator<Movie> cmp = ascending
          ? Comparator.comparing(Movie::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
              .thenComparing(Movie::getId)
          : Comparator.comparing(Movie::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
              .thenComparing(Movie::getId);
      return moviesById.values().stream()
          .filter(m -> groupId.equals(m.getOwner().getUserGroup().getId()))
          .sorted(cmp)
          .toList();
    } finally {
      lock.readLock().unlock();
    }
  }

  public List<Movie> findMoviesByIdsAndGroup(Collection<String> ids, String groupId) {
    lock.readLock().lock();
    try {
      Set<String> idSet = new HashSet<>(ids);
      return moviesById.values().stream()
          .filter(m -> idSet.contains(m.getId())
              && groupId.equals(m.getOwner().getUserGroup().getId()))
          .sorted(Comparator.comparing(Movie::getId))
          .toList();
    } finally {
      lock.readLock().unlock();
    }
  }

  public Optional<Movie> findMovieById(String id) {
    lock.readLock().lock();
    try {
      return Optional.ofNullable(moviesById.get(id));
    } finally {
      lock.readLock().unlock();
    }
  }

  public boolean existsByIdAndGroup(String movieId, String groupId) {
    lock.readLock().lock();
    try {
      Movie m = moviesById.get(movieId);
      return m != null && groupId.equals(m.getOwner().getUserGroup().getId());
    } finally {
      lock.readLock().unlock();
    }
  }

  public int findLatestRoundForGroup(String groupId) {
    lock.readLock().lock();
    try {
      return moviesById.values().stream()
          .filter(m -> groupId.equals(m.getOwner().getUserGroup().getId()))
          .sorted(Comparator.comparing(Movie::getCreatedAt,
              Comparator.nullsLast(Comparator.reverseOrder()))
              .thenComparing(Movie::getId))
          .findFirst()
          .map(m -> m.getRound() != null ? m.getRound() : 0)
          .orElse(0);
    } finally {
      lock.readLock().unlock();
    }
  }

  public int findMaxRoundForGroup(String groupId) {
    lock.readLock().lock();
    try {
      return moviesById.values().stream()
          .filter(m -> groupId.equals(m.getOwner().getUserGroup().getId()))
          .mapToInt(m -> m.getRound() != null ? m.getRound() : 0)
          .max()
          .orElse(0);
    } finally {
      lock.readLock().unlock();
    }
  }

  public List<String> findIdsWithExtremumAvgForGroup(
      String groupId, int minRatings, boolean requireAll, long memberCount, boolean highest) {
    lock.readLock().lock();
    try {
      record Stat(String id, double avg) {}
      List<Stat> stats = moviesById.values().stream()
          .filter(m -> groupId.equals(m.getOwner().getUserGroup().getId()))
          .map(m -> {
            List<Rating> rs = m.getRatings().stream()
                .filter(r -> groupId.equals(r.getUser().getUserGroup().getId()))
                .toList();
            if (rs.size() < minRatings) return null;
            if (requireAll && rs.size() < memberCount) return null;
            double avg = rs.stream().mapToDouble(r -> r.getScore().doubleValue()).average().orElse(0);
            return new Stat(m.getId(), avg);
          })
          .filter(Objects::nonNull)
          .toList();
      if (stats.isEmpty()) return List.of();
      double bound = highest
          ? stats.stream().mapToDouble(Stat::avg).max().orElse(0)
          : stats.stream().mapToDouble(Stat::avg).min().orElse(0);
      return stats.stream().filter(s -> s.avg() == bound).map(Stat::id).toList();
    } finally {
      lock.readLock().unlock();
    }
  }

  public List<Object[]> findTop3ForGroup(String groupId, boolean best) {
    lock.readLock().lock();
    try {
      Comparator<Movie> cmp = Comparator.comparingDouble(
          (Movie m) -> m.getRatings().stream()
              .filter(r -> groupId.equals(r.getUser().getUserGroup().getId()))
              .mapToDouble(r -> r.getScore().doubleValue()).average().orElse(0)
      );
      if (best) cmp = cmp.reversed();
      return moviesById.values().stream()
          .filter(m -> groupId.equals(m.getOwner().getUserGroup().getId()))
          .filter(m -> !m.getRatings().isEmpty())
          .sorted(cmp.thenComparing(
              Comparator.comparing(Movie::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
          ))
          .limit(3)
          .map(m -> {
            double avg = m.getRatings().stream()
                .filter(r -> groupId.equals(r.getUser().getUserGroup().getId()))
                .mapToDouble(r -> r.getScore().doubleValue()).average().orElse(0);
            return new Object[]{m.getId(), m.getTitle(), m.getOwner().getName(), avg};
          })
          .toList();
    } finally {
      lock.readLock().unlock();
    }
  }

  // ---- Write methods ----

  public void saveMovie(Movie movie) {
    lock.writeLock().lock();
    try {
      if (movie.getId() == null) {
        movie.setId(UUID.randomUUID().toString());
      }
      Instant now = Instant.now();
      if (movie.getCreatedAt() == null) {
        movie.setCreatedAt(now);
      }
      movie.setUpdatedAt(now);
      moviesById.put(movie.getId(), movie);
      persist();
    } finally {
      lock.writeLock().unlock();
    }
  }

  public void deleteMovieById(String id) {
    lock.writeLock().lock();
    try {
      moviesById.remove(id);
      persist();
    } finally {
      lock.writeLock().unlock();
    }
  }

  // ---- Persistence ----

  private void persist() {
    try {
      AppData data = buildAppData();
      String json = objectMapper.writeValueAsString(data);
      driveClient.upload(fileId, json);
    } catch (Exception e) {
      throw new RuntimeException("Failed to persist to Google Drive", e);
    }
  }

  private AppData buildAppData() {
    AppData data = new AppData();
    data.setUsers(usersById.values().stream()
        .map(u -> new AppData.UserRecord(u.getId(), u.getName(),
            u.getUserGroup().getName(), u.getRole().getName()))
        .toList());
    data.setMovies(moviesById.values().stream()
        .map(m -> new AppData.MovieRecord(m.getId(), m.getTitle(), m.getDescription(),
            m.getOwner().getId(), m.getRound(), m.getCreatedAt(), m.getUpdatedAt(),
            m.getRatings().stream()
                .map(r -> new AppData.RatingRecord(r.getId(), r.getUser().getId(), r.getScore()))
                .toList()))
        .toList());
    return data;
  }
}
