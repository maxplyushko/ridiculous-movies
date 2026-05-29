package com.ridiculousmovies.backend.web.dto;

import java.util.List;

public record StatsResponse(
    MovieHighlightDto bestMovie,
    MovieHighlightDto worstMovie,
    List<UserStatsResponse> usersByRating
) {

}
