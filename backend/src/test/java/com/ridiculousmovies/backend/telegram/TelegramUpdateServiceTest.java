package com.ridiculousmovies.backend.telegram;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class TelegramUpdateServiceTest {

  @Test
  void recognizesStartCommand() {
    assertTrue(TelegramUpdateService.isStartCommand("/start"));
    assertTrue(TelegramUpdateService.isStartCommand("/start campaign"));
    assertTrue(TelegramUpdateService.isStartCommand("/start@RidiculousMoviesBot"));
    assertFalse(TelegramUpdateService.isStartCommand("/help"));
    assertFalse(TelegramUpdateService.isStartCommand(null));
  }
}
