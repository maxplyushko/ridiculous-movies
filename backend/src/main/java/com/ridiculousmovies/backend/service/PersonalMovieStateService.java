package com.ridiculousmovies.backend.service;

import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.domain.PersonalMovie;
import com.ridiculousmovies.backend.store.AppRepository;
import com.ridiculousmovies.backend.web.dto.PersonalMovieStateRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PersonalMovieStateService {

  public static final int GUEST_PERSONAL_LIMIT = 4;

  private final AppRepository dataStore;
  private final AuthService authService;

  public PersonalMovieStateService(AppRepository dataStore, AuthService authService) {
    this.dataStore = dataStore;
    this.authService = authService;
  }

  public PersonalMovie update(String userId, PersonalMovieStateRequest req) {
    AppUser user = authService.requireUser(userId);
    PersonalMovie movie = dataStore.findPersonalMovieForCaller(userId, req.tmdbId(), req.title());
    boolean isNew = movie == null;
    if (isNew) {
      movie = new PersonalMovie();
      movie.setUserId(userId);
      movie.setTitle(req.title());
      movie.setDescription(req.description() != null ? req.description() : "");
      movie.setTagline(req.tagline() != null ? req.tagline() : "");
      movie.setTmdbId(req.tmdbId());
      movie.setTmdbMediaType(req.tmdbMediaType());
      movie.setInList(false);
      movie.setWatched(false);
    }
    if (req.tagline() != null && !req.tagline().isBlank()
        && (movie.getTagline() == null || movie.getTagline().isBlank())) {
      movie.setTagline(req.tagline());
    }
    if (req.inList() != null) {
      movie.setInList(req.inList());
    }
    if (req.watched() != null) {
      movie.setWatched(req.watched());
    }
    if (req.rating() != null) {
      movie.setRating(req.rating());
      movie.setWatched(true);
    }
    boolean listed = movie.getInList() != null && movie.getInList();
    if (!listed && !movie.isWatched() && movie.getRating() == null) {
      if (movie.getId() != null) {
        dataStore.deletePersonalMovieById(movie.getId(), userId);
      }
      return null;
    }
    PersonalMovie saved = dataStore.savePersonalMovieForOwner(
        movie, isNew && authService.isGuest(user), GUEST_PERSONAL_LIMIT);
    if (saved == null) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "GUEST_LIMIT_REACHED");
    }
    return saved;
  }
}
