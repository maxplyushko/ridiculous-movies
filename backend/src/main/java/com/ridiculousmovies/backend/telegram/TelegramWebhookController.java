package com.ridiculousmovies.backend.telegram;

import com.ridiculousmovies.backend.config.TelegramBotProperties;
import com.ridiculousmovies.backend.telegram.dto.TelegramUpdate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/telegram")
@ConditionalOnProperty(name = "telegram.bot.token")
public class TelegramWebhookController {

  private final TelegramBotProperties properties;
  private final TelegramUpdateService updateService;

  public TelegramWebhookController(
      TelegramBotProperties properties,
      TelegramUpdateService updateService) {
    this.properties = properties;
    this.updateService = updateService;
  }

  @PostMapping("/webhook")
  public ResponseEntity<Void> webhook(
      @RequestHeader(value = "X-Telegram-Bot-Api-Secret-Token", required = false) String secretToken,
      @RequestBody TelegramUpdate update) {
    String expectedSecret = properties.webhookSecret();
    if (expectedSecret != null && !expectedSecret.isBlank()
        && !expectedSecret.equals(secretToken)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    updateService.handle(update);
    return ResponseEntity.ok().build();
  }
}
