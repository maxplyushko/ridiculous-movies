package com.ridiculousmovies.backend.service;

public interface OAuthVerifier {
  record UserInfo(String sub, String name) {}
  UserInfo verify(String idToken);
}