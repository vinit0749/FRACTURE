import { Link } from "react-router-dom";
import { Heart, Bookmark } from "lucide-react";

function getStars(rating = 0) {
  const fullStars = Math.floor(rating);
  const decimal = rating - fullStars;

  let stars = "★".repeat(fullStars);

  if (decimal >= 0.75) {
    stars += "★";
  } else if (decimal >= 0.25) {
    stars += "⯨";
  }

  while (stars.length < 5) {
    stars += "☆";
  }

  return stars;
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
  return (
    game.background_image || "https://via.placeholder.com/600x400?text=No+Image"
  );
}

function getMetacriticColor(score) {
  if (!score) return "#737389";
  if (score >= 90) return "#2EE59D";
  if (score >= 75) return "#FFC72C";
  return "#ff7b4d";
}

function GameCard({ game }) {
  const metaColor = getMetacriticColor(game.metacritic);

  return (
    <Link to={`/game/${game.id}`} className="game-card cinematic-card">
      <div className="card-image">
        <div className="card-actions">
          <button
            className="card-action-btn wishlist-card-btn"
            type="button"
            aria-label="Wishlist"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Heart size={18} />
          </button>

          <button
            className="card-action-btn library-card-btn"
            type="button"
            aria-label="Library"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Bookmark size={18} />
          </button>
        </div>

        <img src={getImage(game)} alt={game.name} loading="lazy" />

        <div className="image-gradient" />

        <button className="play-btn" type="button">
          ▶
        </button>

        <div className="image-overlay-content">
          <h3 className="game-title">{game.name}</h3>

          <div className="rating-row">
            <span className="stars">{getStars(game.rating)}</span>
            <span>{game.rating?.toFixed(1)}</span>
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
            borderColor: `${metaColor}33`,
          }}
        >
          {game.metacritic ?? "N/A"}
        </div>
      </div>
    </Link>
  );
}

export default GameCard;
