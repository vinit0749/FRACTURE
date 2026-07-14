import { useState } from "react";
import { Link } from "react-router-dom";

import Header from "../components/Layout/Header";
import GameCard from "../components/Explore/GameCard";

import { getWishlist, saveWishlist } from "../utils/storage";

import "../styles/wishlist.css";

function WishlistPage() {
  const [wishlist, setWishlist] = useState(getWishlist());

  const [searchInput, setSearchInput] = useState("");
  const [showClearModal, setShowClearModal] = useState(false);

  function updateSearchInput(value) {
    setSearchInput(value);
  }

  function performSearch() {
    // We'll connect this later.
  }

  function clearWishlist() {
    saveWishlist([]);
    setWishlist([]);
  }

  /* ===============================
      STATS
  =============================== */

  const averageRating =
    wishlist.length > 0
      ? (
          wishlist.reduce((sum, game) => sum + (game.rating || 0), 0) /
          wishlist.length
        ).toFixed(1)
      : "0.0";

  const genreCount = {};

  wishlist.forEach((game) => {
    game.genres?.forEach((genre) => {
      genreCount[genre.name] = (genreCount[genre.name] || 0) + 1;
    });
  });

  const topGenre =
    Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";

  const platforms = new Set();

  wishlist.forEach((game) => {
    game.parent_platforms?.forEach((platform) => {
      platforms.add(platform.platform.name);
    });
  });

  return (
    <>
      <Header
        searchInput={searchInput}
        updateSearchInput={updateSearchInput}
        performSearch={performSearch}
      />

      <main className="wishlist-page">
        <div className="container">
          {/* ================= HEADER ================= */}

          <section className="wishlist-header">
            <div className="wishlist-heading">
              <h1>My Wishlist</h1>
            </div>

            <div className="wishlist-info">
              <span id="wishlist-count">
                {wishlist.length === 1
                  ? "Game Saved : 1"
                  : `Games Saved : ${wishlist.length}`}
              </span>

              <button
                className="secondary-btn"
                onClick={() => setShowClearModal(true)}
              >
                Clear Wishlist
              </button>
            </div>
          </section>

          <div className="wishlist-divider" />

          {/* ================= STATS ================= */}

          {wishlist.length > 0 && (
            <section className="wishlist-stats">
              <div className="stat-card">
                <div className="stat-label">Games Saved</div>
                <div className="stat-value">{wishlist.length}</div>
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

          {wishlist.length > 0 ? (
            <div id="wishlist-grid" className="game-grid">
              {wishlist.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onWishlistChange={() => setWishlist(getWishlist())}
                />
              ))}
            </div>
          ) : (
            <div className="wishlist-empty">
              <div className="empty-icon">♡</div>

              <h2>Your Wishlist is Empty</h2>

              <p>
                Save the games you're interested in and build your collection.
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
            <div className="modal-icon">❤️</div>

            <h2>Clear Wishlist?</h2>

            <p>
              This will remove every game from your wishlist. This action cannot
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
                  clearWishlist();
                  setShowClearModal(false);
                }}
              >
                Clear Wishlist
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default WishlistPage;
