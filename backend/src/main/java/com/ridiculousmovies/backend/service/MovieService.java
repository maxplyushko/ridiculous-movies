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

  public MovieService(MovieRepository movieRepository, AppUserRepository appUserRepository,
      RatingRepository ratingRepository, MovieMapper movieMapper) {
    this.movieRepository = movieRepository;
    this.appUserRepository = appUserRepository;
    this.ratingRepository = ratingRepository;
    this.movieMapper = movieMapper;
  }

  @Transactional(readOnly = true)
  public List<MovieResponse> listMovies(String filter, String sort, int minRatings,
      boolean requireAllUsers) {
    if (minRatings < 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "minRatings must be >= 0");
    }
    String sortDir = normalizeSort(sort);
    return switch (normalizeFilter(filter)) {
      case "all" -> {
        var movies = "asc".equals(sortDir)
            ? movieRepository.findAllFetchedSortedByCreatedAtAsc()
            : movieRepository.findAllFetchedSortedByCreatedAtDesc();
        yield movies.stream().map(movieMapper::toResponse).toList();
      }
      case "top_rating" -> rankedMovies(
          movieRepository.findIdsWithHighestAverage(minRatings, requireAllUsers)
      );
      case "lowest_rating" -> rankedMovies(
          movieRepository.findIdsWithLowestAverage(minRatings, requireAllUsers)
      );
      default ->
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown filter: " + filter);
    };
  }

  @Transactional(readOnly = true)
  public MovieGroupsResponse listGroupedMovies(String sort) {
    String sortDir = normalizeSort(sort);
    List<Movie> movies = "asc".equals(sortDir)
        ? movieRepository.findAllFetchedSortedByCreatedAtAsc()
        : movieRepository.findAllFetchedSortedByCreatedAtDesc();

    Map<Integer, List<MovieResponse>> byRound = new LinkedHashMap<>();
    for (Movie m : movies) {
      int round = m.getRound() != null ? m.getRound() : 0;
      byRound.computeIfAbsent(round, k -> new ArrayList<>())
          .add(movieMapper.toResponse(m));
    }
    int currentRound = movieRepository.findLatestRound();
    byRound.putIfAbsent(currentRound, new ArrayList<>());

    List<MovieGroupResponse> groups = byRound.entrySet().stream()
        .map(e -> new MovieGroupResponse(e.getKey(), e.getValue()))
        .toList();

    return new MovieGroupsResponse(currentRound, movieRepository.findMaxRound(), groups);
  }

  @Transactional
  public MovieResponse createMovie(String userId, CreateMovieRequest req) {
    assertAuthorized(userId);
    AppUser owner = resolveOwner(req.title(), req.ownerId());

    Movie movie = new Movie();
    movie.setTitle(req.title().trim());
    movie.setDescription(normalizeDescription(req.description()));
    movie.setOwner(owner);
    movie.setRound(resolveCreateRound(req.round()));
    movieRepository.save(movie);
    replaceRatings(movie, req.ratings());

    return fetchMovieResponse(movie.getId());
  }

  @Transactional
  public MovieResponse updateMovie(String userId, String movieId, UpdateMovieRequest req) {
    assertAuthorized(userId);
    Movie movie = movieRepository.findAllFetchedByIdIn(List.of(movieId)).stream()
        .findFirst()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));
    AppUser owner = resolveOwner(req.title(), req.ownerId());

    movie.setTitle(req.title().trim());
    movie.setDescription(normalizeDescription(req.description()));
    movie.setOwner(owner);
    replaceRatings(movie, req.ratings());

    return fetchMovieResponse(movie.getId());
  }

  @Transactional
  public void deleteMovie(String userId, String movieId) {
    assertAuthorized(userId);
    Movie movie = movieRepository.findById(movieId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));
    movieRepository.delete(movie);
  }

  private void assertAuthorized(String userId) {
    appUserRepository.findById(userId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Access denied"));
  }

  private AppUser resolveOwner(String title, String ownerId) {
    if (title == null || title.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title must not be blank");
    }
    if (ownerId == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ownerId is required");
    }
    return getUser(ownerId);
  }

  private static String normalizeDescription(String description) {
    return description == null ? "" : description.trim();
  }

  private void replaceRatings(Movie movie, List<RatingInputDto> ratings) {
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

  private MovieResponse fetchMovieResponse(String movieId) {
    Movie saved = movieRepository.findAllFetchedByIdIn(List.of(movieId)).stream()
        .findFirst()
        .orElseThrow();
    return movieMapper.toResponse(saved);
  }

  private AppUser getUser(String id) {
    return appUserRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
  }

  private int resolveCreateRound(Integer requestedRound) {
    int latestRound = movieRepository.findLatestRound();
    int round = requestedRound != null ? requestedRound : latestRound;
    if (round < latestRound || round > latestRound + 1) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "round must be " + latestRound + " or " + (latestRound + 1));
    }
    return round;
  }

  private List<MovieResponse> rankedMovies(List<String> ids) {
    if (ids.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "no_movie_matches_filters");
    }
    return movieRepository.findAllFetchedByIdIn(ids).stream().map(movieMapper::toResponse).toList();
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
