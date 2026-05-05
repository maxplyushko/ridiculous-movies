package com.ridiculousmovies.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.ridiculousmovies.backend.repository.AppUserRepository;
import com.ridiculousmovies.backend.web.dto.UserStatsResponse;

@Service
public class UserStatsService {

	private final AppUserRepository appUserRepository;

	public UserStatsService(AppUserRepository appUserRepository) {
		this.appUserRepository = appUserRepository;
	}

	@Transactional(readOnly = true)
	public List<UserStatsResponse> listUsers(String sort) {
		String s = sort == null || sort.isBlank() ? "desc" : sort.trim().toLowerCase();
		List<Object[]> rows = switch (s) {
			case "desc" -> appUserRepository.findAllUserStatsByAverageDesc();
			case "asc" -> appUserRepository.findAllUserStatsByAverageAsc();
			default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sort must be asc or desc");
		};
		return rows.stream().map(UserStatsService::mapRow).toList();
	}

	private static UserStatsResponse mapRow(Object[] row) {
		Long id = ((Number) row[0]).longValue();
		String name = (String) row[1];
		Double avg = row[2] == null ? null : ((Number) row[2]).doubleValue();
		long count = ((Number) row[3]).longValue();
		return new UserStatsResponse(id, name, avg, count);
	}

}
