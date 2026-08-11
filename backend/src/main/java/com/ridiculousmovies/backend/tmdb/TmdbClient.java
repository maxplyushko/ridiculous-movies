package com.ridiculousmovies.backend.tmdb;

import com.ridiculousmovies.backend.web.dto.TmdbActorResponse;
import com.ridiculousmovies.backend.web.dto.TmdbCastMemberResponse;
import com.ridiculousmovies.backend.web.dto.TmdbMovieDetailsResponse;
import com.ridiculousmovies.backend.web.dto.TmdbMovieResponse;
import com.ridiculousmovies.backend.web.dto.TmdbPersonResponse;
import java.time.Duration;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.net.http.HttpClient;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Component
public class TmdbClient {

    private static final String BASE_URL = "https://api.themoviedb.org/3";
    private static final String TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
    private static final String IMAGE_BASE = "/api/tmdb/image/w200";
    private static final String PROFILE_IMAGE_BASE = "/api/tmdb/image/w185";
    private static final String PERSON_IMAGE_BASE = "/api/tmdb/image/h632";
    private static final Set<String> ALLOWED_IMAGE_SIZES = Set.of("w200", "w185", "h632");
    private static final Map<String, String> LOCALES = Map.of("ru", "ru-RU", "en", "en-US");
    private static final String DEFAULT_LANG = "ru";
    private static final String MEDIA_TYPE_MOVIE = "movie";
    private static final String MEDIA_TYPE_TV = "tv";
    private static final int MAX_CAST = 5;
    private static final int MAX_KNOWN_FOR = 10;
    private static final int MAX_PERSON_KNOWN_FOR = 3;
    private static final int MAX_RESULTS = 10;
    private static final int IMAGE_CACHE_MAX_ENTRIES = 200;

