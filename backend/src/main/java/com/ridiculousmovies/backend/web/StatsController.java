package com.ridiculousmovies.backend.web;

import com.ridiculousmovies.backend.service.StatsService;
import com.ridiculousmovies.backend.web.dto.StatsResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

  private final StatsService statsService;

  public StatsController(StatsService statsService) {
    this.statsService = statsService;
  }

  @GetMapping
  public StatsResponse get(
      @RequestHeader("User-Id") String userId,
      @RequestParam(defaultValue = "desc") String sort
  ) {
    return statsService.getStats(userId, sort);
  }

}
