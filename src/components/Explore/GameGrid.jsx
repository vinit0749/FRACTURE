import GameCard from "./GameCard";
import SkeletonCard from "./SkeletonCard";

import { TriangleAlert, Gamepad2 } from "lucide-react";

function GameGrid({ games = [], loading, error, retry }) {
  if (loading) {
    return (
      <main id="game-grid" className="game-grid">
        {Array.from({ length: 10 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </main>
    );
  }

  if (error) {
    return (
      <main id="game-grid" className="game-grid">
        <div className="empty-state">
          <div className="empty-icon">
            <TriangleAlert size={40} />
          </div>

          <h2>We couldn't load these games</h2>

          <p>{error}</p>

          {retry && (
            <button className="hero-btn" onClick={retry} type="button">
              Try Again
            </button>
          )}
        </div>
      </main>
    );
  }

  if (!games.length) {
    return (
      <main id="game-grid" className="game-grid">
        <div className="empty-state">
          <div className="empty-icon">
            <Gamepad2 size={40} />
          </div>

          <h2>No games matched your search</h2>

          <p>Try another title or genre.</p>
        </div>
      </main>
    );
  }

  return (
    <main id="game-grid" className="game-grid">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </main>
  );
}

export default GameGrid;
