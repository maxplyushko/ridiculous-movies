package com.ridiculousmovies.backend.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
import com.ridiculousmovies.backend.web.dto.UserRefDto;

@Service
public class MovieService {

	private static final int USERS_PER_ROUND = 4;

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
	public List<MovieResponse> listMovies(String filter, String sort, int minRatings, boolean requireAllUsers) {
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
			default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown filter: " + filter);
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
		List<MovieGroupResponse> groups = byRound.entrySet().stream()
				.map(e -> new MovieGroupResponse(e.getKey(), e.getValue()))
				.toList();

		List<Object[]> rows = appUserRepository.findUsersLeftInCurrentRound();
		int currentRound = rows.isEmpty()
				? movieRepository.findMaxRound()
				: ((Number) rows.get(0)[0]).intValue();
		List<UserRefDto> usersLeft = rows.stream()
				.map(r -> new UserRefDto(Objects.requireNonNull(r[1]).toString(), (String) r[2]))
				.toList();

		return new MovieGroupsResponse(currentRound, usersLeft, groups);
	}

	@Transactional
	public MovieResponse createMovie(String userId, CreateMovieRequest req) {
		appUserRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Access denied"));

		if (req.title() == null || req.title().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title must not be blank");
		}
		if (req.ownerId() == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ownerId is required");
		}

		String ownerId = req.ownerId();
		AppUser owner = getUser(ownerId);

		Movie movie = new Movie();
		movie.setTitle(req.title().trim());
		movie.setDescription(req.description() == null ? "" : req.description().trim());
		movie.setOwner(owner);
		movie.setRound(resolveRound(owner.getId()));
		movieRepository.save(movie);

		if (req.ratings() != null && !req.ratings().isEmpty()) {
			Set<String> seen = new HashSet<>();
			for (RatingInputDto entry : req.ratings()) {
				if (!seen.add(entry.userId())) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
							"duplicate userId in ratings: " + entry.userId());
				}
				BigDecimal score = entry.score();
				if (score == null || score.compareTo(BigDecimal.ZERO) < 0
						|| score.compareTo(new BigDecimal("10.99")) > 0) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
							"score must be between 0 and 10.99");
				}
				AppUser rater = getUser(entry.userId());
				Rating rating = new Rating();
				rating.setMovie(movie);
				rating.setUser(rater);
				rating.setScore(score);
				ratingRepository.save(rating);
			}
		}

		Movie saved = movieRepository.findAllFetchedByIdIn(List.of(movie.getId())).stream()
				.findFirst()
				.orElseThrow();
		return movieMapper.toResponse(saved);
	}

	private AppUser getUser(String id) {
		return appUserRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
	}

	private int resolveRound(String ownerId) {
		int currentRound = movieRepository.findMaxRound();
		if (currentRound == 0) {
			return 1;
		}
		Set<String> owners = movieRepository.findDistinctOwnerIdsByRound(currentRound);
		if (owners.size() >= USERS_PER_ROUND && !owners.contains(ownerId)) {
			return currentRound + 1;
		}
		return currentRound;
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
