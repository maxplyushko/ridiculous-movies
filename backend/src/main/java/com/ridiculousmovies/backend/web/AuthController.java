package com.ridiculousmovies.backend.web;

import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.service.AuthService;
import com.ridiculousmovies.backend.service.JwtService;
import com.ridiculousmovies.backend.service.OAuthVerifier;
import com.ridiculousmovies.backend.service.TelegramAuthService;
import com.ridiculousmovies.backend.store.AppRepository;
import com.ridiculousmovies.backend.web.dto.AuthResponse;
import com.ridiculousmovies.backend.web.dto.OAuthLoginRequest;
import com.ridiculousmovies.backend.web.dto.OAuthLoginResponse;
import com.ridiculousmovies.backend.web.dto.TelegramLoginRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;
  private final OAuthVerifier oAuthVerifier;
  private final JwtService jwtService;
  private final AppRepository dataStore;
  private final TelegramAuthService telegramAuthService;
  private final String defaultGroup;

  public AuthController(AuthService authService, OAuthVerifier oAuthVerifier,
      JwtService jwtService, AppRepository dataStore, TelegramAuthService telegramAuthService,
      @Value("${google.default-group:test_user_group}") String defaultGroup) {
    this.authService = authService;
    this.oAuthVerifier = oAuthVerifier;
    this.jwtService = jwtService;
    this.dataStore = dataStore;
    this.telegramAuthService = telegramAuthService;
    this.defaultGroup = defaultGroup;
  }

  @GetMapping
  public AuthResponse auth(@RequestHeader(value = "User-Id", required = false) String userId) {
    AppUser user = authService.requireUser(userId);
    return AuthResponse.from(user);
  }

  @PostMapping("/telegram")
  public OAuthLoginResponse telegramLogin(@RequestBody TelegramLoginRequest req) {
    String userId = telegramAuthService.verifyAndGetUserId(req.initData());
    AppUser user = dataStore.findUserById(userId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "User not registered"));
    return OAuthLoginResponse.of(jwtService.issue(user.getId()), user);
  }

  @PostMapping("/guest")
  public OAuthLoginResponse guestLogin() {
    AppUser guest = dataStore.findUserById(AuthService.GUEST_USER_ID)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Guest access not available"));
    return OAuthLoginResponse.of(jwtService.issue(guest.getId()), guest);
  }

  @PostMapping("/login")
  public OAuthLoginResponse oauthLogin(@RequestBody OAuthLoginRequest req) {
    OAuthVerifier.UserInfo info = oAuthVerifier.verify(req.idToken());
    AppUser user = dataStore.findUserByOauthSub(info.sub())
        .orElseGet(() -> dataStore.registerUser(info.name(), info.sub(), defaultGroup));
    return OAuthLoginResponse.of(jwtService.issue(user.getId()), user);
  }
}