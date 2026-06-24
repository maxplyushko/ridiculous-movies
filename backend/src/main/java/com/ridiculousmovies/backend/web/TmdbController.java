package com.ridiculousmovies.backend.web;

import com.ridiculousmovies.backend.tmdb.TmdbClient;
import com.ridiculousmovies.backend.web.dto.TmdbMovieResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/tmdb")
public class TmdbController {

  private final TmdbClient tmdbClient;

  @GetMapping("/search")
  public List<TmdbMovieResponse> search(@RequestParam String q) {
    if (q == null || q.trim().length() < 3) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Query must be at least 3 characters");
    }
    return tmdbClient.search(q.trim());
  }
}
