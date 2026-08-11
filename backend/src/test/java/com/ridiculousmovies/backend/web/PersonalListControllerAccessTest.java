package com.ridiculousmovies.backend.web;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.domain.PersonalMovie;
import com.ridiculousmovies.backend.domain.UserGroup;
import com.ridiculousmovies.backend.service.AuthService;
import com.ridiculousmovies.backend.store.AppRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class PersonalListControllerAccessTest {

  @Mock
  AppRepository dataStore;
  @Mock
  AuthService authService;

  PersonalListController controller;

  static final String CALLER = "caller";
  static final String TARGET = "target";

  @BeforeEach
  void setUp() {
    controller = new PersonalListController(dataStore, authService);
  }

  private AppUser user(String id, String groupId, boolean personalListPublic) {
    UserGroup g = new UserGroup();
    g.setId(groupId);
    g.setName(groupId);
    AppUser u = new AppUser();
    u.setId(id);
    u.setUserGroup(g);
    u.setPersonalListPublic(personalListPublic);
    return u;
  }

  private void stubMovies() {
    PersonalMovie pm = new PersonalMovie();
    pm.setId("m1");
    pm.setUserId(TARGET);
    pm.setTitle("Movie");
    when(dataStore.findPersonalMoviesForUser(TARGET)).thenReturn(List.of(pm));
  }

  @Test
  void publicMemberInGroupIsVisible() {
    when(authService.requireGroup(CALLER)).thenReturn(user(CALLER, "g", true));
    when(authService.requireUser(TARGET)).thenReturn(user(TARGET, "g", true));
    doNothing().when(authService).assertUserInGroup(eq(TARGET), eq("g"));
    stubMovies();

    assertEquals(1, controller.listForUser(CALLER, TARGET).size());
  }

  @Test
  void privateMemberIsForbidden() {
    when(authService.requireGroup(CALLER)).thenReturn(user(CALLER, "g", true));
    when(authService.requireUser(TARGET)).thenReturn(user(TARGET, "g", false));
    doNothing().when(authService).assertUserInGroup(eq(TARGET), eq("g"));

    ResponseStatusException ex = assertThrows(ResponseStatusException.class,
        () -> controller.listForUser(CALLER, TARGET));
    assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
  }

  @Test
  void memberOutsideGroupIsRejected() {
    when(authService.requireGroup(CALLER)).thenReturn(user(CALLER, "g", true));
    lenient().when(authService.requireUser(TARGET)).thenReturn(user(TARGET, "other", true));
    doThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST))
        .when(authService).assertUserInGroup(eq(TARGET), eq("g"));

    assertThrows(ResponseStatusException.class, () -> controller.listForUser(CALLER, TARGET));
  }

  @Test
  void selfSeesOwnPrivateList() {
    AppUser callerUser = user(CALLER, "g", false);
    when(authService.requireGroup(CALLER)).thenReturn(callerUser);
    when(authService.requireUser(CALLER)).thenReturn(callerUser);
    doNothing().when(authService).assertUserInGroup(eq(CALLER), eq("g"));
    PersonalMovie pm = new PersonalMovie();
    pm.setId("m1");
    pm.setUserId(CALLER);
    pm.setTitle("Movie");
    when(dataStore.findPersonalMoviesForUser(CALLER)).thenReturn(List.of(pm));

    assertEquals(1, controller.listForUser(CALLER, CALLER).size());
  }
}
