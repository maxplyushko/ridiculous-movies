package com.ridiculousmovies.backend.web.dto;

import java.util.List;

public record StatsResponse(
    List<MovieHighlightDto> bestMovies,
    List<MovieHighlightDto> worstMovies,
    List<UserStatsResponse> usersByRating
) {

}
