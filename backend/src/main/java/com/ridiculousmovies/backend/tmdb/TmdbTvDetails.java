package com.ridiculousmovies.backend.tmdb;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

record TmdbTvDetails(
    long id,
    String name,
    String overview,
    String tagline,
    @JsonProperty("vote_average") double voteAverage,
    @JsonProperty("first_air_date") String firstAirDate,
    @JsonProperty("poster_path") String posterPath,
    @JsonProperty("created_by") List<TmdbCreatedBy> createdBy,
    @JsonProperty("number_of_seasons") Integer numberOfSeasons,
    @JsonProperty("episode_run_time") List<Integer> episodeRunTime,
    List<TmdbGenre> genres,
    TmdbCredits credits
) {}
