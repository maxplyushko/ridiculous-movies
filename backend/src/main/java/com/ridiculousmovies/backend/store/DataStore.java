package com.ridiculousmovies.backend.store;

import com.ridiculousmovies.backend.exception.DataStoreException;
import tools.jackson.databind.ObjectMapper;
import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.domain.Movie;
import com.ridiculousmovies.backend.domain.Rating;
import com.ridiculousmovies.backend.domain.UserGroup;
import com.ridiculousmovies.backend.domain.UserRole;
import com.ridiculousmovies.backend.domain.PersonalMovie;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
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
public class DataStore implements AppRepository {

  private final ObjectMapper objectMapper;
  private final StorageClient driveClient;
  private final String fileId;

  private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

  private Map<String, AppUser> usersById;
  private Map<String, Movie> moviesById;
  private Map<String, PersonalMovie> personalMoviesById;
  private Map<String, Long> groupChatIdsMap = new LinkedHashMap<>();

  private final Instant statsCutoffDate;

  public DataStore(
      ObjectMapper objectMapper,
      StorageClient driveClient,
      @Value("${google.drive.file-id:}") String fileId,
      @Value("${stats.cutoff-date:}") String statsCutoffDate
  ) {
    this.objectMapper = objectMapper;
    this.driveClient = driveClient;
    this.fileId = fileId;
    this.statsCutoffDate = statsCutoffDate == null || statsCutoffDate.isBlank()
        ? null
        : LocalDate.parse(statsCutoffDate).atStartOfDay(ZoneOffset.UTC).toInstant();
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
      u.setTheme(r.theme());
      u.setDefaultPage(r.defaultPage());
      u.setLang(r.lang());
      u.setTmdbLang(r.tmdbLang());
      u.setOauthSub(r.oauthSub());
      u.setPersonalListPublic(r.personalListPublic() == null ? Boolean.TRUE : r.personalListPublic());
      usersById.put(u.getId(), u);
    }

    moviesById = new LinkedHashMap<>();
    for (AppData.MovieRecord r : data.getMovies()) {
      Movie m = new Movie();
      m.setId(r.id());
      m.setTitle(r.title());
      m.setDescription(r.description() != null ? r.description() : "");
      AppUser owner = usersById.get(r.ownerId());
      if (owner == null) continue;
      m.setOwner(owner);
      m.setRound(r.round());
      m.setCreatedAt(r.createdAt());
      m.setUpdatedAt(r.updatedAt());
      m.setTmdbId(r.tmdbId());
      m.setTmdbMediaType(r.tmdbMediaType());
      List<Rating> ratings = new ArrayList<>();
      if (r.ratings() != null) {
        for (AppData.RatingRecord rr : r.ratings()) {
          AppUser ratingUser = usersById.get(rr.userId());
          if (ratingUser == null) continue;
          Rating rating = new Rating();
          rating.setId(rr.id());
          rating.setMovie(m);
          rating.setUser(ratingUser);
          rating.setScore(rr.score());
          ratings.add(rating);
        }
      }
      m.setRatings(ratings);
      moviesById.put(m.getId(), m);
    }

    personalMoviesById = new LinkedHashMap<>();
    List<AppData.PersonalMovieRecord> personalRecords = data.getPersonalMovies();
    if (personalRecords != null) {
      for (AppData.PersonalMovieRecord r : personalRecords) {
        PersonalMovie pm = new PersonalMovie();
        pm.setId(r.id());
        pm.setUserId(r.userId());
        pm.setTitle(r.title());
        pm.setDescription(r.description() != null ? r.description() : "");
        pm.setRating(r.rating());
        pm.setWatched(r.watched());
        pm.setInList(r.inList());
        pm.setCreatedAt(r.createdAt());
        pm.setUpdatedAt(r.updatedAt());
        pm.setTmdbId(r.tmdbId());
        pm.setTmdbMediaType(r.tmdbMediaType());
        personalMoviesById.put(pm.getId(), pm);
      }
    }

