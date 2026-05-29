package com.ridiculousmovies.backend.web.dto;

import java.util.List;

public record CreateMovieRequest(
    String title,
    String description,
    String ownerId,
    Integer round,
    List<RatingInputDto> ratings
) {

}
