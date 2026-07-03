package com.ridiculousmovies.backend.web.dto;

public record TmdbCastMemberResponse(
    String name,
    String character,
    String profileUrl
) {}
