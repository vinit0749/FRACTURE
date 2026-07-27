import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ArrowLeft, ChevronRight, TriangleAlert } from "lucide-react";

import Header from "../components/Layout/Header";

import GameDetailsSkeleton from "../components/GameDetails/GameDetailsSkeleton";

import GameHero from "../components/GameDetails/GameHero";
import GameSidebar from "../components/GameDetails/GameSidebar";
import ScreenshotGallery from "../components/GameDetails/ScreenshotGallery";
import TrailerSection from "../components/GameDetails/TrailerSection";
import SimilarGames from "../components/GameDetails/SimilarGames";

import useGameDetails from "../hooks/useGameDetails";

function GameDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const { game, screenshots, trailer, similarGames, loading, error, retry } =
    useGameDetails(id);

  // ===============================
  // HEADER SEARCH
  // ===============================

  const [searchInput, setSearchInput] = useState("");

  function updateSearchInput(value) {
    setSearchInput(value);
  }

  // ===============================
  // LOADING
  // ===============================

  if (loading) {
    return (
      <>
        <Header
          searchInput={searchInput}
          updateSearchInput={updateSearchInput}
        />

        <GameDetailsSkeleton />
      </>
    );
  }

  // ===============================
  // ERROR
  // ===============================

  if (error) {
    return (
      <>
        <Header
          searchInput={searchInput}
          updateSearchInput={updateSearchInput}
        />

        <main className="container">
          <div className="empty-state">
            <div className="empty-icon">
              <TriangleAlert size={40} />
            </div>

            <h2>We couldn't load this game</h2>

            <p>{error}</p>

            <button className="hero-btn" onClick={retry} type="button">
              Try Again
            </button>
          </div>
        </main>
      </>
    );
  }

  if (!game) {
    return null;
  }

  return (
    <>
      <Header searchInput={searchInput} updateSearchInput={updateSearchInput} />

      <main className="game-page">
        <div className="container">
          <div className="game-layout">
            {/* ===============================
                TOP SECTION
            =============================== */}

            <div className="top-section">
              <button
                type="button"
                className="back-button"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft size={16} /> Back
              </button>

              <div className="hero-divider"></div>

              <nav className="breadcrumb">
                <Link to="/">Home</Link>

                <span>
                  <ChevronRight size={14} />
                </span>

                <span id="breadcrumb-genre">
                  {game.genres?.[0]?.name || "Game"}
                </span>

                <span>
                  <ChevronRight size={14} />
                </span>

                <span id="breadcrumb-title">{game.name}</span>
              </nav>

              <h1 id="game-title">{game.name}</h1>
            </div>

            {/* ===============================
                LEFT COLUMN
            =============================== */}

            <div className="left-column">
              <GameHero game={game} />

              <ScreenshotGallery screenshots={screenshots} game={game} />

              <TrailerSection trailer={trailer} game={game} />

              <SimilarGames games={similarGames} />
            </div>

            {/* ===============================
                RIGHT SIDEBAR
            =============================== */}

            <GameSidebar game={game} />
          </div>
        </div>
      </main>
    </>
  );
}

export default GameDetailsPage;
