package com.ridiculousmovies.backend.web;

import com.ridiculousmovies.backend.service.GroupService;
import com.ridiculousmovies.backend.web.dto.CreateGroupRequest;
import com.ridiculousmovies.backend.web.dto.GroupResponse;
import com.ridiculousmovies.backend.web.dto.InviteLinkResponse;
import com.ridiculousmovies.backend.web.dto.JoinGroupRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/groups")
public class GroupController {

  private final GroupService groupService;

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public GroupResponse create(@RequestHeader("User-Id") String userId, @RequestBody CreateGroupRequest req) {
    return groupService.createGroup(userId, req.name());
  }

  @PostMapping("/join")
  public GroupResponse join(@RequestHeader("User-Id") String userId, @RequestBody JoinGroupRequest req) {
    return groupService.joinGroup(userId, req.code());
  }

  @GetMapping("/me/invite")
  public InviteLinkResponse myInvite(@RequestHeader("User-Id") String userId) {
    return groupService.getMyInviteLink(userId);
  }
}
