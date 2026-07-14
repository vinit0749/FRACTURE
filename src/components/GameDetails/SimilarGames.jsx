import GameCard from "../Explore/GameCard";

function SimilarGames({ games }) {
  if (!games.length) {
    return (
      <section className="similar-games-section">
        <div className="section-label">YOU MAY ALSO LIKE</div>

        <p>No similar games found.</p>
      </section>
    );
  }

  return (
    <section className="similar-games-section">
      <div className="section-label">YOU MAY ALSO LIKE</div>

      <div className="similar-games-grid">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  );
}

export default SimilarGames;
