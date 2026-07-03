package com.ridiculousmovies.backend.tmdb;

import java.util.List;

record TmdbCredits(List<TmdbCastMember> cast, List<TmdbCrewMember> crew) {}
