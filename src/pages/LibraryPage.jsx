import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Header from "../components/Layout/Header";
import GameCard from "../components/Explore/GameCard";
import CollectionRow from "../components/Library/CollectionRow";

import { getLibrary, saveLibrary } from "../utils/storage";

import "../styles/library.css";

function LibraryPage() {
  const [library, setLibrary] = useState([]);

  const [searchInput, setSearchInput] = useState("");

  const [showClearModal, setShowClearModal] = useState(false);

  const [activeFilter, setActiveFilter] = useState("all");

  function updateSearchInput(value) {
    setSearchInput(value);
  }

  function loadLibrary() {
    setLibrary(getLibrary());
  }

  useEffect(() => {
    loadLibrary();

    function handleStorageUpdate() {
      loadLibrary();
    }

    window.addEventListener("libraryUpdated", handleStorageUpdate);

    return () => {
      window.removeEventListener("libraryUpdated", handleStorageUpdate);
    };
  }, []);

  function clearLibrary() {
    saveLibrary([]);

    setLibrary([]);
  }

  /* ===============================
      COLLECTION STATS
  =============================== */

  const ownedGames = library.length;

  const currentlyPlaying = library.filter(
    (game) => game.status === "playing",
  ).length;

  const completedGames = library.filter(
    (game) => game.status === "completed",
  ).length;

  const backlogGames = library.filter(
    (game) => !game.status || game.status === "backlog",
  ).length;

  /* ===============================
      FILTERS
  =============================== */

  const filteredLibrary = library.filter((game) => {
    if (activeFilter === "all") return true;

    if (activeFilter === "playing") {
      return game.status === "playing";
    }

    if (activeFilter === "completed") {
      return game.status === "completed";
    }

    if (activeFilter === "backlog") {
      return !game.status || game.status === "backlog";
    }

    return true;
  });

  return (
    <>
      <Header searchInput={searchInput} updateSearchInput={updateSearchInput} />

      <main className="library-page">
        <div className="container">
          {/* HEADER */}

          <section className="library-header">
            <div className="library-heading">
              <h1>My Collection</h1>
            </div>

            <div className="library-info">
              <span id="library-count">
                {ownedGames === 1
                  ? "1 Game Owned"
                  : `${ownedGames} Games Owned`}
              </span>

              {library.length > 0 && (
                <button
                  className="secondary-btn"
                  onClick={() => setShowClearModal(true)}
                >
                  Clear Collection
                </button>
              )}
            </div>
          </section>

          <div className="library-divider" />

          {/* COLLECTION STATS */}

          {library.length > 0 && (
            <section className="library-stats">
              <div className="collection-card">
                <div className="collection-label">Games Owned</div>

                <div className="collection-value">{ownedGames}</div>

                <div className="collection-sub">Total collection</div>
              </div>

              <div className="collection-card">
                <div className="collection-label">Currently Playing</div>

                <div className="collection-value">{currentlyPlaying}</div>

                <div className="collection-sub">Active games</div>
              </div>

              <div className="collection-card">
                <div className="collection-label">Completed</div>

                <div className="collection-value">{completedGames}</div>

                <div className="collection-sub">Finished games</div>
              </div>

              <div className="collection-card">
                <div className="collection-label">Backlog</div>

                <div className="collection-value">{backlogGames}</div>

                <div className="collection-sub">Waiting to play</div>
              </div>
            </section>
          )}

          {/* COLLECTION ROWS / VIEW ALL */}

          {library.length > 0 ? (
            activeFilter === "all" ? (
              <>
                <CollectionRow
                  title="Currently Playing"
                  games={library.filter((game) => game.status === "playing")}
                  onLibraryChange={loadLibrary}
                  onViewAll={() => setActiveFilter("playing")}
                />

                <CollectionRow
                  title="Completed"
                  games={library.filter((game) => game.status === "completed")}
                  onLibraryChange={loadLibrary}
                  onViewAll={() => setActiveFilter("completed")}
                />

                <CollectionRow
                  title="Backlog"
                  games={library.filter(
                    (game) => !game.status || game.status === "backlog",
                  )}
                  onLibraryChange={loadLibrary}
                  onViewAll={() => setActiveFilter("backlog")}
                />
              </>
            ) : (
              <>
                <div className="library-view-header">
                  <button
                    className="secondary-btn"
                    onClick={() => setActiveFilter("all")}
                  >
                    ← Back to Collection
                  </button>

                  <h2>
                    {activeFilter === "playing"
                      ? "Currently Playing"
                      : activeFilter === "completed"
                        ? "Completed Games"
                        : "Backlog"}
                  </h2>
                </div>

                <div id="library-grid" className="game-grid">
                  {library
                    .filter((game) => {
                      if (activeFilter === "playing") {
                        return game.status === "playing";
                      }

                      if (activeFilter === "completed") {
                        return game.status === "completed";
                      }

                      return !game.status || game.status === "backlog";
                    })
                    .map((game) => (
                      <GameCard
                        key={game.id}
                        game={game}
                        onLibraryChange={loadLibrary}
                        showLibraryStatus
                      />
                    ))}
                </div>
              </>
            )
          ) : (
            <div className="library-empty">
              <div className="empty-icon">📚</div>

              <h2>Your Collection is Empty</h2>

              <p>
                Add games to your library and build your personal gaming
                archive.
              </p>

              <Link to="/" className="hero-btn">
                Explore Games
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* CLEAR MODAL */}

      {showClearModal && (
        <div className="modal-overlay" onClick={() => setShowClearModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">📚</div>

            <h2>Clear Collection?</h2>

            <p>
              This will remove every game from your collection. This action
              cannot be undone.
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
                Clear Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LibraryPage;
