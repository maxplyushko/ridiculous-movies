package com.ridiculousmovies.backend.service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Service;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.OctetSequenceKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.proc.SecurityContext;

@Service
public class JwtService {

  private final NimbusJwtEncoder encoder;
  private final JwtDecoder decoder;
  private final long expirySeconds;

  public JwtService(
      @Value("${jwt.secret:}") String secret,
      @Value("${jwt.expiry-days:30}") int expiryDays
  ) throws Exception {
    SecretKey key = secret.isBlank() ? generateRandomKey() : fromSecret(secret);
    OctetSequenceKey jwk = new OctetSequenceKey.Builder(key)
        .algorithm(com.nimbusds.jose.JWSAlgorithm.HS256)
        .build();
    ImmutableJWKSet<SecurityContext> jwkSet = new ImmutableJWKSet<>(new JWKSet(jwk));
    this.encoder = new NimbusJwtEncoder(jwkSet);
    this.decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
    this.expirySeconds = (long) expiryDays * 86400;
  }

  public String issue(String userId) {
    Instant now = Instant.now();
    JwtClaimsSet claims = JwtClaimsSet.builder()
        .subject(userId)
        .issuedAt(now)
        .expiresAt(now.plusSeconds(expirySeconds))
        .build();
    return encoder.encode(JwtEncoderParameters.from(
        JwsHeader.with(MacAlgorithm.HS256).build(), claims
    )).getTokenValue();
  }

  public java.util.Optional<String> extractUserId(String token) {
    try {
      return java.util.Optional.of(decoder.decode(token).getSubject());
    } catch (JwtException e) {
      return java.util.Optional.empty();
    }
  }

  private static SecretKey fromSecret(String secret) {
    return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
  }

  private static SecretKey generateRandomKey() throws Exception {
    KeyGenerator gen = KeyGenerator.getInstance("HmacSHA256");
    return gen.generateKey();
  }
}
