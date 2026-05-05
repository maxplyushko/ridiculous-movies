package com.ridiculousmovies.backend.web;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ridiculousmovies.backend.service.MovieService;
import com.ridiculousmovies.backend.web.dto.MovieResponse;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/movies")
public class MovieController {

  private final MovieService movieService;

	@GetMapping
	public List<MovieResponse> list(
			@RequestParam(required = false) String filter,
			@RequestParam(defaultValue = "desc") String sort,
			@RequestParam(defaultValue = "1") int minRatings,
			@RequestParam(defaultValue = "false") boolean requireAllUsers
	) {
		return movieService.listMovies(filter, sort, minRatings, requireAllUsers);
	}
}
