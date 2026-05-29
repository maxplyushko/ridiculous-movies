package com.ridiculousmovies.backend.service;

import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.domain.Movie;
import com.ridiculousmovies.backend.domain.Rating;
import com.ridiculousmovies.backend.repository.AppUserRepository;
import com.ridiculousmovies.backend.repository.MovieRepository;
import com.ridiculousmovies.backend.repository.RatingRepository;
import com.ridiculousmovies.backend.web.dto.CreateMovieRequest;
import com.ridiculousmovies.backend.web.dto.MovieGroupResponse;
import com.ridiculousmovies.backend.web.dto.MovieGroupsResponse;
import com.ridiculousmovies.backend.web.dto.MovieResponse;
import com.ridiculousmovies.backend.web.dto.RatingInputDto;
import com.ridiculousmovies.backend.web.dto.UpdateMovieRequest;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MovieService {

  private static final BigDecimal MAX_SCORE = BigDecimal.TEN;

  private final MovieRepository movieRepository;
  private final AppUserRepository appUserRepository;
  private final RatingRepository ratingRepository;
  private final MovieMapper movieMapper;
  private final AuthService authService;

  public MovieService(
      MovieRepository movieRepository,
      AppUserRepository appUserRepository,
      RatingRepository ratingRepository,
      MovieMapper movieMapper,
      AuthService authService
  ) {
    this.movieRepository = movieRepository;
    this.appUserRepository = appUserRepository;
    this.ratingRepository = ratingRepository;
    this.movieMapper = movieMapper;
    this.authService = authService;
  }

  @Transactional(readOnly = true)
  public List<MovieResponse> listMovies(
      String userId,
      String filter,
      String sort,
      int minRatings,
      boolean requireAllUsers
  ) {
    AppUser user = authService.requireUser(userId);
    String groupId = user.getUserGroup().getId();
    if (minRatings < 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "minRatings must be >= 0");
    }
    long groupMemberCount = authService.countGroupMembers(groupId);
    String sortDir = normalizeSort(sort);
    return switch (normalizeFilter(filter)) {
      case "all" -> {
        var movies = "asc".equals(sortDir)
            ? movieRepository.findAllFetchedSortedByCreatedAtAscForGroup(groupId)
            : movieRepository.findAllFetchedSortedByCreatedAtDescForGroup(groupId);
        yield movies.stream().map(m -> movieMapper.toResponse(m, groupId)).toList();
      }
      case "top_rating" -> rankedMovies(groupId,
          movieRepository.findIdsWithHighestAverageForGroup(
              groupId, minRatings, requireAllUsers, groupMemberCount
          )
      );
      case "lowest_rating" -> rankedMovies(groupId,
          movieRepository.findIdsWithLowestAverageForGroup(
              groupId, minRatings, requireAllUsers, groupMemberCount
          )
      );
      default ->
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown filter: " + filter);
    };
  }

  @Transactional(readOnly = true)
  public MovieGroupsResponse listGroupedMovies(String userId, String sort) {
    AppUser user = authService.requireUser(userId);
    String groupId = user.getUserGroup().getId();
    String sortDir = normalizeSort(sort);
    List<Movie> movies = "asc".equals(sortDir)
        ? movieRepository.findAllFetchedSortedByCreatedAtAscForGroup(groupId)
        : movieRepository.findAllFetchedSortedByCreatedAtDescForGroup(groupId);

    Map<Integer, List<MovieResponse>> byRound = new LinkedHashMap<>();
    for (Movie m : movies) {
      int round = m.getRound() != null ? m.getRound() : 0;
      byRound.computeIfAbsent(round, k -> new ArrayList<>())
          .add(movieMapper.toResponse(m, groupId));
    }
    int currentRound = movieRepository.findLatestRoundForGroup(groupId);
    byRound.putIfAbsent(currentRound, new ArrayList<>());

    List<MovieGroupResponse> groups = byRound.entrySet().stream()
        .map(e -> new MovieGroupResponse(e.getKey(), e.getValue()))
        .toList();

    return new MovieGroupsResponse(
        currentRound,
        movieRepository.findMaxRoundForGroup(groupId),
        groups
    );
  }

  @Transactional
  public MovieResponse createMovie(String userId, CreateMovieRequest req) {
    AppUser actor = authService.requireUser(userId);
    String groupId = actor.getUserGroup().getId();
    AppUser owner = resolveOwner(groupId, req.title(), req.ownerId());

    Movie movie = new Movie();
    movie.setTitle(req.title().trim());
    movie.setDescription(normalizeDescription(req.description()));
    movie.setOwner(owner);
    movie.setRound(resolveCreateRound(groupId, req.round()));
    movieRepository.save(movie);
    replaceRatings(groupId, movie, req.ratings());

    return fetchMovieResponse(groupId, movie.getId());
  }

  @Transactional
  public MovieResponse updateMovie(String userId, String movieId, UpdateMovieRequest req) {
    AppUser actor = authService.requireUser(userId);
    String groupId = actor.getUserGroup().getId();
    Movie movie = movieRepository.findAllFetchedByIdInForGroup(List.of(movieId), groupId).stream()
        .findFirst()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));
    AppUser owner = resolveOwner(groupId, req.title(), req.ownerId());

    movie.setTitle(req.title().trim());
    movie.setDescription(normalizeDescription(req.description()));
    movie.setOwner(owner);
    replaceRatings(groupId, movie, req.ratings());

    return fetchMovieResponse(groupId, movie.getId());
  }

  @Transactional
  public void deleteMovie(String userId, String movieId) {
    AppUser actor = authService.requireUser(userId);
    String groupId = actor.getUserGroup().getId();
    if (!movieRepository.existsByIdAndOwnerGroupId(movieId, groupId)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found");
    }
    movieRepository.deleteById(movieId);
  }

  private AppUser resolveOwner(String groupId, String title, String ownerId) {
    if (title == null || title.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title must not be blank");
    }
    if (ownerId == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ownerId is required");
    }
    authService.assertUserInGroup(ownerId, groupId);
    return getUser(ownerId);
  }

  private static String normalizeDescription(String description) {
    return description == null ? "" : description.trim();
  }

  private void replaceRatings(String groupId, Movie movie, List<RatingInputDto> ratings) {
    Map<String, Rating> existingByUserId = new HashMap<>();
    for (Rating rating : ratingRepository.findByMovie_Id(movie.getId())) {
      existingByUserId.put(rating.getUser().getId(), rating);
    }

    if (ratings == null || ratings.isEmpty()) {
      if (!existingByUserId.isEmpty()) {
        ratingRepository.deleteAll(existingByUserId.values());
        movie.getRatings().clear();
      }
      return;
    }

    Set<String> seen = new HashSet<>();
    Set<String> desiredUserIds = new HashSet<>();
    for (RatingInputDto entry : ratings) {
      if (!seen.add(entry.userId())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "duplicate userId in ratings: " + entry.userId());
      }
      authService.assertUserInGroup(entry.userId(), groupId);
      BigDecimal score = entry.score();
      if (score == null || score.compareTo(BigDecimal.ZERO) < 0
          || score.compareTo(MAX_SCORE) > 0) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "score must be between 0 and 10");
      }
      desiredUserIds.add(entry.userId());
      Rating rating = existingByUserId.get(entry.userId());
      if (rating == null) {
        rating = new Rating();
        rating.setMovie(movie);
        rating.setUser(getUser(entry.userId()));
        movie.getRatings().add(rating);
      } else if (!movie.getRatings().contains(rating)) {
        movie.getRatings().add(rating);
      }
      rating.setScore(score);
    }

    for (Rating rating : existingByUserId.values()) {
      if (!desiredUserIds.contains(rating.getUser().getId())) {
        movie.getRatings().remove(rating);
        ratingRepository.delete(rating);
      }
    }
  }

  private MovieResponse fetchMovieResponse(String groupId, String movieId) {
    Movie saved = movieRepository.findAllFetchedByIdInForGroup(List.of(movieId), groupId).stream()
        .findFirst()
        .orElseThrow();
    return movieMapper.toResponse(saved, groupId);
  }

  private AppUser getUser(String id) {
    return appUserRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
  }

  private int resolveCreateRound(String groupId, Integer requestedRound) {
    int latestRound = movieRepository.findLatestRoundForGroup(groupId);
    int round = requestedRound != null ? requestedRound : latestRound;
    if (round < latestRound || round > latestRound + 1) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "round must be " + latestRound + " or " + (latestRound + 1));
    }
    return round;
  }

  private List<MovieResponse> rankedMovies(String groupId, List<String> ids) {
    if (ids.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "no_movie_matches_filters");
    }
    return movieRepository.findAllFetchedByIdInForGroup(ids, groupId).stream()
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
