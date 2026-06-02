package com.ridiculousmovies.backend.telegram;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.ridiculousmovies.backend.config.TelegramBotProperties;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
@ConditionalOnProperty(name = "telegram.bot.token")
public class TelegramBotClient {

  private static final Logger log = LoggerFactory.getLogger(TelegramBotClient.class);

  private final TelegramBotProperties properties;
  private final RestClient restClient;
  private volatile String botUsername;

  public TelegramBotClient(TelegramBotProperties properties) {
    this.properties = properties;
    this.restClient = RestClient.builder()
        .baseUrl("https://api.telegram.org/bot" + properties.token())
        .build();
  }

  public void loadBotUsername() {
    try {
      GetMeResponse response = restClient.get()
          .uri("/getMe")
          .retrieve()
          .body(GetMeResponse.class);
      if (response != null && response.result() != null && response.result().username() != null) {
        botUsername = response.result().username();
        log.info("Telegram bot username loaded: @{}", botUsername);
      }
    } catch (Exception ex) {
      log.warn("Failed to load Telegram bot username: {}", ex.getMessage());
    }
  }

  public void sendStartMessage(long chatId, String chatType) {
    if (properties.hasWebAppUrl()) {
      log.warn("telegram.bot.web-app-url is not set; skipping /start reply");
      return;
    }

    Map<String, Object> replyMarkup = Map.of(
        "inline_keyboard",
        List.of(List.of(startButton(isPrivateChat(chatType, chatId)))));

    if (properties.hasStartPhotoUrl()) {
      Map<String, Object> body = new LinkedHashMap<>();
      body.put("chat_id", chatId);
      body.put("photo", properties.resolveStartPhotoUrl());
      body.put("caption", properties.startMessage());
      body.put("reply_markup", replyMarkup);
      post("sendPhoto", body);
      return;
    }

    Map<String, Object> body = new LinkedHashMap<>();
    body.put("chat_id", chatId);
    body.put("text", properties.startMessage());
    body.put("reply_markup", replyMarkup);
    post("sendMessage", body);
  }

  /**
   * web_app buttons only work in private chats. Groups need a URL button instead.
   */
  private Map<String, Object> startButton(boolean privateChat) {
    Map<String, Object> button = new LinkedHashMap<>();
    button.put("text", properties.startButtonText());
    if (privateChat) {
      button.put("web_app", Map.of("url", properties.webAppUrl()));
    } else {
      button.put("url", resolveGroupStartUrl());
    }
    return button;
  }

  private String resolveGroupStartUrl() {
    if (botUsername != null && !botUsername.isBlank()) {
      return "https://t.me/" + botUsername + "?startapp";
    }
    return properties.webAppUrl();
  }

  private static boolean isPrivateChat(String chatType, long chatId) {
    if ("private".equals(chatType)) {
      return true;
    }
    if (chatType == null || chatType.isBlank()) {
      return chatId > 0;
    }
    return false;
  }

  public void setWebhook(String webhookUrl, String secretToken) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("url", webhookUrl);
    if (secretToken != null && !secretToken.isBlank()) {
      body.put("secret_token", secretToken);
    }
    body.put("allowed_updates", List.of("message"));
    post("setWebhook", body);
  }

  public void setChatMenuButton() {
    if (properties.hasWebAppUrl()) {
      log.warn("telegram.bot.web-app-url is not set; skipping menu button setup");
      return;
    }

    Map<String, Object> menuButton = new LinkedHashMap<>();
    menuButton.put("type", "web_app");
    menuButton.put("text", properties.menuButtonText());
    menuButton.put("web_app", Map.of("url", properties.webAppUrl()));

    post("setChatMenuButton", Map.of("menu_button", menuButton));
  }

  private void post(String method, Object body) {
    try {
      restClient.post()
          .uri("/" + method)
          .contentType(MediaType.APPLICATION_JSON)
          .body(body)
          .retrieve()
          .toBodilessEntity();
      log.info("Telegram API call succeeded: {}", method);
    } catch (RestClientResponseException ex) {
      log.warn(
          "Telegram API {} failed with status {}: {}",
          method,
          ex.getStatusCode(),
          ex.getResponseBodyAsString());
    } catch (Exception ex) {
      log.warn("Telegram API {} failed: {}", method, ex.getMessage());
    }
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  private record GetMeResponse(boolean ok, BotUser result) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  private record BotUser(
      @JsonProperty("id") Long id,
      String username
  ) {}
}
