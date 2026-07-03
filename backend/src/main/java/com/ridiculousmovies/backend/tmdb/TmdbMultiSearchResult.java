package com.ridiculousmovies.backend.tmdb;

import java.util.List;

record TmdbMultiSearchResult(List<TmdbMultiSearchItem> results) {}
