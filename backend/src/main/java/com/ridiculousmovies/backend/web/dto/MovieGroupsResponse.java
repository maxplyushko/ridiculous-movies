package com.ridiculousmovies.backend.web.dto;

import java.util.List;

public record MovieGroupsResponse(int currentRound, List<UserRefDto> usersLeft, List<MovieGroupResponse> groups) {
}
