package com.ridiculousmovies.backend.web;

import com.ridiculousmovies.backend.tmdb.TmdbClient;
import com.ridiculousmovies.backend.web.dto.TmdbActorResponse;
import com.ridiculousmovies.backend.web.dto.TmdbMovieDetailsResponse;
import com.ridiculousmovies.backend.web.dto.TmdbMovieResponse;
import com.ridiculousmovies.backend.web.dto.TmdbPersonResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
  public List<TmdbMovieResponse> search(
      @RequestParam String q,
      @RequestParam(required = false) String lang,
      @RequestParam(required = false, defaultValue = "false") boolean includeTv
  ) {
    if (q == null || q.trim().length() < 2) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Query must be at least 2 characters");
    }
    return tmdbClient.search(q.trim(), lang, includeTv);
  }

  @GetMapping("/search/person")
  public List<TmdbPersonResponse> searchPeople(
      @RequestParam String q,
      @RequestParam(required = false) String lang
  ) {
    if (q == null || q.trim().length() < 2) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Query must be at least 2 characters");
    }
    return tmdbClient.searchPeople(q.trim(), lang);
  }

  @GetMapping("/movie/{id}")
  public TmdbMovieDetailsResponse details(
      @PathVariable long id,
      @RequestParam(required = false) String lang,
      @RequestParam(required = false) String mediaType
  ) {
    return tmdbClient.getDetails(id, lang, mediaType)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "TMDB movie not found"));
  }

  @GetMapping("/actor/{id}")
  public TmdbActorResponse actor(
      @PathVariable long id,
      @RequestParam(required = false) String lang
  ) {
    return tmdbClient.getActor(id, lang)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "TMDB actor not found"));
  }

  @GetMapping("/image/{size}/{filename:.+}")
  public ResponseEntity<byte[]> image(@PathVariable String size, @PathVariable String filename) {
    return tmdbClient.fetchImage(size, filename);
  }
}
