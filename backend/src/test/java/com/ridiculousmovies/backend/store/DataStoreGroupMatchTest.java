package com.ridiculousmovies.backend.store;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class DataStoreGroupMatchTest {

  DataStore store;

  private AppData.UserRecord user(String id, String name, String group) {
    return new AppData.UserRecord(id, name, group, "user", null, null, null, null, null, true);
  }

  private AppData.PersonalMovieRecord pm(String id, String userId, String title, Long tmdbId, Instant createdAt) {
    return new AppData.PersonalMovieRecord(id, userId, title, "", "", BigDecimal.ZERO, false, true, createdAt, createdAt,
        tmdbId, "movie");
  }

  @BeforeEach
  void setUp() {
    ObjectMapper mapper = new ObjectMapper();
    store = new DataStore(mapper, mock(StorageClient.class), "", "");
    AppData data = new AppData();
    data.setUsers(List.of(
        user("u1", "Alice", "g1"),
        user("u2", "Bob", "g1"),
        user("u3", "Carol", "g2")
    ));
    data.setPersonalMovies(List.of(
        pm("pm1", "u2", "Heat", 100L, Instant.parse("2026-01-01T00:00:00Z")),
        pm("pm2", "u3", "Heat", 100L, Instant.parse("2026-02-01T00:00:00Z"))
    ));
    store.initialize(mapper.writeValueAsString(data));
  }

  @Test
  void matchesGroupMemberByTmdbId() {
    List<String> result = store.findGroupMembersWhoAdded("u1", 100L, "Heat");
    assertEquals(List.of("Bob"), result);
  }

  @Test
  void matchesByTitleWhenNoTmdbId() {
    List<String> result = store.findGroupMembersWhoAdded("u1", null, "heat");
    assertEquals(List.of("Bob"), result);
  }

  @Test
  void excludesOtherGroups() {
    List<String> result = store.findGroupMembersWhoAdded("u1", 999L, "Nonexistent");
    assertTrue(result.isEmpty());
  }

  @Test
  void excludesCallerSelf() {
    List<String> result = store.findGroupMembersWhoAdded("u2", 100L, "Heat");
    assertTrue(result.isEmpty());
  }

  @Test
  void findsCallerOwnRecordByTmdbId() {
    var pm = store.findPersonalMovieForCaller("u2", 100L, "Heat");
    org.junit.jupiter.api.Assertions.assertNotNull(pm);
    assertEquals("pm1", pm.getId());
  }

  @Test
  void callerOwnRecordAbsentReturnsNull() {
    org.junit.jupiter.api.Assertions.assertNull(store.findPersonalMovieForCaller("u1", 100L, "Heat"));
  }
}
