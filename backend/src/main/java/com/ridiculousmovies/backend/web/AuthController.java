package com.ridiculousmovies.backend.web;

import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.service.AuthService;
import com.ridiculousmovies.backend.service.JwtService;
import com.ridiculousmovies.backend.service.OAuthVerifier;
import com.ridiculousmovies.backend.store.AppRepository;
import com.ridiculousmovies.backend.web.dto.AuthResponse;
import com.ridiculousmovies.backend.web.dto.OAuthLoginRequest;
import com.ridiculousmovies.backend.web.dto.OAuthLoginResponse;
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

  public AuthController(AuthService authService, OAuthVerifier oAuthVerifier,
      JwtService jwtService, AppRepository dataStore) {
    this.authService = authService;
    this.oAuthVerifier = oAuthVerifier;
    this.jwtService = jwtService;
    this.dataStore = dataStore;
  }

  @GetMapping
  public AuthResponse auth(@RequestHeader(value = "User-Id", required = false) String userId) {
    AppUser user = authService.requireUser(userId);
    return AuthResponse.from(user);
  }

  @PostMapping("/login")
  public OAuthLoginResponse oauthLogin(@RequestBody OAuthLoginRequest req) {
    String sub = oAuthVerifier.verifyAndGetSub(req.idToken());
    AppUser user = dataStore.findUserByOauthSub(sub)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "User not registered"));
    return OAuthLoginResponse.of(jwtService.issue(user.getId()), user);
  }
}
