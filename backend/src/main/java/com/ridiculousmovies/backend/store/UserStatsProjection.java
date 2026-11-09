package com.ridiculousmovies.backend.store;

public record UserStatsProjection(
    String userId,
    String name,
    Double averageRating,
    long ratingCount,
    boolean personalListPublic,
    Double hostAverageRating,
    String role
) {}
