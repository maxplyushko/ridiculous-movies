package com.ridiculousmovies.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.ridiculousmovies.backend.repository.MovieRepository;
import com.ridiculousmovies.backend.web.dto.MovieResponse;

@Service
public class MovieService {

	private final MovieRepository movieRepository;
	private final MovieMapper movieMapper;

	public MovieService(MovieRepository movieRepository, MovieMapper movieMapper) {
		this.movieRepository = movieRepository;
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

	private List<MovieResponse> rankedMovies(List<Long> ids) {
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
