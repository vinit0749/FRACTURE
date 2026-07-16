import { useNavigate } from "react-router-dom";

import Carousel from "../Common/Carousel";
import GameCard from "../Explore/GameCard";

import useHomeCarousels from "../../hooks/useHomeCarousels";

function HomeCarousels() {
  const navigate = useNavigate();

  const { trending, topRated, newReleases, loading } = useHomeCarousels();

  if (loading) {
    return null;
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
