package com.ridiculousmovies.backend.web.dto;

import java.util.List;

public record UpdateMovieRequest(
    String title,
    String description,
    String ownerId,
    List<RatingInputDto> ratings
) {

}
