package com.ridiculousmovies.backend.web;

import com.ridiculousmovies.backend.domain.WatchlistMovie;
import com.ridiculousmovies.backend.store.AppRepository;
import com.ridiculousmovies.backend.web.dto.CreateWatchlistMovieRequest;
import com.ridiculousmovies.backend.web.dto.UpdateWatchlistMovieRequest;
import com.ridiculousmovies.backend.web.dto.WatchlistMovieResponse;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/watchlist")
public class WatchlistController {

  private final AppRepository dataStore;

  @GetMapping
  public List<WatchlistMovieResponse> list(@RequestHeader("User-Id") String userId) {
    return dataStore.findWatchlistMoviesForUser(userId).stream()
        .map(WatchlistMovieResponse::from)
        .toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public WatchlistMovieResponse create(
      @RequestHeader("User-Id") String userId,
      @RequestBody CreateWatchlistMovieRequest req
  ) {
    WatchlistMovie wm = new WatchlistMovie();
    wm.setUserId(userId);
    wm.setTitle(req.title());
    wm.setDescription(req.description() != null ? req.description() : "");
    wm.setRating(req.rating());
    wm.setWatched(false);
    dataStore.saveWatchlistMovie(wm);
    return WatchlistMovieResponse.from(wm);
  }

  @PutMapping("/{id}")
  public WatchlistMovieResponse update(
      @RequestHeader("User-Id") String userId,
      @PathVariable String id,
      @RequestBody UpdateWatchlistMovieRequest req
  ) {
    List<WatchlistMovie> movies = dataStore.findWatchlistMoviesForUser(userId);
    WatchlistMovie wm = movies.stream()
        .filter(m -> id.equals(m.getId()))
        .findFirst()
        .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.NOT_FOUND));
    wm.setTitle(req.title());
    wm.setDescription(req.description() != null ? req.description() : "");
    wm.setRating(req.rating());
    wm.setWatched(req.watched());
    dataStore.saveWatchlistMovie(wm);
    return WatchlistMovieResponse.from(wm);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@RequestHeader("User-Id") String userId, @PathVariable String id) {
    dataStore.deleteWatchlistMovieById(id, userId);
  }
}
