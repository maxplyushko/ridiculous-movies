package com.ridiculousmovies.backend.telegram;

import com.ridiculousmovies.backend.domain.AppUser;
import com.ridiculousmovies.backend.store.AppRepository;
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
  private final AppRepository dataStore;

  public TelegramUpdateService(TelegramBotClient botClient, AppRepository dataStore) {
    this.botClient = botClient;
    this.dataStore = dataStore;
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
    } else if (isAttachCommand(message.text())) {
      handleAttach(message);
    }
  }

  private void handleAttach(TelegramMessage message) {
    long chatId = message.chat().id();

    if (message.from() == null || message.from().id() == null) {
      botClient.sendMessage(chatId, "Cannot identify caller.");
      return;
    }

    String userId = String.valueOf(message.from().id());
    AppUser caller = dataStore.findUserById(userId).orElse(null);
    if (caller == null || !"admin".equals(caller.getRole().getName())) {
      botClient.sendMessage(chatId, "Only admins can attach a group.");
      return;
    }

    String groupName = parseAttachGroupName(message.text());
    if (groupName == null || groupName.isBlank()) {
      botClient.sendMessage(chatId, "Usage: /attach {group_name}");
      return;
    }

    boolean groupExists = dataStore.findUserById(caller.getId())
        .map(u -> u.getUserGroup().getName().equals(groupName))
        .orElse(false);

    if (!groupExists) {
      botClient.sendMessage(chatId, "Unknown group: " + groupName);
      return;
    }

    dataStore.setGroupChatId(groupName, chatId);
    log.info("Chat {} attached to group '{}'", chatId, groupName);
    botClient.sendMessage(chatId, "Chat attached to group: " + groupName);
  }

  static boolean isStartCommand(String text) {
    if (text == null || text.isBlank()) {
      return false;
    }
    String command = text.trim().split("\\s+", 2)[0];
    return command.equals("/start") || command.startsWith("/start@");
  }

  static boolean isAttachCommand(String text) {
    if (text == null || text.isBlank()) {
      return false;
    }
    String command = text.trim().split("\\s+", 2)[0];
    return command.equals("/attach") || command.startsWith("/attach@");
  }

  static String parseAttachGroupName(String text) {
    if (text == null) return null;
    String[] parts = text.trim().split("\\s+", 2);
    return parts.length > 1 ? parts[1].trim() : null;
  }
}
