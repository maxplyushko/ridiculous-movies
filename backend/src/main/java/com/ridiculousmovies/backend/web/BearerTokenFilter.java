package com.ridiculousmovies.backend.web;

import com.ridiculousmovies.backend.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.Optional;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class BearerTokenFilter extends OncePerRequestFilter {

  private final JwtService jwtService;

  public BearerTokenFilter(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    return !request.getRequestURI().startsWith("/api/");
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, @NonNull HttpServletResponse response,
      @NonNull FilterChain chain) throws ServletException, IOException {
    String auth = request.getHeader("Authorization");
    if (auth != null && auth.startsWith("Bearer ")) {
      String token = auth.substring(7);
      Optional<String> userId = jwtService.extractUserId(token);
      if (userId.isEmpty()) {
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired token");
        return;
      }
      chain.doFilter(new UserIdInjectingWrapper(request, userId.get()), response);
      return;
    }
    if (!isPublicPath(request)) {
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired token");
      return;
    }
    chain.doFilter(new UserIdInjectingWrapper(request, null), response);
  }

  private static boolean isPublicPath(HttpServletRequest request) {
    String path = request.getRequestURI();
    return path.startsWith("/api/auth") || path.equals("/api/start")
        || path.startsWith("/api/telegram/webhook");
  }

  private static class UserIdInjectingWrapper extends HttpServletRequestWrapper {

    private final String userId;

    UserIdInjectingWrapper(HttpServletRequest request, String userId) {
      super(request);
      this.userId = userId;
    }

    @Override
    public String getHeader(String name) {
      if ("User-Id".equalsIgnoreCase(name))
        return userId;
      return super.getHeader(name);
    }

    @Override
    public Enumeration<String> getHeaders(String name) {
      if ("User-Id".equalsIgnoreCase(name)) {
        if (userId == null) return Collections.emptyEnumeration();
        return Collections.enumeration(Collections.singleton(userId));
      }
      return super.getHeaders(name);
    }
  }
}