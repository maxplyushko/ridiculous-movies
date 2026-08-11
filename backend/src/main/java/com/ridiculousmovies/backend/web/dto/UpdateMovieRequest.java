package com.ridiculousmovies.backend.web.dto;

import java.util.List;

public record UpdateMovieRequest(
    String title,
    String description,
    String tagline,
    String ownerId,
    Integer round,
    List<RatingInputDto> ratings,
    Long tmdbId,
    String tmdbMediaType,
    Long version
) {

}
