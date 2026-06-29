# Ridiculous Movies

A Telegram Mini App for a private movie club. Members add films by round, rate each other's picks, and browse stats — top movies, podiums, and who rates the harshest.

## TODO
- [x] Enhance rating system to allow for 3 focus points instead of just 1
- [ ] Figure out how to handle user groups for newly added users (currently they are not assigned to any group)
- [x] Add search through movie list functionality
- [x] Integrate TMDB API for movie info
- [x] Add i18n
- [x] Cleanup the FE code
- [x] Fix light bg accents
- [x] Add mode for personal movie list (not shared with the club)
- [x] Introduce user page. Hide current settings innit.
- [ ] Add notification `Time to rate the movie` at certain time
- [ ] Migrate BE to Kotlin + GraalVM for fast start and cleanup the BE code
- [ ] Add possibility to see other user's personal movie lists (if they allow it). Add notification when I've added movie from some user's personal list.
- [ ] Migrate storage back to PostgreSQL (`AppRepository` interface is ready — add `PostgresRepository implements AppRepository` and wire via `@ConditionalOnProperty`)