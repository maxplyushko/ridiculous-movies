package com.ridiculousmovies.backend.web.dto;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.ridiculousmovies.backend.web.json.FlexibleIdDeserializer;
import java.math.BigDecimal;

public record RatingInputDto(
    @JsonDeserialize(using = FlexibleIdDeserializer.class) String userId,
    BigDecimal score
) {

}
