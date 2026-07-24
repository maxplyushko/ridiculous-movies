package com.ridiculousmovies.backend.store;

import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.domain.Movie;
import com.ridiculousmovies.backend.domain.PersonalMovie;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AppRepository {

  Optional<AppUser> findUserById(String id);

  long countUsersByGroupId(String groupId);

  List<Object[]> userStatsByGroup(String groupId, boolean ascending);

  List<Movie> findMoviesForGroup(String groupId, boolean ascending);

  List<Movie> findMoviesByIdsAndGroup(Collection<String> ids, String groupId);

  boolean existsByIdAndGroup(String movieId, String groupId);

  int findLatestRoundForGroup(String groupId);

  int findMaxRoundForGroup(String groupId);

  List<String> findIdsWithExtremumAvgForGroup(
      String groupId, int minRatings, boolean requireAll, long memberCount, boolean highest);

  List<Object[]> findTop3ForGroup(String groupId, boolean best);

  List<Object[]> userHostPreferencesByGroup(String groupId);

  Optional<AppUser> findUserByOauthSub(String sub);

  AppUser registerUser(String name, String oauthSub, String groupId);

  AppUser registerTelegramUser(String telegramUserId, String name);

  void assignUserToNewGroup(String userId, String groupName);

  void assignUserToExistingGroup(String userId, String groupId);

  String getOrCreateInviteCode(String groupId);

  String resolveGroupIdByInviteCode(String code);

  void saveUserPreferences(String userId, String theme, String defaultPage, String lang, String tmdbLang,
      Boolean personalListPublic);

  void saveMovie(Movie movie);

  Movie rateMovie(String movieId, String groupId, String raterId, java.math.BigDecimal score);

  void deleteMovieById(String id);

  List<PersonalMovie> findPersonalMoviesForUser(String userId);

  void savePersonalMovie(PersonalMovie movie);

  List<String> findGroupMembersWhoAdded(String callerId, Long tmdbId, String title);

  PersonalMovie findPersonalMovieForCaller(String callerId, Long tmdbId, String title);

  void deletePersonalMovieById(String id, String userId);

  void setGroupChatId(String groupId, Long chatId);

  Long getGroupChatId(String groupId);
}
