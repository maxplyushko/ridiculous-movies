package com.ridiculousmovies.backend.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ridiculousmovies.backend.web.dto.StartResponse;

@RestController
@RequestMapping("/api")
public class StartController {

	@GetMapping("/start")
	public StartResponse start() {
		return StartResponse.ok();
	}
}
