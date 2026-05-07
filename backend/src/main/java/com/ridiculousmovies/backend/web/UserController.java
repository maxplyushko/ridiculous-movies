package com.ridiculousmovies.backend.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ridiculousmovies.backend.service.UserStatsService;
import com.ridiculousmovies.backend.web.dto.UserStatsResponse;

@RestController
@RequestMapping("/api/users")
public class UserController {

	private final UserStatsService userStatsService;

	public UserController(UserStatsService userStatsService) {
		this.userStatsService = userStatsService;
	}

	@GetMapping
	public List<UserStatsResponse> list(@RequestParam(defaultValue = "desc") String sort) {
		return userStatsService.listUsers(sort);
	}
}
