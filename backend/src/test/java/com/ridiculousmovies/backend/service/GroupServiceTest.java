package com.ridiculousmovies.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.domain.UserGroup;
import com.ridiculousmovies.backend.store.AppRepository;
import com.ridiculousmovies.backend.web.dto.GroupResponse;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class GroupServiceTest {

  @Mock
  AppRepository dataStore;

  AuthService authService;
  GroupService groupService;

  static final String USER_ID = "u1";

  @BeforeEach
  void setUp() {
    authService = new AuthService(dataStore);
    groupService = new GroupService(dataStore, authService);
  }

  private AppUser groupless() {
    AppUser u = new AppUser();
    u.setId(USER_ID);
    u.setUserGroup(null);
    return u;
  }

  private AppUser inGroup(String groupId) {
    UserGroup g = new UserGroup();
    g.setId(groupId);
    g.setName(groupId);
    AppUser u = new AppUser();
    u.setId(USER_ID);
    u.setUserGroup(g);
    return u;
  }

  @Test
  void createGroupAssignsCallerAndReturnsInviteCode() {
    when(dataStore.findUserById(USER_ID)).thenReturn(Optional.of(groupless()));
    when(dataStore.createGroupAndAssign(USER_ID, "My Club")).thenReturn("code123");

    GroupResponse resp = groupService.createGroup(USER_ID, "My Club");

    assertEquals("My Club", resp.groupId());
    assertEquals("My Club", resp.groupName());
    assertEquals("code123", resp.inviteCode());
  }

  @Test
  void createGroupRejectsWhenAlreadyInGroup() {
    when(dataStore.findUserById(USER_ID)).thenReturn(Optional.of(inGroup("g1")));

    assertThrows(ResponseStatusException.class, () -> groupService.createGroup(USER_ID, "New Club"));
  }

  @Test
  void createGroupRejectsDuplicateName() {
    when(dataStore.findUserById(USER_ID)).thenReturn(Optional.of(groupless()));
    when(dataStore.createGroupAndAssign(USER_ID, "Taken")).thenReturn(null);

    assertThrows(ResponseStatusException.class, () -> groupService.createGroup(USER_ID, "Taken"));
  }

  @Test
  void joinGroupRejectsUnknownCode() {
    when(dataStore.findUserById(USER_ID)).thenReturn(Optional.of(groupless()));
    when(dataStore.resolveGroupIdByInviteCode("bad")).thenReturn(null);

    assertThrows(ResponseStatusException.class, () -> groupService.joinGroup(USER_ID, "bad"));
  }

  @Test
  void joinGroupAssignsCallerToResolvedGroup() {
    when(dataStore.findUserById(USER_ID))
        .thenReturn(Optional.of(groupless()))
        .thenReturn(Optional.of(inGroup("g1")));
    when(dataStore.resolveGroupIdByInviteCode("code123")).thenReturn("g1");

    GroupResponse resp = groupService.joinGroup(USER_ID, "code123");

    assertEquals("g1", resp.groupId());
  }

  @Test
  void getMyInviteLinkRejectsWhenGroupless() {
    when(dataStore.findUserById(USER_ID)).thenReturn(Optional.of(groupless()));

    assertThrows(ResponseStatusException.class, () -> groupService.getMyInviteLink(USER_ID));
  }
}
