package com.ridiculousmovies.backend.telegram;

import com.ridiculousmovies.backend.config.TelegramBotProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "telegram.bot.token")
public class TelegramBotInitializer implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(TelegramBotInitializer.class);

  private final TelegramBotProperties properties;
  private final TelegramBotClient botClient;

  public TelegramBotInitializer(TelegramBotProperties properties, TelegramBotClient botClient) {
    this.properties = properties;
    this.botClient = botClient;
  }

  @Override
  public void run(ApplicationArguments args) {
    botClient.loadBotUsername();

    String webhookUrl = properties.webhookUrl();
    if (webhookUrl != null && !webhookUrl.isBlank()) {
      botClient.setWebhook(webhookUrl, properties.webhookSecret());
    } else {
      log.info("telegram.bot.webhook-url is not set; webhook registration skipped");
    }

    botClient.setChatMenuButton();
  }
}
