import { useNavigate } from "react-router-dom";

import Carousel from "../Common/Carousel";
import GameCard from "../Explore/GameCard";

import useHomeCarousels from "../../hooks/useHomeCarousels";

function HomeCarousels() {
  const navigate = useNavigate();

  const { trending, topRated, newReleases, loading, error, retry } =
    useHomeCarousels();

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <section className="empty-state">
        <div className="empty-icon">⚠️</div>

        <h2>We couldn't load the featured games</h2>

        <p>{error}</p>

        <button className="hero-btn" onClick={retry} type="button">
          Try Again
        </button>
      </section>
    );
  }

  return (
    <>
      <Carousel
        title="Trending"
        items={trending}
        itemWidth={230}
        scrollAmount={520}
        onViewAll={() => navigate("/trending")}
        renderItem={(game) => <GameCard game={game} />}
      />

      <Carousel
        title="Top Rated"
        items={topRated}
        itemWidth={230}
        scrollAmount={520}
        onViewAll={() => navigate("/top-rated")}
        renderItem={(game) => <GameCard game={game} />}
      />

      <Carousel
        title="New Releases"
        items={newReleases}
        itemWidth={230}
        scrollAmount={520}
        onViewAll={() => navigate("/new-releases")}
        renderItem={(game) => <GameCard game={game} />}
      />
    </>
  );
}

export default HomeCarousels;
