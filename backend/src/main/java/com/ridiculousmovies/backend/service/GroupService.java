package com.ridiculousmovies.backend.service;

import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.store.AppRepository;
import com.ridiculousmovies.backend.web.dto.GroupResponse;
import com.ridiculousmovies.backend.web.dto.InviteLinkResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GroupService {

  private final AppRepository dataStore;
  private final AuthService authService;

  public GroupService(AppRepository dataStore, AuthService authService) {
    this.dataStore = dataStore;
    this.authService = authService;
  }

  public GroupResponse createGroup(String userId, String name) {
    AppUser user = authService.requireUser(userId);
    if (user.getUserGroup() != null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Already in a group");
    }
    if (name == null || name.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Group name is required");
    }
    String groupId = name.trim();
    if (dataStore.countUsersByGroupId(groupId) > 0) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Group name already taken");
    }
    dataStore.assignUserToNewGroup(userId, groupId);
    String inviteCode = dataStore.getOrCreateInviteCode(groupId);
    return new GroupResponse(groupId, groupId, inviteCode);
  }

  public GroupResponse joinGroup(String userId, String code) {
    AppUser user = authService.requireUser(userId);
    if (user.getUserGroup() != null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Already in a group");
    }
    String groupId = dataStore.resolveGroupIdByInviteCode(code);
    if (groupId == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid invite code");
    }
    dataStore.assignUserToExistingGroup(userId, groupId);
    AppUser updated = authService.requireUser(userId);
    return new GroupResponse(updated.getUserGroup().getId(), updated.getUserGroup().getName(), null);
  }

  public InviteLinkResponse getMyInviteLink(String userId) {
    AppUser user = authService.requireUser(userId);
    if (user.getUserGroup() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not in a group");
    }
    return new InviteLinkResponse(dataStore.getOrCreateInviteCode(user.getUserGroup().getId()));
  }
}
