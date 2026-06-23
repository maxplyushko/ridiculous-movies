package com.ridiculousmovies.backend.web.dto;

public record UserHostPreferenceResponse(
    String userId,
    String userName,
    Double overallAverage,
    String mostFavHostName,
    Double mostFavHostAvg,
    String leastFavHostName,
    Double leastFavHostAvg
) {}
