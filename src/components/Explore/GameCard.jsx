import { Link } from "react-router-dom";
import { Heart, Bookmark, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../context/AuthContext";

import {
  toggleWishlist,
  isWishlisted,
  toggleLibrary,
  isInLibrary,
  updateLibraryStatus,
} from "../../utils/storage";

function getStars(rating = 0) {
  const value = Math.min(Math.max(rating, 0), 5);

  const full = Math.floor(value);
  const decimal = value - full;

  let result = "★".repeat(full);

  if (decimal >= 0.75 && result.length < 5) {
    result += "★";
  } else if (decimal >= 0.25 && result.length < 5) {
    result += "⯨";
  }

  return (result + "☆☆☆☆☆").slice(0, 5);
}

function formatDate(date) {
  if (!date) return "Unknown";

  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getImage(game) {
  return game.background_image || "https://placehold.co/600x400?text=No+Image";
}

function getMetacriticColor(score) {
  if (!score) return "#737389";

  if (score >= 90) return "#2EE59D";

  if (score >= 75) return "#FFC72C";

  return "#ff7b4d";
}

function getLibraryStatus(status) {
  if (!status || status === "backlog") return "Backlog";

  if (status === "playing") return "Playing";

  if (status === "completed") return "Completed";

  return "Backlog";
}

function GameCard({
  game,
  onWishlistChange,
  onLibraryChange,
  showLibraryStatus = false,
}) {
  const { user } = useAuth();

  const [wishlisted, setWishlisted] = useState(isWishlisted(game.id));

  const [library, setLibrary] = useState(isInLibrary(game.id));

  const [status, setStatus] = useState(game.status || "backlog");

  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const badgeRef = useRef(null);

  const { showToast } = useToast();

  /* ===============================
      REFRESH CARD STATE
  =============================== */

  function refreshCardState() {
    setWishlisted(isWishlisted(game.id));

    setLibrary(isInLibrary(game.id));

    const storedGame = JSON.parse(localStorage.getItem("library") || "[]").find(
      (item) => item.id === game.id,
    );

    setStatus(storedGame?.status || "backlog");
  }

  useEffect(() => {
    refreshCardState();
  }, [game.id, game.status, user]);

  /* ===============================
      SYNC CARD STATE ACROSS APP
  =============================== */

  useEffect(() => {
    function handleWishlistUpdated() {
      refreshCardState();
    }

    function handleLibraryUpdated() {
      refreshCardState();
    }

    window.addEventListener("wishlistUpdated", handleWishlistUpdated);
    window.addEventListener("libraryUpdated", handleLibraryUpdated);

    return () => {
      window.removeEventListener("wishlistUpdated", handleWishlistUpdated);
      window.removeEventListener("libraryUpdated", handleLibraryUpdated);
    };
  }, [game.id]);

  /* ===============================
      CLOSE STATUS MENU
  =============================== */

  useEffect(() => {
    function closeMenu(e) {
      if (badgeRef.current && !badgeRef.current.contains(e.target)) {
        setShowStatusMenu(false);
      }
    }

    document.addEventListener("mousedown", closeMenu);

    return () => {
      document.removeEventListener("mousedown", closeMenu);
    };
  }, []);

  /* ===============================
      WISHLIST
  =============================== */

  async function handleWishlist(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showToast({
        type: "info",
        icon: "🔐",
        title: "Sign In Required",
        description: "Please sign in to use your wishlist.",
        duration: 2500,
      });

      return;
    }

    const active = await toggleWishlist(game, user);

    setWishlisted(active);

    window.dispatchEvent(new Event("wishlistUpdated"));

    showToast({
      type: active ? "success" : "info",
      icon: active ? "❤️" : "💔",
      title: active ? "Added to Wishlist" : "Removed from Wishlist",
      description: game.name,
      duration: 2500,
    });

    onWishlistChange?.();
  }

  /* ===============================
      LIBRARY
  =============================== */

  async function handleLibrary(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showToast({
        type: "info",
        icon: "🔐",
        title: "Sign In Required",
        description: "Please sign in to use your collection.",
        duration: 2500,
      });

      return;
    }

    const active = await toggleLibrary(game, user);

    setLibrary(active);

    if (active) {
      setStatus("backlog");
    }

    window.dispatchEvent(new Event("libraryUpdated"));

    showToast({
      type: active ? "success" : "info",
      icon: active ? "📚" : "🗑️",
      title: active ? "Added to Collection" : "Removed from Collection",
      description: game.name,
      duration: 2500,
    });

    onLibraryChange?.();
  }

  /* ===============================
      LIBRARY STATUS
  =============================== */

  async function changeStatus(newStatus) {
    if (!user) {
      return;
    }

    await updateLibraryStatus(game.id, newStatus, user);

    setStatus(newStatus);

    setShowStatusMenu(false);

    window.dispatchEvent(new Event("libraryUpdated"));

    onLibraryChange?.();
  }

  const metaColor = getMetacriticColor(game.metacritic);

  return (
    <Link to={`/game/${game.id}`} className="game-card cinematic-card">
      <div className="card-image">
        <div className="card-actions">
          {/* ===============================
              WISHLIST BUTTON
          =============================== */}

          <button
            className={`card-action-btn wishlist-card-btn ${
              wishlisted ? "active" : ""
            }`}
            type="button"
            onClick={handleWishlist}
          >
            <Heart size={18} fill={wishlisted ? "currentColor" : "none"} />
          </button>

          {/* ===============================
              LIBRARY BUTTON
          =============================== */}

          <button
            className={`card-action-btn library-card-btn ${
              library ? "active" : ""
            }`}
            type="button"
            onClick={handleLibrary}
          >
            <Bookmark size={18} fill={library ? "currentColor" : "none"} />
          </button>
        </div>

        {/* ===============================
            LIBRARY STATUS
        =============================== */}

        {showLibraryStatus && library && (
          <div className="library-status-wrapper" ref={badgeRef}>
            <button
              type="button"
              className={`library-badge ${status}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                setShowStatusMenu((prev) => !prev);
              }}
            >
              {getLibraryStatus(status)}
            </button>

            {showStatusMenu && (
              <div className="library-dropdown">
                <button
                  type="button"
                  className={`library-option ${
                    status === "backlog" ? "active" : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    changeStatus("backlog");
                  }}
                >
                  Backlog
                </button>

                <button
                  type="button"
                  className={`library-option ${
                    status === "playing" ? "active" : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    changeStatus("playing");
                  }}
                >
                  Playing
                </button>

                <button
                  type="button"
                  className={`library-option ${
                    status === "completed" ? "active" : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    changeStatus("completed");
                  }}
                >
                  Completed
                </button>
              </div>
            )}
          </div>
        )}

        <img src={getImage(game)} alt={game.name} loading="lazy" />

        <div className="image-gradient" />

        <div className="play-btn">
          <Play size={22} />
        </div>

        <div className="image-overlay-content">
          <h3 className="game-title">{game.name}</h3>

          <div className="rating-row">
            <span className="stars">{getStars(game.rating)}</span>

            <span>{game.rating?.toFixed(1) ?? "0.0"}</span>
          </div>

          <div className="genre-pills">
            {game.genres?.slice(0, 3).map((genre) => (
              <span key={genre.id} className="genre-pill">
                {genre.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="card-bottom">
        <div className="release">📅 {formatDate(game.released)}</div>

        <div
          className="meta-badge"
          style={{
            color: metaColor,
            borderColor: `${metaColor}55`,
          }}
        >
          {game.metacritic ?? "N/A"}
        </div>
      </div>
    </Link>
  );
}

export default GameCard;
