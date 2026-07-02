package com.ridiculousmovies.backend.tmdb;

import com.ridiculousmovies.backend.web.dto.TmdbMovieResponse;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class TmdbClient {

    private static final String BASE_URL = "https://api.themoviedb.org/3";
    private static final String IMAGE_BASE = "https://image.tmdb.org/t/p/w200";
    private static final Map<String, String> LOCALES = Map.of("ru", "ru-RU", "en", "en-US");
    private static final String DEFAULT_LANG = "ru";

    private final RestClient restClient;
    private final ConcurrentHashMap<String, List<TmdbMovieResponse>> cache = new ConcurrentHashMap<>();

    public TmdbClient(TmdbProperties props) {
        this.restClient = RestClient.builder()
            .baseUrl(BASE_URL)
            .defaultHeader("Authorization", "Bearer " + props.apiKey())
            .defaultHeader("Accept", "application/json")
            .build();
    }

    public List<TmdbMovieResponse> search(String query, String lang) {
        String locale = LOCALES.getOrDefault(lang, LOCALES.get(DEFAULT_LANG));
        return cache.computeIfAbsent(locale + "|" + query, key -> fetchFromTmdb(query, locale));
    }

    private List<TmdbMovieResponse> fetchFromTmdb(String query, String locale) {
        try {
            TmdbSearchResult result = restClient.get()
                .uri("/search/movie?query={q}&language={locale}&page=1", query, locale)
                .retrieve()
                .body(TmdbSearchResult.class);

            if (result == null || result.results() == null) {
                return List.of();
            }

            return result.results().stream()
                .limit(10)
                .map(m -> new TmdbMovieResponse(
                    m.id(),
                    m.title(),
                    m.overview(),
                    m.voteAverage(),
                    extractYear(m.releaseDate()),
                    m.posterPath() != null ? IMAGE_BASE + m.posterPath() : null
                ))
                .toList();
        } catch (RestClientException e) {
            return List.of();
        }
    }

    private static String extractYear(String releaseDate) {
        if (releaseDate == null || releaseDate.length() < 4) return "";
        return releaseDate.substring(0, 4);
    }
}
