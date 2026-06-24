export function StatPageSkeleton() {
  return (
    <section className="stat-page">
      {/* two podiums */}
      {[0, 1].map((p) => (
        <div key={p} className="sk-block">
          <div className="sk-line sk-line--heading" />
          <div className="sk-podium">
            <div className="sk-podium__bar sk-podium__bar--2" />
            <div className="sk-podium__bar sk-podium__bar--1" />
            <div className="sk-podium__bar sk-podium__bar--3" />
          </div>
        </div>
      ))}
      {/* bar chart */}
      <div className="sk-block">
        <div className="sk-line sk-line--heading" />
        <div className="sk-bars">
          {[80, 65, 55, 45, 35].map((w, i) => (
            <div key={i} className="sk-bar-row">
              <div className="sk-line sk-line--bar-label" />
              <div className="sk-bar" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      </div>
      {/* host preference */}
      <div className="sk-block">
        <div className="sk-line sk-line--heading" />
        <div className="sk-bars">
          {[70, 50, 60, 40].map((w, i) => (
            <div key={i} className="sk-bar-row">
              <div className="sk-line sk-line--bar-label" />
              <div className="sk-bar" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