    private final RestClient restClient;
    private final RestClient imageClient;
    private final ConcurrentHashMap<String, List<TmdbMovieResponse>> cache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Optional<TmdbMovieDetailsResponse>> detailsCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, List<TmdbPersonResponse>> personSearchCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Optional<TmdbActorResponse>> actorCache = new ConcurrentHashMap<>();
    private final Map<String, CachedImage> imageCache = new LinkedHashMap<>(16, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, CachedImage> eldest) {
            return size() > IMAGE_CACHE_MAX_ENTRIES;
        }
    };

    private record CachedImage(byte[] body, MediaType contentType) {}

    public TmdbClient(TmdbProperties props) {
        HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(8));
        this.restClient = RestClient.builder()
            .requestFactory(requestFactory)
            .baseUrl(BASE_URL)
            .defaultHeader("Authorization", "Bearer " + props.apiKey())
            .defaultHeader("Accept", "application/json")
            .build();
        this.imageClient = RestClient.builder()
            .requestFactory(requestFactory)
            .baseUrl(TMDB_IMAGE_BASE)
            .build();
    }

    public ResponseEntity<byte[]> fetchImage(String size, String filename) {
        if (!ALLOWED_IMAGE_SIZES.contains(size)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid image size");
        }
        String key = size + "|" + filename;
        CachedImage cached;
        synchronized (imageCache) {
            cached = imageCache.get(key);
        }
        if (cached == null) {
            cached = fetchImageFromTmdb(size, filename);
            synchronized (imageCache) {
                imageCache.put(key, cached);
            }
        }
        return ResponseEntity.ok()
            .contentType(cached.contentType())
            .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
            .body(cached.body());
    }

    private CachedImage fetchImageFromTmdb(String size, String filename) {
        try {
            ResponseEntity<byte[]> upstream = imageClient.get()
                .uri("/{size}/{filename}", size, filename)
                .retrieve()
                .toEntity(byte[].class);
            MediaType contentType = upstream.getHeaders().getContentType() != null
                ? upstream.getHeaders().getContentType() : MediaType.IMAGE_JPEG;
            return new CachedImage(upstream.getBody(), contentType);
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found");
        }
    }

    public List<TmdbMovieResponse> search(String query, String lang, boolean includeTv) {
        String locale = LOCALES.getOrDefault(lang, LOCALES.get(DEFAULT_LANG));
        String key = locale + "|" + includeTv + "|" + query;
        List<TmdbMovieResponse> cached = cache.get(key);
        if (cached != null) {
            return cached;
        }
        try {
            List<TmdbMovieResponse> result = includeTv
                ? fetchMultiFromTmdb(query, locale) : fetchFromTmdb(query, locale);
            cache.put(key, result);
            return result;
        } catch (RestClientException e) {
            return List.of();
        }
    }

    public Optional<TmdbMovieDetailsResponse> getDetails(long tmdbId, String lang, String mediaType) {
        String locale = LOCALES.getOrDefault(lang, LOCALES.get(DEFAULT_LANG));
        boolean isTv = MEDIA_TYPE_TV.equals(mediaType);
        String key = locale + "|" + (isTv ? MEDIA_TYPE_TV : MEDIA_TYPE_MOVIE) + "|" + tmdbId;
        Optional<TmdbMovieDetailsResponse> cached = detailsCache.get(key);
        if (cached != null) {
            return cached;
        }
        try {
            Optional<TmdbMovieDetailsResponse> result = isTv
                ? fetchTvDetailsFromTmdb(tmdbId, locale) : fetchDetailsFromTmdb(tmdbId, locale);
            detailsCache.put(key, result);
            return result;
        } catch (RestClientException e) {
            return Optional.empty();
        }
    }

    private Optional<TmdbMovieDetailsResponse> fetchDetailsFromTmdb(long tmdbId, String locale) {
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
                null,
                result.runtime(),
                mapGenres(result.genres()),
                cast
            ));
    }

    private Optional<TmdbMovieDetailsResponse> fetchTvDetailsFromTmdb(long tmdbId, String locale) {
            TmdbTvDetails result = restClient.get()
                .uri("/tv/{id}?append_to_response=credits&language={locale}", tmdbId, locale)
                .retrieve()
                .body(TmdbTvDetails.class);

            if (result == null) {
                return Optional.empty();
            }

            String creator = result.createdBy() == null || result.createdBy().isEmpty() ? null
                : result.createdBy().getFirst().name();

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
                result.numberOfSeasons(),
                averageEpisodeRuntime(result.episodeRunTime()),
                mapGenres(result.genres()),
                cast
            ));
    }

    private static Integer averageEpisodeRuntime(List<Integer> episodeRunTime) {
        if (episodeRunTime == null || episodeRunTime.isEmpty()) {
            return null;
        }
        return (int) Math.round(episodeRunTime.stream().mapToInt(Integer::intValue).average().orElse(0));
    }

    private static List<String> mapGenres(List<TmdbGenre> genres) {
        if (genres == null) {
            return List.of();
        }
        return genres.stream().map(TmdbGenre::name).toList();
    }

    private static List<TmdbCastMemberResponse> mapCast(TmdbCredits credits) {
        if (credits == null || credits.cast() == null) {
            return List.of();
        }
        return credits.cast().stream()
            .limit(MAX_CAST)
            .map(c -> new TmdbCastMemberResponse(
                c.id(),
                c.name(),
                c.character(),
                c.profilePath() != null ? PROFILE_IMAGE_BASE + c.profilePath() : null
            ))
            .toList();
    }

    public List<TmdbPersonResponse> searchPeople(String query, String lang) {
        String locale = LOCALES.getOrDefault(lang, LOCALES.get(DEFAULT_LANG));
        String key = locale + "|" + query;
        List<TmdbPersonResponse> cached = personSearchCache.get(key);
        if (cached != null) {
            return cached;
        }
        try {
            List<TmdbPersonResponse> result = fetchPeopleFromTmdb(query, locale);
            personSearchCache.put(key, result);
            return result;
        } catch (RestClientException e) {
            return List.of();
        }
    }

    private List<TmdbPersonResponse> fetchPeopleFromTmdb(String query, String locale) {
            TmdbPersonSearchResult result = restClient.get()
                .uri("/search/person?query={q}&language={locale}&page=1", query, locale)
                .retrieve()
                .body(TmdbPersonSearchResult.class);

            if (result == null || result.results() == null) {
                return List.of();
            }

            return result.results().stream()
                .limit(MAX_RESULTS)
                .map(p -> new TmdbPersonResponse(
                    p.id(),
                    p.name(),
                    p.profilePath() != null ? PROFILE_IMAGE_BASE + p.profilePath() : null,
                    knownForTitles(p.knownFor())
                ))
                .toList();
    }

    private static List<String> knownForTitles(List<TmdbMultiSearchItem> knownFor) {
        if (knownFor == null) {
            return List.of();
        }
        return knownFor.stream()
            .map(k -> MEDIA_TYPE_TV.equals(k.mediaType()) ? k.name() : k.title())
            .filter(title -> title != null && !title.isBlank())
            .limit(MAX_PERSON_KNOWN_FOR)
            .toList();
    }

    public Optional<TmdbActorResponse> getActor(long personId, String lang) {
        String locale = LOCALES.getOrDefault(lang, LOCALES.get(DEFAULT_LANG));
        String key = locale + "|" + personId;
        Optional<TmdbActorResponse> cached = actorCache.get(key);
        if (cached != null) {
            return cached;
        }
        try {
            Optional<TmdbActorResponse> result = fetchActorFromTmdb(personId, locale);
            actorCache.put(key, result);
            return result;
        } catch (RestClientException e) {
            return Optional.empty();
        }
    }

    private Optional<TmdbActorResponse> fetchActorFromTmdb(long personId, String locale) {
            TmdbPerson result = restClient.get()
                .uri("/person/{id}?append_to_response=movie_credits&language={locale}", personId, locale)
                .retrieve()
                .body(TmdbPerson.class);

            if (result == null) {
                return Optional.empty();
            }

            List<TmdbMovieResponse> knownFor = result.movieCredits() == null || result.movieCredits().cast() == null
                ? List.of()
                : result.movieCredits().cast().stream()
                    .sorted(Comparator.comparingDouble(TmdbMovie::voteAverage).reversed())
                    .limit(MAX_KNOWN_FOR)
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

            return Optional.of(new TmdbActorResponse(
                result.id(),
                result.name(),
                result.biography() != null && !result.biography().isBlank() ? result.biography() : null,
                result.birthday(),
                result.placeOfBirth(),
                result.profilePath() != null ? PERSON_IMAGE_BASE + result.profilePath() : null,
                knownFor
            ));
    }

    private List<TmdbMovieResponse> fetchFromTmdb(String query, String locale) {
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
    }

    private List<TmdbMovieResponse> fetchMultiFromTmdb(String query, String locale) {
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
                        m.voteAverage() != null ? m.voteAverage() : 0.0,
                        extractYear(isTv ? m.firstAirDate() : m.releaseDate()),
                        m.posterPath() != null ? IMAGE_BASE + m.posterPath() : null,
                        m.mediaType()
                    );
                })
                .toList();
    }

    private static String extractYear(String releaseDate) {
        if (releaseDate == null || releaseDate.length() < 4) return "";
        return releaseDate.substring(0, 4);
    }
}
