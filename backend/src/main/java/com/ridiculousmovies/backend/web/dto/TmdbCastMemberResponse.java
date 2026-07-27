package com.ridiculousmovies.backend.web.dto;

public record TmdbCastMemberResponse(
    long id,
    String name,
    String character,
    String profileUrl
) {}
