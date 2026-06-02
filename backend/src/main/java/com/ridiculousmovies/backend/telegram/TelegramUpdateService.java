package com.ridiculousmovies.backend.telegram;

import com.ridiculousmovies.backend.telegram.dto.TelegramMessage;
import com.ridiculousmovies.backend.telegram.dto.TelegramUpdate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "telegram.bot.token")
public class TelegramUpdateService {

  private static final Logger log = LoggerFactory.getLogger(TelegramUpdateService.class);

  private final TelegramBotClient botClient;

  public TelegramUpdateService(TelegramBotClient botClient) {
    this.botClient = botClient;
  }

  public void handle(TelegramUpdate update) {
    if (update == null || update.message() == null) {
      return;
    }

    TelegramMessage message = update.message();
    if (message.chat() == null || message.chat().id() == null) {
      return;
    }

    if (isStartCommand(message.text())) {
      log.info("Handling /start for chat {} ({})", message.chat().id(), message.chat().type());
      botClient.sendStartMessage(message.chat().id(), message.chat().type());
    }
  }

  static boolean isStartCommand(String text) {
    if (text == null || text.isBlank()) {
      return false;
    }
    String command = text.trim().split("\\s+", 2)[0];
    return command.equals("/start") || command.startsWith("/start@");
  }
}
