import { useState } from "react";
import { Link } from "react-router-dom";

import Header from "../components/Layout/Header";

import GameCard from "../components/Explore/GameCard";

import { getLibrary, saveLibrary } from "../utils/storage";

import "../styles/library.css";

function LibraryPage() {
  const [library, setLibrary] = useState(getLibrary());

  const [searchInput, setSearchInput] = useState("");
  const [showClearModal, setShowClearModal] = useState(false);

  function updateSearchInput(value) {
    setSearchInput(value);
  }

  function clearLibrary() {
    saveLibrary([]);
    setLibrary([]);
  }

  /* ===============================
      STATS
  =============================== */

  const averageRating =
    library.length > 0
      ? (
          library.reduce((sum, game) => sum + (game.rating || 0), 0) /
          library.length
        ).toFixed(1)
      : "0.0";

  const genreCount = {};

  library.forEach((game) => {
    game.genres?.forEach((genre) => {
      genreCount[genre.name] = (genreCount[genre.name] || 0) + 1;
    });
  });

  const topGenre =
    Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";

  const platforms = new Set();

  library.forEach((game) => {
    game.parent_platforms?.forEach((platform) => {
      platforms.add(platform.platform.name);
    });
  });

  return (
    <>
      <Header searchInput={searchInput} updateSearchInput={updateSearchInput} />

      <main className="library-page">
        <div className="container">
          {/* ================= HEADER ================= */}

          <section className="library-header">
            <div className="library-heading">
              <h1>My Library</h1>
            </div>

            <div className="library-info">
              <span id="library-count">
                {library.length === 1
                  ? "Game Saved : 1"
                  : `Games Saved : ${library.length}`}
              </span>

              <button
                className="secondary-btn"
                onClick={() => setShowClearModal(true)}
              >
                Clear Library
              </button>
            </div>
          </section>

          <div className="library-divider" />

          {/* ================= STATS ================= */}

          {library.length > 0 && (
            <section className="library-stats">
              <div className="stat-card">
                <div className="stat-label">Games Saved</div>
                <div className="stat-value">{library.length}</div>
                <div className="stat-sub">In your collection</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Average Rating</div>
                <div className="stat-value">⭐ {averageRating}</div>
                <div className="stat-sub">Community rating</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Top Genre</div>
                <div className="stat-value">{topGenre}</div>
                <div className="stat-sub">Most saved genre</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Platforms</div>
                <div className="stat-value">{platforms.size}</div>
                <div className="stat-sub">Unique platforms</div>
              </div>
            </section>
          )}

          {/* ================= GRID ================= */}

          {library.length > 0 ? (
            <div id="library-grid" className="game-grid">
              {library.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onLibraryChange={() => setLibrary(getLibrary())}
                />
              ))}
            </div>
          ) : (
            <div className="library-empty">
              <div className="empty-icon">📚</div>

              <h2>Your Library is Empty</h2>

              <p>
                Build your personal game collection and keep track of titles you
                own or plan to play.
              </p>

              <Link to="/" className="hero-btn">
                Explore Games
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* ================= CLEAR MODAL ================= */}

      {showClearModal && (
        <div className="modal-overlay" onClick={() => setShowClearModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">📚</div>

            <h2>Clear Library?</h2>

            <p>
              This will remove every game from your library. This action cannot
              be undone.
            </p>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setShowClearModal(false)}
              >
                Cancel
              </button>

              <button
                className="danger-btn"
                onClick={() => {
                  clearLibrary();
                  setShowClearModal(false);
                }}
              >
                Clear Library
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LibraryPage;
