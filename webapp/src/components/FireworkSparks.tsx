import type { CSSProperties } from "react";

export function FireworkSparks() {
  return (
    <div className="misc-page__fireworks" aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => (
        <span key={i} className="misc-page__firework-spark" style={{ "--i": i } as CSSProperties} />
      ))}
    </div>
  );
}
