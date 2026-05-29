package com.ridiculousmovies.backend.web;

import com.ridiculousmovies.backend.service.MovieService;
import com.ridiculousmovies.backend.web.dto.CreateMovieRequest;
import com.ridiculousmovies.backend.web.dto.MovieGroupsResponse;
import com.ridiculousmovies.backend.web.dto.MovieResponse;
import com.ridiculousmovies.backend.web.dto.UpdateMovieRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

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

  @GetMapping("/groups")
  public MovieGroupsResponse listGrouped(
      @RequestParam(defaultValue = "desc") String sort
  ) {
    return movieService.listGroupedMovies(sort);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public MovieResponse create(@RequestHeader("User-Id") String userId,
      @RequestBody CreateMovieRequest req) {
    return movieService.createMovie(userId, req);
  }

  @PutMapping("/{id}")
  public MovieResponse update(
      @RequestHeader("User-Id") String userId,
      @PathVariable String id,
      @RequestBody UpdateMovieRequest req
  ) {
    return movieService.updateMovie(userId, id, req);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@RequestHeader("User-Id") String userId, @PathVariable String id) {
    movieService.deleteMovie(userId, id);
  }
}
