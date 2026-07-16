function GameDetailsSkeleton() {
  return (
    <main className="game-page">
      <div className="container">
        <div className="game-layout game-skeleton-page">
          <div className="top-section">
            <div className="game-skeleton game-skeleton-back skeleton-shimmer" />

            <div className="hero-divider game-skeleton skeleton-shimmer" />

            <div className="game-skeleton game-skeleton-breadcrumb skeleton-shimmer" />

            <div className="game-skeleton game-skeleton-title skeleton-shimmer" />
          </div>

          <div className="left-column">
            <div className="game-skeleton game-skeleton-hero skeleton-shimmer" />

            <div className="game-skeleton game-skeleton-section-title skeleton-shimmer" />

            <div className="screenshot-skeleton-grid">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="game-skeleton screenshot-skeleton skeleton-shimmer"
                />
              ))}
            </div>

            <div className="game-skeleton game-skeleton-section-title skeleton-shimmer" />

            <div className="game-skeleton game-skeleton-trailer skeleton-shimmer" />

            <div className="game-skeleton game-skeleton-section-title skeleton-shimmer" />

            <div className="similar-skeleton-grid">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="game-skeleton similar-card skeleton-shimmer"
                />
              ))}
            </div>
          </div>

          <aside className="right-sidebar">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="game-skeleton sidebar-skeleton-card skeleton-shimmer"
              />
            ))}
          </aside>
        </div>
      </div>
    </main>
  );
}

export default GameDetailsSkeleton;
