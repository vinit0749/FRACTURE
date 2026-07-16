import Carousel from "../Common/Carousel";
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

      <Carousel
        items={games}
        itemWidth={230}
        scrollAmount={520}
        renderItem={(game) => <GameCard game={game} />}
      />
    </section>
  );
}

export default SimilarGames;
