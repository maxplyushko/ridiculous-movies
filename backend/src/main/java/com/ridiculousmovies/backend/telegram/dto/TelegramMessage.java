package com.ridiculousmovies.backend.telegram.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TelegramMessage(
    @JsonProperty("message_id") Long messageId,
    TelegramChat chat,
    TelegramFrom from,
    String text
) {
  @JsonIgnoreProperties(ignoreUnknown = true)
  public record TelegramFrom(@JsonProperty("id") Long id) {}
}
