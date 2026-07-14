import { useState } from "react";

import { FaSteam, FaXbox, FaPlaystation } from "react-icons/fa";
import { Bookmark, Heart } from "lucide-react";

import { SiEpicgames } from "react-icons/si";
import { FiExternalLink } from "react-icons/fi";

import {
  isWishlisted,
  toggleWishlist,
  isInLibrary,
  toggleLibrary,
} from "../../utils/storage";

function getMetaColor(score) {
  if (score >= 90) return "#2EE59D";
  if (score >= 75) return "#FFC72C";
  if (score) return "#ff7b4d";
  return "#737389";
}

const storeIcons = {
  Steam: <FaSteam />,
  "Epic Games": <SiEpicgames />,
  Xbox: <FaXbox />,
  "Xbox Store": <FaXbox />,
  PlayStation: <FaPlaystation />,
  "PlayStation Store": <FaPlaystation />,
};

function formatDate(date) {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function GameSidebar({ game }) {
  const [saved, setSaved] = useState(game ? isWishlisted(game.id) : false);

  const [inLibrary, setInLibrary] = useState(
    game ? isInLibrary(game.id) : false,
  );

  if (!game) return null;

  const metaColor = getMetaColor(game.metacritic);

  const gameData = {
    id: game.id,
    name: game.name,
    slug: game.slug,
    background_image: game.background_image,
    rating: game.rating,
    metacritic: game.metacritic,
    released: game.released,
    genres: game.genres,
    parent_platforms: game.parent_platforms,
  };

  function handleWishlist() {
    toggleWishlist(gameData);

    setSaved(isWishlisted(game.id));
  }

  function handleLibrary() {
    const status = toggleLibrary(gameData);

    setInLibrary(status);
  }

  return (
    <aside className="right-sidebar">
      {/* ================= STATS ================= */}

      <div className="sidebar-card">
        <div className="sidebar-title">STATS</div>

        <div className="stat-line">
          <span>Metacritic</span>

          <span
            style={{
              color: metaColor,
              background: `${metaColor}15`,
              border: `1px solid ${metaColor}55`,
              padding: "4px 10px",
              borderRadius: "8px",
            }}
          >
            {game.metacritic ?? "N/A"}
          </span>
        </div>

        <div className="stat-line">
          <span>User Rating</span>

          <span>{game.rating?.toFixed(2)} / 5</span>
        </div>

        <div className="stat-line">
          <span>Release Date</span>

          <span>{formatDate(game.released)}</span>
        </div>

        <div className="stat-line">
          <span>Playtime</span>

          <span>{game.playtime || 0} hrs</span>
        </div>
      </div>

      {/* ================= GAME DETAILS ================= */}

      <div className="sidebar-card">
        <div className="sidebar-title">GAME DETAILS</div>

        <div className="sidebar-block">
          <div className="small-label">GENRES</div>

          <div>
            {game.genres?.length
              ? game.genres.map((g) => g.name).join(", ")
              : "N/A"}
          </div>
        </div>

        <div className="sidebar-block">
          <div className="small-label">PLATFORMS</div>

          <div>
            {game.parent_platforms?.length
              ? game.parent_platforms.map((p) => p.platform.name).join(" • ")
              : "N/A"}
          </div>
        </div>

        <div className="sidebar-block">
          <div className="small-label">DEVELOPERS</div>

          <div>
            {game.developers?.length
              ? game.developers.map((d) => d.name).join(", ")
              : "N/A"}
          </div>
        </div>

        <div className="sidebar-block">
          <div className="small-label">PUBLISHERS</div>

          <div>
            {game.publishers?.length
              ? game.publishers.map((p) => p.name).join(", ")
              : "N/A"}
          </div>
        </div>
      </div>

      {/* ================= TAGS ================= */}

      <div className="sidebar-card">
        <div className="sidebar-title">FEATURE TAGS</div>

        <div id="game-extra">
          {game.tags?.length
            ? game.tags
                .slice(0, 6)
                .map((tag) => tag.name)
                .join(" • ")
            : "No tags available"}
        </div>
      </div>

      {/* ================= LINKS ================= */}

      <div className="sidebar-card">
        <div className="sidebar-title">LINKS</div>

        <button
          className={`library-button ${inLibrary ? "active" : ""}`}
          onClick={handleLibrary}
        >
          <Bookmark />

          <span>{inLibrary ? "Remove from Library" : "Add to Library"}</span>
        </button>

        <button
          className={`wishlist-button ${saved ? "active" : ""}`}
          onClick={handleWishlist}
        >
          <Heart />

          <span>{saved ? "Remove from Wishlist" : "Add to Wishlist"}</span>
        </button>

        {game.website ? (
          <a
            href={game.website}
            target="_blank"
            rel="noopener noreferrer"
            className="website-button"
          >
            <FiExternalLink />

            <span>Official Website</span>
          </a>
        ) : (
          <p className="no-website">No official website available.</p>
        )}

        <div className="store-links">
          <div className="small-label">AVAILABLE ON</div>

          <div id="store-links">
            {game.stores?.length ? (
              game.stores.map(({ store }) => (
                <a
                  key={store.id}
                  href={`https://${store.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-chip"
                >
                  {storeIcons[store.name]}

                  <span>{store.name.replace(" Store", "")}</span>
                </a>
              ))
            ) : (
              <span className="no-website">No stores available.</span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default GameSidebar;
