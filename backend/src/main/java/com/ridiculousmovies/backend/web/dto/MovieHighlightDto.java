package com.ridiculousmovies.backend.web.dto;

public record MovieHighlightDto(
    String id,
    String title,
    String host,
    Double averageRating
) {

}
