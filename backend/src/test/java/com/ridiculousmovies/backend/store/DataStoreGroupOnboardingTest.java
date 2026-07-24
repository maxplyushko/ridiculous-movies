package com.ridiculousmovies.backend.store;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;

import com.ridiculousmovies.backend.domain.AppUser;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class DataStoreGroupOnboardingTest {

  DataStore store;

  private AppData.UserRecord user(String id, String name, String group) {
    return new AppData.UserRecord(id, name, group, "user", null, null, null, null, null, true);
  }

  @BeforeEach
  void setUp() {
    ObjectMapper mapper = new ObjectMapper();
    store = new DataStore(mapper, mock(StorageClient.class), "", "");
    AppData data = new AppData();
    data.setUsers(List.of(user("u1", "Alice", "g1")));
    store.initialize(mapper.writeValueAsString(data));
  }

  @Test
  void registerUserWithNullGroupIdHasNoGroup() {
    AppUser u = store.registerUser("Bob", "sub1", null);
    assertNull(u.getUserGroup());
  }

  @Test
  void registerTelegramUserHasNoGroup() {
    AppUser u = store.registerTelegramUser("tg1", "Carol");
    assertEquals("tg1", u.getId());
    assertNull(u.getUserGroup());
  }

  @Test
  void assignUserToNewGroupSetsGroup() {
    store.registerTelegramUser("tg1", "Carol");
    store.assignUserToNewGroup("tg1", "My Club");
    AppUser u = store.findUserById("tg1").orElseThrow();
    assertEquals("My Club", u.getUserGroup().getId());
    assertEquals("My Club", u.getUserGroup().getName());
  }

  @Test
  void inviteCodeIsStableAndResolvesBackToGroup() {
    String code = store.getOrCreateInviteCode("g1");
    assertNotNull(code);
    assertEquals(code, store.getOrCreateInviteCode("g1"));
    assertEquals("g1", store.resolveGroupIdByInviteCode(code));
  }

  @Test
  void unknownInviteCodeResolvesToNull() {
    assertNull(store.resolveGroupIdByInviteCode("nonexistent"));
  }

  @Test
  void assignUserToExistingGroupJoinsCallerIntoThatGroup() {
    store.registerTelegramUser("tg1", "Carol");
    store.assignUserToExistingGroup("tg1", "g1");
    AppUser u = store.findUserById("tg1").orElseThrow();
    assertEquals("g1", u.getUserGroup().getId());
    assertEquals(2, store.countUsersByGroupId("g1"));
  }
}
