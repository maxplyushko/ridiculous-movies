package com.ridiculousmovies.backend.service;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.TreeMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TelegramAuthService {

  private static final Pattern USER_ID_PATTERN = Pattern.compile("\"id\"\\s*:\\s*(\\d+)");
  private static final Pattern FIRST_NAME_PATTERN = Pattern.compile("\"first_name\"\\s*:\\s*\"([^\"]*)\"");
  private static final Pattern LAST_NAME_PATTERN = Pattern.compile("\"last_name\"\\s*:\\s*\"([^\"]*)\"");
  private static final Pattern USERNAME_PATTERN = Pattern.compile("\"username\"\\s*:\\s*\"([^\"]*)\"");
  private static final long MAX_INIT_DATA_AGE_SECONDS = 86_400;

  public record TelegramUser(String id, String name) {}

  private final byte[] secretKey;

  public TelegramAuthService(@Value("${telegram.bot.token:}") String botToken) {
    if (botToken == null || botToken.isBlank()) {
      this.secretKey = null;
    } else {
      this.secretKey = hmacSha256("WebAppData".getBytes(StandardCharsets.UTF_8),
          botToken.getBytes(StandardCharsets.UTF_8));
    }
  }

  public TelegramUser verifyAndGetUser(String initData) {
    if (secretKey == null) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
          "Telegram auth not configured");
    }
    try {
      TreeMap<String, String> params = new TreeMap<>();
      String hash = null;
      for (String pair : initData.split("&")) {
        int eq = pair.indexOf('=');
        if (eq < 0) continue;
        String key = URLDecoder.decode(pair.substring(0, eq), StandardCharsets.UTF_8);
        String value = URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.UTF_8);
        if ("hash".equals(key)) {
          hash = value;
        } else {
          params.put(key, value);
        }
      }
      if (hash == null) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired token");
      }
      StringBuilder sb = new StringBuilder();
      for (var entry : params.entrySet()) {
        if (!sb.isEmpty()) sb.append('\n');
        sb.append(entry.getKey()).append('=').append(entry.getValue());
      }
      String computed = toHex(hmacSha256(secretKey, sb.toString().getBytes(StandardCharsets.UTF_8)));
      if (!computed.equals(hash)) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired token");
      }
      String authDate = params.get("auth_date");
      if (authDate == null) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired token");
      }
      long authDateSeconds = Long.parseLong(authDate);
      long ageSeconds = Instant.now().getEpochSecond() - authDateSeconds;
      if (ageSeconds > MAX_INIT_DATA_AGE_SECONDS) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired token");
      }
      String userJson = params.get("user");
      if (userJson == null) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired token");
      }
      Matcher m = USER_ID_PATTERN.matcher(userJson);
      if (!m.find()) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired token");
      }
      String userId = m.group(1);
      String name = extractName(userJson);
      return new TelegramUser(userId, name);
    } catch (ResponseStatusException e) {
      throw e;
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired token");
    }
  }

  private static String extractName(String userJson) {
    Matcher first = FIRST_NAME_PATTERN.matcher(userJson);
    String firstName = first.find() ? first.group(1) : null;
    Matcher last = LAST_NAME_PATTERN.matcher(userJson);
    String lastName = last.find() ? last.group(1) : null;
    String fullName = ((firstName == null ? "" : firstName) + " " + (lastName == null ? "" : lastName)).trim();
    if (!fullName.isBlank()) return fullName;
    Matcher username = USERNAME_PATTERN.matcher(userJson);
    return username.find() ? username.group(1) : "Telegram user";
  }

  private static byte[] hmacSha256(byte[] key, byte[] data) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(key, "HmacSHA256"));
      return mac.doFinal(data);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  private static String toHex(byte[] bytes) {
    StringBuilder sb = new StringBuilder(bytes.length * 2);
    for (byte b : bytes) {
      sb.append(String.format("%02x", b));
    }
    return sb.toString();
  }
}