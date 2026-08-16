import { useState } from "react";

import {
  Bookmark,
  Heart,
  HeartOff,
  TriangleAlert,
  Library,
  Trash2,
} from "lucide-react";

import { FiExternalLink } from "react-icons/fi";

import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../../context/AuthModalContext";

import {
  isWishlisted,
  toggleWishlist,
  isInLibrary,
  toggleLibrary,
} from "../../utils/storage";

function formatDate(date) {
  if (!date) return null;

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function GameSidebar({ game }) {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  const [saved, setSaved] = useState(game ? isWishlisted(game.id) : false);

  const [inLibrary, setInLibrary] = useState(
    game ? isInLibrary(game.id) : false,
  );

  const { showToast } = useToast();

  if (!game) return null;

  const gameData = {
    id: game.id,
    name: game.name,
    slug: game.slug,
    background_image: game.background_image,
    rating: game.rating,
    ratings_count: game.ratings_count,
    released: game.released,
    genres: game.genres,
    platforms: game.platforms,
    developers: game.developers,
    publishers: game.publishers,

    addedAt: Date.now(),

    status: "backlog",
  };

  const officialWebsite =
    game.websites?.find((website) => website?.url)?.url || null;

  async function handleWishlist() {
    if (!user) {
      openAuthModal("login");
      return;
    }

    try {
      const status = await toggleWishlist(gameData, user);

      setSaved(status);

      window.dispatchEvent(new Event("wishlistUpdated"));

      showToast({
        type: status ? "success" : "info",
        icon: status ? <Heart size={20} /> : <HeartOff size={20} />,
        title: status ? "Added to Wishlist" : "Removed from Wishlist",
        description: game.name,
      });
    } catch (error) {
      console.error("Wishlist update failed:", error);

      showToast({
        type: "error",
        icon: <TriangleAlert size={20} />,
        title: "Something went wrong",
        description: "Could not update your wishlist.",
      });
    }
  }

  async function handleLibrary() {
    if (!user) {
      openAuthModal("login");
      return;
    }

    try {
      const status = await toggleLibrary(gameData, user);

      setInLibrary(status);

      window.dispatchEvent(new Event("libraryUpdated"));

      showToast({
        type: status ? "success" : "info",
        icon: status ? <Library size={20} /> : <Trash2 size={20} />,
        title: status ? "Added to Collection" : "Removed from Collection",
        description: game.name,
      });
    } catch (error) {
      console.error("Library update failed:", error);

      showToast({
        type: "error",
        icon: <TriangleAlert size={20} />,
        title: "Something went wrong",
        description: "Could not update your collection.",
      });
    }
  }

  return (
    <aside className="right-sidebar">
      {/* ================= STATS ================= */}

      <div className="sidebar-card">
        <div className="sidebar-title">STATS</div>

        {typeof game.rating === "number" && (
          <div className="stat-line">
            <span>IGDB Rating</span>

            <span>{game.rating.toFixed(2)} / 5</span>
          </div>
        )}

        {typeof game.ratings_count === "number" && game.ratings_count > 0 && (
          <div className="stat-line">
            <span>Ratings</span>

            <span>{game.ratings_count.toLocaleString()}</span>
          </div>
        )}

        {game.released && (
          <div className="stat-line">
            <span>Release Date</span>

            <span>{formatDate(game.released)}</span>
          </div>
        )}
      </div>

      {/* ================= GAME DETAILS ================= */}

      <div className="sidebar-card">
        <div className="sidebar-title">GAME DETAILS</div>

        {game.genres?.length > 0 && (
          <div className="sidebar-block">
            <div className="small-label">GENRES</div>

            <div>{game.genres.map((genre) => genre.name).join(", ")}</div>
          </div>
        )}

        {game.platforms?.length > 0 && (
          <div className="sidebar-block">
            <div className="small-label">PLATFORMS</div>

            <div>
              {game.platforms
                .map((platform) => platform?.platform?.name)
                .filter(Boolean)
                .join(" • ")}
            </div>
          </div>
        )}

        {game.developers?.length > 0 && (
          <div className="sidebar-block">
            <div className="small-label">DEVELOPERS</div>

            <div>
              {game.developers.map((developer) => developer.name).join(", ")}
            </div>
          </div>
        )}

        {game.publishers?.length > 0 && (
          <div className="sidebar-block">
            <div className="small-label">PUBLISHERS</div>

            <div>
              {game.publishers.map((publisher) => publisher.name).join(", ")}
            </div>
          </div>
        )}
      </div>

      {/* ================= LINKS ================= */}

      <div className="sidebar-card">
        <div className="sidebar-title">LINKS</div>

        <button
          type="button"
          className={`library-button ${inLibrary ? "active" : ""}`}
          onClick={handleLibrary}
        >
          <Bookmark />

          <span>
            {inLibrary ? "Remove from Collection" : "Add to Collection"}
          </span>
        </button>

        <button
          type="button"
          className={`wishlist-button ${saved ? "active" : ""}`}
          onClick={handleWishlist}
        >
          <Heart />

          <span>{saved ? "Remove from Wishlist" : "Add to Wishlist"}</span>
        </button>

        {officialWebsite && (
          <a
            href={officialWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="website-button"
          >
            <FiExternalLink />

            <span>Official Website</span>
          </a>
        )}
      </div>
    </aside>
  );
}

export default GameSidebar;
