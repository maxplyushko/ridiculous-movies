package com.ridiculousmovies.backend.web;

import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.domain.PersonalMovie;
import com.ridiculousmovies.backend.service.AuthService;
import com.ridiculousmovies.backend.store.AppRepository;
import com.ridiculousmovies.backend.web.dto.CreatePersonalMovieRequest;
import com.ridiculousmovies.backend.web.dto.UpdatePersonalMovieRequest;
import com.ridiculousmovies.backend.web.dto.PersonalMovieStateRequest;
import com.ridiculousmovies.backend.web.dto.PersonalMovieResponse;
import org.springframework.http.ResponseEntity;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/personal-list")
public class PersonalListController {

  private final AppRepository dataStore;
  private final AuthService authService;

  @GetMapping
  public List<PersonalMovieResponse> list(@RequestHeader("User-Id") String userId) {
    return dataStore.findPersonalMoviesForUser(userId).stream()
        .map(PersonalMovieResponse::from)
        .toList();
  }

  @GetMapping("/user/{targetId}")
  public List<PersonalMovieResponse> listForUser(
      @RequestHeader("User-Id") String userId,
      @PathVariable String targetId
  ) {
    AppUser caller = authService.requireUser(userId);
    authService.assertUserInGroup(targetId, caller.getUserGroup().getId());
    AppUser target = authService.requireUser(targetId);
    boolean isPublic = target.getPersonalListPublic() == null || target.getPersonalListPublic();
    if (!isPublic && !userId.equals(targetId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This list is private");
    }
    return dataStore.findPersonalMoviesForUser(targetId).stream()
        .map(PersonalMovieResponse::from)
        .toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public PersonalMovieResponse create(
      @RequestHeader("User-Id") String userId,
      @RequestBody CreatePersonalMovieRequest req
  ) {
    PersonalMovie pm = new PersonalMovie();
    pm.setUserId(userId);
    pm.setTitle(req.title());
    pm.setDescription(req.description() != null ? req.description() : "");
    pm.setRating(req.rating());
    pm.setWatched(false);
    pm.setInList(true);
    pm.setTmdbId(req.tmdbId());
    pm.setTmdbMediaType(req.tmdbMediaType());
    dataStore.savePersonalMovie(pm);
    return PersonalMovieResponse.from(pm);
  }

  @GetMapping("/added-by")
  public List<String> addedBy(
      @RequestHeader("User-Id") String userId,
      @RequestParam(required = false) Long tmdbId,
      @RequestParam(required = false) String title
  ) {
    return dataStore.findGroupMembersWhoAdded(userId, tmdbId, title);
  }

  @GetMapping("/status")
  public ResponseEntity<PersonalMovieResponse> status(
      @RequestHeader("User-Id") String userId,
      @RequestParam(required = false) Long tmdbId,
      @RequestParam(required = false) String title
  ) {
    PersonalMovie pm = dataStore.findPersonalMovieForCaller(userId, tmdbId, title);
    return pm == null ? ResponseEntity.noContent().build()
        : ResponseEntity.ok(PersonalMovieResponse.from(pm));
  }

  @PutMapping("/state")
  public ResponseEntity<PersonalMovieResponse> state(
      @RequestHeader("User-Id") String userId,
      @RequestBody PersonalMovieStateRequest req
  ) {
    PersonalMovie pm = dataStore.findPersonalMovieForCaller(userId, req.tmdbId(), req.title());
    if (pm == null) {
      pm = new PersonalMovie();
      pm.setUserId(userId);
      pm.setTitle(req.title());
      pm.setDescription(req.description() != null ? req.description() : "");
      pm.setTmdbId(req.tmdbId());
      pm.setTmdbMediaType(req.tmdbMediaType());
      pm.setInList(false);
      pm.setWatched(false);
    }
    if (req.inList() != null) {
      pm.setInList(req.inList());
    }
    if (req.watched() != null) {
      pm.setWatched(req.watched());
    }
    if (req.rating() != null) {
      pm.setRating(req.rating());
    }
    boolean listed = pm.getInList() != null && pm.getInList();
    if (!listed && !pm.isWatched() && pm.getRating() == null) {
      if (pm.getId() != null) {
        dataStore.deletePersonalMovieById(pm.getId(), userId);
      }
      return ResponseEntity.noContent().build();
    }
    dataStore.savePersonalMovie(pm);
    return ResponseEntity.ok(PersonalMovieResponse.from(pm));
  }

  @PutMapping("/{id}")
  public PersonalMovieResponse update(
      @RequestHeader("User-Id") String userId,
      @PathVariable String id,
      @RequestBody UpdatePersonalMovieRequest req
  ) {
    List<PersonalMovie> movies = dataStore.findPersonalMoviesForUser(userId);
    PersonalMovie pm = movies.stream()
        .filter(m -> id.equals(m.getId()))
        .findFirst()
        .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.NOT_FOUND));
    pm.setTitle(req.title());
    pm.setDescription(req.description() != null ? req.description() : "");
    pm.setRating(req.rating());
    pm.setWatched(req.watched());
    if (req.inList() != null) {
      pm.setInList(req.inList());
    }
    pm.setTmdbId(req.tmdbId());
    pm.setTmdbMediaType(req.tmdbMediaType());
    dataStore.savePersonalMovie(pm);
    return PersonalMovieResponse.from(pm);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@RequestHeader("User-Id") String userId, @PathVariable String id) {
    dataStore.deletePersonalMovieById(id, userId);
  }
}
