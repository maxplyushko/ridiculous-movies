package com.ridiculousmovies.backend.web.dto;

public record StartResponse(String status) {

  public static StartResponse ok() {
    return new StartResponse("ok");
  }
}
