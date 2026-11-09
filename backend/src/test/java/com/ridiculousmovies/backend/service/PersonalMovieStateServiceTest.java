package com.ridiculousmovies.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.domain.PersonalMovie;
import com.ridiculousmovies.backend.store.AppRepository;
import com.ridiculousmovies.backend.web.dto.PersonalMovieStateRequest;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class PersonalMovieStateServiceTest {

  @Mock AppRepository dataStore;
  @Mock AuthService authService;
  private PersonalMovieStateService service;

  @BeforeEach
  void setUp() {
    service = new PersonalMovieStateService(dataStore, authService);
  }

  @Test
  void emptyNewStateIsNotPersisted() {
    when(authService.requireUser("u")).thenReturn(new AppUser());
    when(dataStore.findPersonalMovieForCaller("u", 12L, "Film")).thenReturn(null);

    assertNull(service.update("u", request(null, null, null)));
    verify(dataStore, never()).savePersonalMovieForOwner(
        org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyBoolean(),
        org.mockito.ArgumentMatchers.anyInt());
  }

  @Test
  void ratingMarksNewStateWatchedAndPersists() {
    AppUser user = new AppUser();
    when(authService.requireUser("u")).thenReturn(user);
    when(authService.isGuest(user)).thenReturn(false);
    when(dataStore.findPersonalMovieForCaller("u", 12L, "Film")).thenReturn(null);
    when(dataStore.savePersonalMovieForOwner(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.eq(false),
        org.mockito.ArgumentMatchers.eq(4))).thenAnswer(invocation -> invocation.getArgument(0));

    PersonalMovie saved = service.update("u", request(null, null, new BigDecimal("8.5")));

    assertEquals("", saved.getDescription());
    assertEquals("", saved.getTagline());
    assertEquals(new BigDecimal("8.5"), saved.getRating());
    org.junit.jupiter.api.Assertions.assertTrue(saved.isWatched());
  }

  @Test
  void emptyExistingStateDeletesItsRecord() {
    AppUser user = new AppUser();
    PersonalMovie existing = new PersonalMovie();
    existing.setId("saved");
    existing.setUserId("u");
    existing.setTitle("Film");
    existing.setInList(true);
    when(authService.requireUser("u")).thenReturn(user);
    when(dataStore.findPersonalMovieForCaller("u", 12L, "Film")).thenReturn(existing);

    assertNull(service.update("u", request(false, false, null)));

    verify(dataStore).deletePersonalMovieById("saved", "u");
    verify(dataStore, never()).savePersonalMovieForOwner(
        org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyBoolean(),
        org.mockito.ArgumentMatchers.anyInt());
  }

  @Test
  void guestLimitStillReturnsForbidden() {
    AppUser user = new AppUser();
    when(authService.requireUser("u")).thenReturn(user);
    when(authService.isGuest(user)).thenReturn(true);
    when(dataStore.findPersonalMovieForCaller("u", 12L, "Film")).thenReturn(null);
    when(dataStore.savePersonalMovieForOwner(org.mockito.ArgumentMatchers.any(),
        org.mockito.ArgumentMatchers.eq(true), org.mockito.ArgumentMatchers.eq(4))).thenReturn(null);

    ResponseStatusException error = assertThrows(ResponseStatusException.class,
        () -> service.update("u", request(true, null, null)));

    assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
    assertEquals("GUEST_LIMIT_REACHED", error.getReason());
  }

  private PersonalMovieStateRequest request(Boolean inList, Boolean watched, BigDecimal rating) {
    return new PersonalMovieStateRequest(12L, "Film", null, null, "movie", inList, watched, rating);
  }
}
