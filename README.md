# Ridiculous Movies

A Telegram Mini App for a private movie club. Members add films by round, rate each other's picks, and browse stats — top movies, podiums, and who rates the harshest.

## TODO
- [x] Add search through movie list functionality
- [x] Integrate TMDB API for movie info
- [ ] Add notification `Time to rate the movie` at certain time
- [ ] Add i18n
- [x] Cleanup the FE code
- [x] Fix light bg accents
- [ ] Migrate BE to Kotlin + GraalVM for fast start and cleanup the BE code
- [ ] Add mode for personal movie list (not shared with the club)
- [ ] Migrate storage back to PostgreSQL (`AppRepository` interface is ready — add `PostgresRepository implements AppRepository` and wire via `@ConditionalOnProperty`)