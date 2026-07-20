package com.ridiculousmovies.backend.service;

import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.domain.Movie;
import com.ridiculousmovies.backend.domain.Rating;
import com.ridiculousmovies.backend.store.AppRepository;
import com.ridiculousmovies.backend.telegram.TelegramBotClient;
import com.ridiculousmovies.backend.web.dto.CreateMovieRequest;
import com.ridiculousmovies.backend.web.dto.MovieGroupResponse;
import com.ridiculousmovies.backend.web.dto.MovieGroupsResponse;
import com.ridiculousmovies.backend.web.dto.MovieResponse;
import com.ridiculousmovies.backend.web.dto.RateMovieRequest;
import com.ridiculousmovies.backend.web.dto.RatingInputDto;
import com.ridiculousmovies.backend.web.dto.UpdateMovieRequest;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MovieService {

  private static final BigDecimal MAX_SCORE = BigDecimal.TEN;

  private final AppRepository dataStore;
  private final MovieMapper movieMapper;
  private final AuthService authService;
  private final Optional<TelegramBotClient> botClient;

  public MovieService(AppRepository dataStore, MovieMapper movieMapper, AuthService authService,
      Optional<TelegramBotClient> botClient) {
    this.dataStore = dataStore;
    this.movieMapper = movieMapper;
    this.authService = authService;
    this.botClient = botClient;
  }

  public List<MovieResponse> listMovies(
      String userId, String filter, String sort, int minRatings, boolean requireAllUsers) {
    AppUser user = authService.requireUser(userId);
    String groupId = user.getUserGroup().getId();
    if (minRatings < 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "minRatings must be >= 0");
    }
    long groupMemberCount = authService.countGroupMembers(groupId);
    String sortDir = normalizeSort(sort);
    return switch (normalizeFilter(filter)) {
      case "all" -> {
        List<Movie> movies = dataStore.findMoviesForGroup(groupId, "asc".equals(sortDir));
        yield movies.stream().map(m -> movieMapper.toResponse(m, groupId)).toList();
      }
      case "top_rating" -> rankedMovies(groupId, dataStore.findIdsWithExtremumAvgForGroup(
          groupId, minRatings, requireAllUsers, groupMemberCount, true));
      case "lowest_rating" -> rankedMovies(groupId, dataStore.findIdsWithExtremumAvgForGroup(
          groupId, minRatings, requireAllUsers, groupMemberCount, false));
      default ->
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown filter: " + filter);
    };
  }

  public MovieGroupsResponse listGroupedMovies(String userId, String sort) {
    AppUser user = authService.requireUser(userId);
    String groupId = user.getUserGroup().getId();
    List<Movie> movies = dataStore.findMoviesForGroup(groupId, "asc".equals(normalizeSort(sort)));

    Map<Integer, List<MovieResponse>> byRound = new LinkedHashMap<>();
    for (Movie m : movies) {
      int round = m.getRound() != null ? m.getRound() : 0;
      byRound.computeIfAbsent(round, k -> new ArrayList<>())
          .add(movieMapper.toResponse(m, groupId));
    }
    int currentRound = dataStore.findLatestRoundForGroup(groupId);
    byRound.putIfAbsent(currentRound, new ArrayList<>());

    List<MovieGroupResponse> groups = byRound.entrySet().stream()
        .map(e -> new MovieGroupResponse(e.getKey(), e.getValue()))
        .toList();

    return new MovieGroupsResponse(currentRound, dataStore.findMaxRoundForGroup(groupId), groups);
  }

  public MovieResponse createMovie(String userId, CreateMovieRequest req) {
    AppUser actor = authService.requireUser(userId);
    String groupId = actor.getUserGroup().getId();
    AppUser owner = resolveOwner(groupId, req.title(), req.ownerId());

    Movie movie = new Movie();
    movie.setTitle(req.title().trim());
    movie.setDescription(normalizeDescription(req.description()));
    movie.setOwner(owner);
    movie.setRound(resolveCreateRound(groupId, req.round()));
    movie.setTmdbId(req.tmdbId());
    movie.setTmdbMediaType(req.tmdbMediaType());
    movie.setRatings(new ArrayList<>());
    replaceRatings(groupId, movie, req.ratings());

    dataStore.saveMovie(movie);
    notifyGroupChat(groupId, "New movie was added \"" + movie.getTitle() + "\". Time to rate it!!");
    return movieMapper.toResponse(movie, groupId);
  }

  public MovieResponse updateMovie(String userId, String movieId, UpdateMovieRequest req) {
    AppUser actor = authService.requireUser(userId);
    String groupId = actor.getUserGroup().getId();
    Movie movie = dataStore.findMoviesByIdsAndGroup(List.of(movieId), groupId).stream()
        .findFirst()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));
    AppUser owner = resolveOwner(groupId, req.title(), req.ownerId());

    movie.setTitle(req.title().trim());
    movie.setDescription(normalizeDescription(req.description()));
    movie.setOwner(owner);
    if (req.round() != null) {
      movie.setRound(Math.max(1, req.round()));
    }
    movie.setTmdbId(req.tmdbId());
    movie.setTmdbMediaType(req.tmdbMediaType());
    replaceRatings(groupId, movie, req.ratings());

    dataStore.saveMovie(movie);
    return movieMapper.toResponse(movie, groupId);
  }

  public MovieResponse rateMovie(String userId, String movieId, RateMovieRequest req) {
    AppUser actor = authService.requireUser(userId);
    String groupId = actor.getUserGroup().getId();
    BigDecimal score = req.score();
    if (score == null || score.compareTo(BigDecimal.ZERO) < 0 || score.compareTo(MAX_SCORE) > 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "score must be between 0 and 10");
    }
    Movie movie = dataStore.rateMovie(movieId, groupId, userId, score);
    if (movie == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found");
    }
    return movieMapper.toResponse(movie, groupId);
  }

  public void deleteMovie(String userId, String movieId) {
    AppUser actor = authService.requireUser(userId);
    authService.requireAdmin(actor);
    String groupId = actor.getUserGroup().getId();
    if (!dataStore.existsByIdAndGroup(movieId, groupId)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found");
    }
    dataStore.deleteMovieById(movieId);
  }

  private void notifyGroupChat(String groupId, String text) {
    botClient.ifPresent(bot -> {
      Long chatId = dataStore.getGroupChatId(groupId);
      if (chatId != null) {
        bot.sendMessage(chatId, text);
      }
    });
  }

  private AppUser resolveOwner(String groupId, String title, String ownerId) {
    if (title == null || title.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title must not be blank");
    }
    if (ownerId == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ownerId is required");
    }
    authService.assertUserInGroup(ownerId, groupId);
    return dataStore.findUserById(ownerId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
  }

  private static String normalizeDescription(String description) {
    return description == null ? "" : description.trim();
  }

  private void replaceRatings(String groupId, Movie movie, List<RatingInputDto> ratings) {
    Map<String, Rating> existingByUserId = new HashMap<>();
    for (Rating r : movie.getRatings()) {
      existingByUserId.put(r.getUser().getId(), r);
    }

    if (ratings == null || ratings.isEmpty()) {
      movie.getRatings().clear();
      return;
    }

    Set<String> seen = new HashSet<>();
    List<Rating> desired = new ArrayList<>();
    for (RatingInputDto entry : ratings) {
      if (!seen.add(entry.userId())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "duplicate userId in ratings: " + entry.userId());
      }
      authService.assertUserInGroup(entry.userId(), groupId);
      BigDecimal score = entry.score();
      if (score == null || score.compareTo(BigDecimal.ZERO) < 0 || score.compareTo(MAX_SCORE) > 0) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "score must be between 0 and 10");
      }
      Rating rating = existingByUserId.get(entry.userId());
      if (rating == null) {
        rating = new Rating();
        rating.setId(UUID.randomUUID().toString());
        rating.setMovie(movie);
        rating.setUser(dataStore.findUserById(entry.userId())
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")));
      }
      rating.setScore(score);
      desired.add(rating);
    }
    movie.setRatings(desired);
  }

  private int resolveCreateRound(String groupId, Integer requestedRound) {
    int latestRound = dataStore.findLatestRoundForGroup(groupId);
    return requestedRound != null ? Math.max(1, requestedRound) : latestRound;
  }

  private List<MovieResponse> rankedMovies(String groupId, List<String> ids) {
    if (ids.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "no_movie_matches_filters");
    }
    return dataStore.findMoviesByIdsAndGroup(ids, groupId).stream()
        .map(m -> movieMapper.toResponse(m, groupId))
        .toList();
  }

  private static String normalizeFilter(String filter) {
    if (filter == null || filter.isBlank()) {
      return "all";
    }
    return filter.trim().toLowerCase();
  }

  private static String normalizeSort(String sort) {
    if (sort == null || sort.isBlank()) {
      return "desc";
    }
    String s = sort.trim().toLowerCase();
    if (!"asc".equals(s) && !"desc".equals(s)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sort must be asc or desc");
    }
    return s;
  }
}
