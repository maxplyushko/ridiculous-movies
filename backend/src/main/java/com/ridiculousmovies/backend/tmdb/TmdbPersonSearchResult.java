package com.ridiculousmovies.backend.tmdb;

import java.util.List;

record TmdbPersonSearchResult(List<TmdbPersonSearchItem> results) {}
