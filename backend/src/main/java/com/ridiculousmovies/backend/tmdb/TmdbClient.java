package com.ridiculousmovies.backend.tmdb;

import com.ridiculousmovies.backend.web.dto.TmdbCastMemberResponse;
import com.ridiculousmovies.backend.web.dto.TmdbMovieDetailsResponse;
import com.ridiculousmovies.backend.web.dto.TmdbMovieResponse;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class TmdbClient {

    private static final String BASE_URL = "https://api.themoviedb.org/3";
    private static final String IMAGE_BASE = "https://image.tmdb.org/t/p/w200";
    private static final String PROFILE_IMAGE_BASE = "https://image.tmdb.org/t/p/w185";
    private static final Map<String, String> LOCALES = Map.of("ru", "ru-RU", "en", "en-US");
    private static final String DEFAULT_LANG = "ru";
    private static final String MEDIA_TYPE_MOVIE = "movie";
    private static final String MEDIA_TYPE_TV = "tv";
    private static final int MAX_CAST = 5;

    private final RestClient restClient;
    private final ConcurrentHashMap<String, List<TmdbMovieResponse>> cache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Optional<TmdbMovieDetailsResponse>> detailsCache = new ConcurrentHashMap<>();

    public TmdbClient(TmdbProperties props) {
        this.restClient = RestClient.builder()
            .baseUrl(BASE_URL)
            .defaultHeader("Authorization", "Bearer " + props.apiKey())
            .defaultHeader("Accept", "application/json")
            .build();
    }

    public List<TmdbMovieResponse> search(String query, String lang, boolean includeTv) {
        String locale = LOCALES.getOrDefault(lang, LOCALES.get(DEFAULT_LANG));
        return cache.computeIfAbsent(locale + "|" + includeTv + "|" + query,
            key -> includeTv ? fetchMultiFromTmdb(query, locale) : fetchFromTmdb(query, locale));
    }

    public Optional<TmdbMovieDetailsResponse> getDetails(long tmdbId, String lang, String mediaType) {
        String locale = LOCALES.getOrDefault(lang, LOCALES.get(DEFAULT_LANG));
        boolean isTv = MEDIA_TYPE_TV.equals(mediaType);
        return detailsCache.computeIfAbsent(locale + "|" + (isTv ? MEDIA_TYPE_TV : MEDIA_TYPE_MOVIE) + "|" + tmdbId,
            key -> isTv ? fetchTvDetailsFromTmdb(tmdbId, locale) : fetchDetailsFromTmdb(tmdbId, locale));
    }

    private Optional<TmdbMovieDetailsResponse> fetchDetailsFromTmdb(long tmdbId, String locale) {
        try {
            TmdbMovieDetails result = restClient.get()
                .uri("/movie/{id}?append_to_response=credits&language={locale}", tmdbId, locale)
                .retrieve()
                .body(TmdbMovieDetails.class);

            if (result == null) {
                return Optional.empty();
            }

            String director = result.credits() == null || result.credits().crew() == null ? null
                : result.credits().crew().stream()
                    .filter(c -> "Director".equals(c.job()))
                    .map(TmdbCrewMember::name)
                    .findFirst()
                    .orElse(null);

            List<TmdbCastMemberResponse> cast = mapCast(result.credits());

            return Optional.of(new TmdbMovieDetailsResponse(
                result.id(),
                result.title(),
                result.overview(),
                result.tagline() != null && !result.tagline().isBlank() ? result.tagline() : null,
                result.voteAverage(),
                extractYear(result.releaseDate()),
                result.posterPath() != null ? IMAGE_BASE + result.posterPath() : null,
                director,
                cast
            ));
        } catch (RestClientException e) {
            return Optional.empty();
        }
    }

    private Optional<TmdbMovieDetailsResponse> fetchTvDetailsFromTmdb(long tmdbId, String locale) {
        try {
            TmdbTvDetails result = restClient.get()
                .uri("/tv/{id}?append_to_response=credits&language={locale}", tmdbId, locale)
                .retrieve()
                .body(TmdbTvDetails.class);

            if (result == null) {
                return Optional.empty();
            }

            String creator = result.createdBy() == null || result.createdBy().isEmpty() ? null
                : result.createdBy().get(0).name();

            List<TmdbCastMemberResponse> cast = mapCast(result.credits());

            return Optional.of(new TmdbMovieDetailsResponse(
                result.id(),
                result.name(),
                result.overview(),
                result.tagline() != null && !result.tagline().isBlank() ? result.tagline() : null,
                result.voteAverage(),
                extractYear(result.firstAirDate()),
                result.posterPath() != null ? IMAGE_BASE + result.posterPath() : null,
                creator,
                cast
            ));
        } catch (RestClientException e) {
            return Optional.empty();
        }
    }

    private static List<TmdbCastMemberResponse> mapCast(TmdbCredits credits) {
        if (credits == null || credits.cast() == null) {
            return List.of();
        }
        return credits.cast().stream()
            .limit(MAX_CAST)
            .map(c -> new TmdbCastMemberResponse(
                c.name(),
                c.character(),
                c.profilePath() != null ? PROFILE_IMAGE_BASE + c.profilePath() : null
            ))
            .toList();
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
                    m.posterPath() != null ? IMAGE_BASE + m.posterPath() : null,
                    MEDIA_TYPE_MOVIE
                ))
                .toList();
        } catch (RestClientException e) {
            return List.of();
        }
    }

    private List<TmdbMovieResponse> fetchMultiFromTmdb(String query, String locale) {
        try {
            TmdbMultiSearchResult result = restClient.get()
                .uri("/search/multi?query={q}&language={locale}&page=1", query, locale)
                .retrieve()
                .body(TmdbMultiSearchResult.class);

            if (result == null || result.results() == null) {
                return List.of();
            }

            return result.results().stream()
                .filter(m -> MEDIA_TYPE_MOVIE.equals(m.mediaType()) || MEDIA_TYPE_TV.equals(m.mediaType()))
                .limit(10)
                .map(m -> {
                    boolean isTv = MEDIA_TYPE_TV.equals(m.mediaType());
                    return new TmdbMovieResponse(
                        m.id(),
                        isTv ? m.name() : m.title(),
                        m.overview(),
                        m.voteAverage(),
                        extractYear(isTv ? m.firstAirDate() : m.releaseDate()),
                        m.posterPath() != null ? IMAGE_BASE + m.posterPath() : null,
                        m.mediaType()
                    );
                })
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
