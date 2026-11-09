package com.ridiculousmovies.backend.store;

public record UserHostPreferenceProjection(
    String userId,
    String name,
    Double overallAverage,
    String mostFavoriteHost,
    Double mostFavoriteAverage,
    String leastFavoriteHost,
    Double leastFavoriteAverage
) {}
