package com.ridiculousmovies.backend.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GoogleOAuthVerifier implements OAuthVerifier {

  private static final String GOOGLE_JWKS_URI = "https://www.googleapis.com/oauth2/v3/certs";

  private final JwtDecoder googleDecoder;
  private final String clientId;

  public GoogleOAuthVerifier(@Value("${google.client-id:}") String clientId) {
    this.clientId = clientId;
    this.googleDecoder = NimbusJwtDecoder.withJwkSetUri(GOOGLE_JWKS_URI).build();
  }

  @Override
  public UserInfo verify(String idToken) {
    if (clientId == null || clientId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "OAuth not configured");
    }
    try {
      var jwt = googleDecoder.decode(idToken);
      List<String> audience = jwt.getAudience();
      if (audience == null || !audience.contains(clientId)) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token audience mismatch");
      }
      String name = jwt.getClaimAsString("name");
      if (name == null) name = jwt.getClaimAsString("email");
      if (name == null) name = jwt.getSubject();
      return new UserInfo(jwt.getSubject(), name);
    } catch (ResponseStatusException e) {
      throw e;
    } catch (JwtException e) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid ID token");
    }
  }
}