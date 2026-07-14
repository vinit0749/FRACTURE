function GameDetailsSkeleton() {
  return (
    <main className="game-page">
      <div className="container">
        <div className="game-layout game-skeleton-page">
          {/* TOP SECTION */}

          <div className="top-section">
            <div className="game-skeleton game-skeleton-back"></div>

            <div className="hero-divider game-skeleton"></div>

            <div className="game-skeleton game-skeleton-breadcrumb"></div>

            <div className="game-skeleton game-skeleton-title"></div>
          </div>

          {/* LEFT COLUMN */}

          <div className="left-column">
            <div className="game-skeleton game-skeleton-hero"></div>

            <div className="game-skeleton game-skeleton-section-title"></div>

            <div className="screenshot-skeleton-grid">
              <div className="game-skeleton screenshot-skeleton"></div>
              <div className="game-skeleton screenshot-skeleton"></div>
              <div className="game-skeleton screenshot-skeleton"></div>
              <div className="game-skeleton screenshot-skeleton"></div>
            </div>

            <div className="game-skeleton game-skeleton-section-title"></div>

            <div className="game-skeleton game-skeleton-trailer"></div>

            <div className="game-skeleton game-skeleton-section-title"></div>

            <div className="similar-skeleton-grid">
              <div className="game-skeleton similar-card"></div>
              <div className="game-skeleton similar-card"></div>
              <div className="game-skeleton similar-card"></div>
            </div>
          </div>

          {/* SIDEBAR */}

          <aside className="right-sidebar">
            <div className="game-skeleton sidebar-skeleton-card"></div>

            <div className="game-skeleton sidebar-skeleton-card"></div>

            <div className="game-skeleton sidebar-skeleton-card"></div>

            <div className="game-skeleton sidebar-skeleton-card"></div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default GameDetailsSkeleton;
