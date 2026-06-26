package com.ridiculousmovies.backend.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.ridiculousmovies.backend.telegram.TelegramBotClient;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class GoogleOAuthFlowService {

  private final String clientId;
  private final String clientSecret;
  private final String redirectUri;
  private final String webAppUrl;
  private final Optional<TelegramBotClient> telegramBotClient;
  private final OAuthVerifier oAuthVerifier;
  private final RestClient restClient = RestClient.create();

  private final ConcurrentHashMap<String, Instant> pendingStates = new ConcurrentHashMap<>();
  private final ConcurrentHashMap<String, PendingAuth> pendingTokens = new ConcurrentHashMap<>();

  private record PendingAuth(OAuthVerifier.UserInfo userInfo, Instant expiry) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  private record TokenResponse(@JsonProperty("id_token") String idToken) {}

  public GoogleOAuthFlowService(
      @Value("${google.client-id:}") String clientId,
      @Value("${google.client-secret:}") String clientSecret,
      @Value("${google.redirect-uri:}") String redirectUri,
      @Value("${telegram.bot.web-app-url:}") String webAppUrl,
      Optional<TelegramBotClient> telegramBotClient,
      OAuthVerifier oAuthVerifier) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.webAppUrl = webAppUrl;
    this.telegramBotClient = telegramBotClient;
    this.oAuthVerifier = oAuthVerifier;
  }

  public boolean isConfigured() {
    return !clientId.isBlank() && !clientSecret.isBlank() && !redirectUri.isBlank();
  }

  public String generateAuthUrl() {
    if (!isConfigured()) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Google OAuth not configured");
    }
    String state = UUID.randomUUID().toString();
    pendingStates.put(state, Instant.now().plus(10, ChronoUnit.MINUTES));
    cleanupExpired();
    return UriComponentsBuilder.fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
        .queryParam("client_id", clientId)
        .queryParam("redirect_uri", redirectUri)
        .queryParam("response_type", "code")
        .queryParam("scope", "openid email profile")
        .queryParam("state", state)
        .toUriString();
  }

  public String processCallback(String code, String state) {
    Instant stateExpiry = pendingStates.remove(state);
    if (stateExpiry == null || Instant.now().isAfter(stateExpiry)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired state");
    }

    MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
    form.add("code", code);
    form.add("client_id", clientId);
    form.add("client_secret", clientSecret);
    form.add("redirect_uri", redirectUri);
    form.add("grant_type", "authorization_code");

    TokenResponse tokenResponse = restClient.post()
        .uri("https://oauth2.googleapis.com/token")
        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
        .body(form)
        .retrieve()
        .body(TokenResponse.class);

    if (tokenResponse == null || tokenResponse.idToken() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to obtain ID token from Google");
    }

    OAuthVerifier.UserInfo userInfo = oAuthVerifier.verify(tokenResponse.idToken());

    String token = "gauth_" + UUID.randomUUID().toString().replace("-", "");
    pendingTokens.put(token, new PendingAuth(userInfo, Instant.now().plus(5, ChronoUnit.MINUTES)));
    cleanupExpired();
    return token;
  }

  public OAuthVerifier.UserInfo consumeToken(String token) {
    PendingAuth auth = pendingTokens.remove(token);
    if (auth == null || Instant.now().isAfter(auth.expiry())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired auth token");
    }
    return auth.userInfo();
  }

  public String buildRedirectUrl(String token) {
    String botUsername = telegramBotClient.map(TelegramBotClient::getBotUsername).orElse(null);
    if (botUsername != null && !botUsername.isBlank()) {
      return "https://t.me/" + botUsername + "?startapp=" + token;
    }
    return fallbackUrl();
  }

  public String fallbackUrl() {
    return webAppUrl.isBlank() ? "/" : webAppUrl;
  }

  private void cleanupExpired() {
    Instant now = Instant.now();
    pendingStates.entrySet().removeIf(e -> now.isAfter(e.getValue()));
    pendingTokens.entrySet().removeIf(e -> now.isAfter(e.getValue().expiry()));
  }
}
