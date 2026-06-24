export function MovieListSkeleton() {
  return (
    <div className="mlp mlp--skeleton">
      <div className="mlp__hero">
        <div className="mlp__cards">
          <div className="sk-card" />
          <div className="sk-card" />
          <div className="sk-card" />
        </div>
      </div>

      <div className="mlp__search-bar">
        <div className="sk-search" />
      </div>

      <div className="movie-list">
        {[0, 1].map((g) => (
          <div key={g} className="movie-group">
            <div className="movie-group__header">
              <div className="sk-line sk-line--label" />
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="sk-movie-row">
                <div className="sk-line sk-line--title" />
                <div className="sk-line sk-line--meta" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
