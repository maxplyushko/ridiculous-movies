package com.ridiculousmovies.backend.web.dto;

import java.util.List;

public record TmdbPersonResponse(
    long id,
    String name,
    String profileUrl,
    List<String> knownFor
) {}
