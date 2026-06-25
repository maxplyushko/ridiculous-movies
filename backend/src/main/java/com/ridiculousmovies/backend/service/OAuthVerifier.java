package com.ridiculousmovies.backend.service;

public interface OAuthVerifier {
  String verifyAndGetSub(String idToken);
}