    groupChatIdsMap = new LinkedHashMap<>();
    if (data.getGroupChatIds() != null) {
      groupChatIdsMap.putAll(data.getGroupChatIds());
    }
  }

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

  private boolean isAfterStatsCutoff(Movie m) {
    return statsCutoffDate == null || m.getCreatedAt() == null
        || !m.getCreatedAt().isBefore(statsCutoffDate);
  }

  public List<Object[]> userStatsByGroup(String groupId, boolean ascending) {
    lock.readLock().lock();
    try {
      List<Object[]> rows = usersById.values().stream()
          .filter(u -> groupId.equals(u.getUserGroup().getId()))
          .map(u -> {
            List<BigDecimal> scores = moviesById.values().stream()
                .filter(this::isAfterStatsCutoff)
                .flatMap(m -> m.getRatings().stream())
                .filter(r -> u.getId().equals(r.getUser().getId()))
                .map(Rating::getScore)
                .toList();
            Double avg = scores.isEmpty() ? null
                : scores.stream().mapToDouble(BigDecimal::doubleValue).average().orElse(0);
            List<BigDecimal> hostScores = moviesById.values().stream()
                .filter(this::isAfterStatsCutoff)
                .filter(m -> m.getOwner() != null && u.getId().equals(m.getOwner().getId()))
                .flatMap(m -> m.getRatings().stream())
                .map(Rating::getScore)
                .toList();
            Double hostAvg = hostScores.isEmpty() ? null
                : hostScores.stream().mapToDouble(BigDecimal::doubleValue).average().orElse(0);
            return new Object[]{u.getId(), u.getName(), avg, (long) scores.size(),
                u.getPersonalListPublic() == null ? Boolean.TRUE : u.getPersonalListPublic(), hostAvg,
                u.getRole().getName()};
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
          .min(Comparator.comparing(Movie::getCreatedAt,
                  Comparator.nullsLast(Comparator.reverseOrder()))
              .thenComparing(Movie::getId))
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
          .filter(this::isAfterStatsCutoff)
          .filter(m -> !m.getRatings().isEmpty())
          .sorted(cmp.thenComparing(Movie::getCreatedAt,
              Comparator.nullsLast(Comparator.reverseOrder())))
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

  public List<Object[]> userHostPreferencesByGroup(String groupId) {
    lock.readLock().lock();
    try {
      List<Movie> groupMovies = moviesById.values().stream()
          .filter(m -> groupId.equals(m.getOwner().getUserGroup().getId()))
          .filter(this::isAfterStatsCutoff)
          .toList();

      return usersById.values().stream()
          .filter(u -> groupId.equals(u.getUserGroup().getId()))
          .map(u -> {
            record HS(String host, double score) {}
            List<HS> hostScores = groupMovies.stream()
                .filter(m -> !m.getOwner().getId().equals(u.getId()))
                .flatMap(m -> m.getRatings().stream()
                    .filter(r -> r.getUser() != null && u.getId().equals(r.getUser().getId()))
                    .map(r -> new HS(m.getOwner().getName(), r.getScore().doubleValue()))
                )
                .toList();

            if (hostScores.isEmpty()) return null;

            Map<String, Double> avgByHost = hostScores.stream()
                .collect(Collectors.groupingBy(HS::host, Collectors.averagingDouble(HS::score)));

            java.util.OptionalDouble opt = groupMovies.stream()
                .flatMap(m -> m.getRatings().stream())
                .filter(r -> r.getUser() != null && u.getId().equals(r.getUser().getId()))
                .mapToDouble(r -> r.getScore().doubleValue())
                .average();
            Double overall = opt.isPresent() ? opt.getAsDouble() : null;

            String mostFavHost = avgByHost.entrySet().stream()
                .max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse(null);
            Double mostFavAvg = mostFavHost != null ? avgByHost.get(mostFavHost) : null;

            String leastFavHost = avgByHost.entrySet().stream()
                .min(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse(null);
            Double leastFavAvg = leastFavHost != null ? avgByHost.get(leastFavHost) : null;

            return new Object[]{u.getId(), u.getName(), overall, mostFavHost, mostFavAvg, leastFavHost, leastFavAvg};
          })
          .filter(Objects::nonNull)
          .toList();
    } finally {
      lock.readLock().unlock();
    }
  }

  public Optional<AppUser> findUserByOauthSub(String sub) {
    lock.readLock().lock();
    try {
      return usersById.values().stream()
          .filter(u -> sub != null && sub.equals(u.getOauthSub()))
          .findFirst();
    } finally {
      lock.readLock().unlock();
    }
  }

  public AppUser registerUser(String name, String oauthSub, String groupId) {
    lock.writeLock().lock();
    try {
      UserGroup g = usersById.values().stream()
          .map(AppUser::getUserGroup)
          .filter(userGroup -> groupId.equals(userGroup.getId()))
          .findFirst()
          .orElseGet(() -> {
            UserGroup ug = new UserGroup();
            ug.setId(groupId);
            ug.setName(groupId);
            return ug;
          });
      UserRole role = usersById.values().stream()
          .map(AppUser::getRole)
          .filter(uRole -> "user".equals(uRole.getName()))
          .findFirst()
          .orElseGet(() -> {
            UserRole ur = new UserRole();
            ur.setId("user");
            ur.setName("user");
            return ur;
          });
      AppUser u = new AppUser();
      u.setId(UUID.randomUUID().toString());
      u.setName(name);
      u.setOauthSub(oauthSub);
      u.setUserGroup(g);
      u.setRole(role);
      usersById.put(u.getId(), u);
      persist();
      return u;
    } finally {
      lock.writeLock().unlock();
    }
  }

  public void saveUserPreferences(String userId, String theme, String defaultPage, String lang, String tmdbLang,
      Boolean personalListPublic) {
    lock.writeLock().lock();
    try {
      AppUser u = usersById.get(userId);
      if (u == null) return;
      if (theme != null) u.setTheme(theme);
      if (defaultPage != null) u.setDefaultPage(defaultPage);
      if (lang != null) u.setLang(lang);
      if (tmdbLang != null) u.setTmdbLang(tmdbLang);
      if (personalListPublic != null) u.setPersonalListPublic(personalListPublic);
      persist();
    } finally {
      lock.writeLock().unlock();
    }
  }

  public List<PersonalMovie> findPersonalMoviesForUser(String userId) {
    lock.readLock().lock();
    try {
      return personalMoviesById.values().stream()
          .filter(pm -> userId.equals(pm.getUserId()))
          .sorted(Comparator.comparing(PersonalMovie::getUpdatedAt,
              Comparator.nullsLast(Comparator.reverseOrder())))
          .toList();
    } finally {
      lock.readLock().unlock();
    }
  }

  public List<String> findGroupMembersWhoAdded(String callerId, Long tmdbId, String title) {
    lock.readLock().lock();
    try {
      AppUser caller = usersById.get(callerId);
      if (caller == null || caller.getUserGroup() == null) {
        return List.of();
      }
      String groupId = caller.getUserGroup().getId();
      String normTitle = title == null ? null : title.trim().toLowerCase();
      return personalMoviesById.values().stream()
          .filter(pm -> !callerId.equals(pm.getUserId()))
          .filter(pm -> {
            AppUser owner = usersById.get(pm.getUserId());
            return owner != null && owner.getUserGroup() != null
                && groupId.equals(owner.getUserGroup().getId());
          })
          .filter(pm -> {
            boolean tmdbMatch = tmdbId != null && tmdbId.equals(pm.getTmdbId());
            boolean titleMatch = normTitle != null && !normTitle.isEmpty()
                && pm.getTitle() != null && normTitle.equals(pm.getTitle().trim().toLowerCase());
            return tmdbMatch || titleMatch;
          })
          .sorted(Comparator.comparing(PersonalMovie::getCreatedAt,
              Comparator.nullsFirst(Comparator.naturalOrder())))
          .map(pm -> {
            AppUser owner = usersById.get(pm.getUserId());
            return owner != null ? owner.getName() : null;
          })
          .filter(Objects::nonNull)
          .distinct()
          .toList();
    } finally {
      lock.readLock().unlock();
    }
  }

  public PersonalMovie findPersonalMovieForCaller(String callerId, Long tmdbId, String title) {
    lock.readLock().lock();
    try {
      String normTitle = title == null ? null : title.trim().toLowerCase();
      return personalMoviesById.values().stream()
          .filter(pm -> callerId.equals(pm.getUserId()))
          .filter(pm -> {
            boolean tmdbMatch = tmdbId != null && tmdbId.equals(pm.getTmdbId());
            boolean titleMatch = normTitle != null && !normTitle.isEmpty()
                && pm.getTitle() != null && normTitle.equals(pm.getTitle().trim().toLowerCase());
            return tmdbMatch || titleMatch;
          })
          .findFirst()
          .orElse(null);
    } finally {
      lock.readLock().unlock();
    }
  }

  public void savePersonalMovie(PersonalMovie movie) {
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
      personalMoviesById.put(movie.getId(), movie);
      persist();
    } finally {
      lock.writeLock().unlock();
    }
  }

  public void deletePersonalMovieById(String id, String userId) {
    lock.writeLock().lock();
    try {
      PersonalMovie pm = personalMoviesById.get(id);
      if (pm != null && userId.equals(pm.getUserId())) {
        personalMoviesById.remove(id);
        persist();
      }
    } finally {
      lock.writeLock().unlock();
    }
  }

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

  public Movie rateMovie(String movieId, String groupId, String raterId, BigDecimal score) {
    lock.writeLock().lock();
    try {
      Movie movie = moviesById.get(movieId);
      if (movie == null || !groupId.equals(movie.getOwner().getUserGroup().getId())) {
        return null;
      }
      AppUser rater = usersById.get(raterId);
      if (rater == null) {
        return null;
      }
      Rating rating = movie.getRatings().stream()
          .filter(r -> raterId.equals(r.getUser().getId()))
          .findFirst()
          .orElse(null);
      if (rating == null) {
        rating = new Rating();
        rating.setId(UUID.randomUUID().toString());
        rating.setMovie(movie);
        rating.setUser(rater);
        movie.getRatings().add(rating);
      }
      rating.setScore(score);
      movie.setUpdatedAt(Instant.now());
      markWatchedForRating(raterId, movie.getTmdbId(), movie.getTitle());
      persist();
      return movie;
    } finally {
      lock.writeLock().unlock();
    }
  }

  private void markWatchedForRating(String userId, Long tmdbId, String title) {
    PersonalMovie pm = findPersonalMovieForCaller(userId, tmdbId, title);
    if (pm == null) {
      pm = new PersonalMovie();
      pm.setUserId(userId);
      pm.setTitle(title);
      pm.setDescription("");
      pm.setTmdbId(tmdbId);
      pm.setInList(false);
    }
    if (!pm.isWatched()) {
      pm.setWatched(true);
      if (pm.getId() == null) {
        pm.setId(UUID.randomUUID().toString());
      }
      Instant now = Instant.now();
      if (pm.getCreatedAt() == null) {
        pm.setCreatedAt(now);
      }
      pm.setUpdatedAt(now);
      personalMoviesById.put(pm.getId(), pm);
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

  private void persist() {
    try {
      AppData data = buildAppData();
      String json = objectMapper.writeValueAsString(data);
      driveClient.upload(fileId, json);
    } catch (Exception e) {
      throw new DataStoreException("Failed to persist to Google Drive", e);
    }
  }

  private AppData buildAppData() {
    AppData data = new AppData();
    data.setUsers(usersById.values().stream()
        .map(u -> new AppData.UserRecord(u.getId(), u.getName(),
            u.getUserGroup().getName(), u.getRole().getName(), u.getTheme(), u.getDefaultPage(),
            u.getLang(), u.getTmdbLang(), u.getOauthSub(), u.getPersonalListPublic()))
        .toList());
    data.setMovies(moviesById.values().stream()
        .map(m -> new AppData.MovieRecord(m.getId(), m.getTitle(), m.getDescription(),
            m.getOwner().getId(), m.getRound(), m.getCreatedAt(), m.getUpdatedAt(),
            m.getRatings().stream()
                .map(r -> new AppData.RatingRecord(r.getId(), r.getUser().getId(), r.getScore()))
                .toList(),
            m.getTmdbId(), m.getTmdbMediaType()))
        .toList());
    data.setPersonalMovies(personalMoviesById.values().stream()
        .map(pm -> new AppData.PersonalMovieRecord(pm.getId(), pm.getUserId(), pm.getTitle(),
            pm.getDescription(), pm.getRating(), pm.isWatched(), pm.getInList(),
            pm.getCreatedAt(), pm.getUpdatedAt(),
            pm.getTmdbId(), pm.getTmdbMediaType()))
        .toList());
    data.setGroupChatIds(new LinkedHashMap<>(groupChatIdsMap));
    return data;
  }

  public void setGroupChatId(String groupId, Long chatId) {
    lock.writeLock().lock();
    try {
      groupChatIdsMap.put(groupId, chatId);
      persist();
    } finally {
      lock.writeLock().unlock();
    }
  }

  public Long getGroupChatId(String groupId) {
    lock.readLock().lock();
    try {
      return groupChatIdsMap.get(groupId);
    } finally {
      lock.readLock().unlock();
    }
  }
}
