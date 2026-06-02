package com.ridiculousmovies.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "telegram.bot")
public record TelegramBotProperties(
    String token,
    String webhookSecret,
    String webhookUrl,
    String webAppUrl,
    @DefaultValue("Welcome to Ridiculous Movies!")
    String startMessage,
    @DefaultValue("Start") String startButtonText,
    @DefaultValue("Open app") String menuButtonText,
    String startPhotoUrl
) {

  public boolean isConfigured() {
    return token != null && !token.isBlank();
  }

  public boolean hasWebAppUrl() {
    return webAppUrl == null || webAppUrl.isBlank();
  }

  public boolean hasStartPhotoUrl() {
    String url = resolveStartPhotoUrl();
    return url != null && !url.isBlank();
  }

  public String resolveStartPhotoUrl() {
    if (startPhotoUrl != null && !startPhotoUrl.isBlank()) {
      return startPhotoUrl.trim();
    }
    if (hasWebAppUrl()) {
      return null;
    }
    String base = webAppUrl.trim();
    if (base.endsWith("/")) {
      base = base.substring(0, base.length() - 1);
    }
    return base + "/start-banner.png";
  }
}
