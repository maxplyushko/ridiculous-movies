package com.ridiculousmovies.backend.web.dto;

import java.util.List;

public record MovieGroupsResponse(int currentRound, int lastRound,
                                  List<MovieGroupResponse> groups) {

}
