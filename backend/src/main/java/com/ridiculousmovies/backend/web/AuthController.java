package com.ridiculousmovies.backend.web;

import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.service.AuthService;
import com.ridiculousmovies.backend.web.dto.AuthResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @GetMapping
  public AuthResponse auth(@RequestHeader(value = "User-Id", required = false) String userId) {
    AppUser user = authService.requireUser(userId);
    return AuthResponse.from(user);
  }
}
