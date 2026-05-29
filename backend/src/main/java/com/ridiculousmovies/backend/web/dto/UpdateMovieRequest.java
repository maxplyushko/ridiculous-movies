package com.ridiculousmovies.backend.web.dto;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.ridiculousmovies.backend.web.json.FlexibleIdDeserializer;
import java.util.List;

public record UpdateMovieRequest(
    String title,
    String description,
    @JsonDeserialize(using = FlexibleIdDeserializer.class) String ownerId,
    List<RatingInputDto> ratings
) {

}
