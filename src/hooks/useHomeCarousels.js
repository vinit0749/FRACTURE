import { useEffect, useState } from "react";
import { fetchGames } from "../api/fracture";
import { isSafeGame } from "../utils/gameFilter";

let carouselCache = null;
let carouselPromise = null;

export default function useHomeCarousels() {
  const [trending, setTrending] = useState(carouselCache?.trending || []);

  const [topRated, setTopRated] = useState(carouselCache?.topRated || []);

  const [newReleases, setNewReleases] = useState(
    carouselCache?.newReleases || [],
  );

  const [loading, setLoading] = useState(!carouselCache);
  const [error, setError] = useState("");

  useEffect(() => {
    if (carouselCache) {
      applyData(carouselCache);
      setError("");
      return;
    }

    loadCarousels();
  }, []);

  async function loadCarousels() {
    setLoading(true);
    setError("");

    // Prevent duplicate calls
    if (carouselPromise) {
      const data = await carouselPromise;

      applyData(data);

      return;
    }

    carouselPromise = (async () => {
      try {
        const today = new Date();

        const lastYear = new Date();

        lastYear.setFullYear(today.getFullYear() - 1);

        const formatDate = (date) => date.toISOString().split("T")[0];

        const trendingParams = `ordering=-added&page_size=20&dates=${formatDate(lastYear)},${formatDate(today)}`;

        const topRatedParams = "ordering=-rating&page_size=20";

        const newReleaseParams = `ordering=-released&page_size=20&dates=${formatDate(lastYear)},${formatDate(today)}&exclude_additions=`;

        const [trendingData, topRatedData, newReleaseData] = await Promise.all([
          fetchGames(trendingParams),

          fetchGames(topRatedParams),

          fetchGames(newReleaseParams),
        ]);

        const data = {
          trending: (trendingData.results || []).filter(isSafeGame),

          topRated: (topRatedData.results || []).filter(isSafeGame),

          newReleases: (newReleaseData.results || []).filter(
            (game) =>
              game.background_image && game.released && isSafeGame(game),
          ),
        };

        // Store completed result
        carouselCache = data;

        return data;
      } catch (error) {
        console.error("Carousel loading failed:", error);
        setError("We couldn't load the featured carousels. Please try again.");

        return {
          trending: [],

          topRated: [],

          newReleases: [],
        };
      } finally {
        carouselPromise = null;
      }
    })();

    const data = await carouselPromise;

    applyData(data);
  }

  function retry() {
    setError("");
    loadCarousels();
  }

  function applyData(data) {
    setTrending(data.trending);

    setTopRated(data.topRated);

    setNewReleases(data.newReleases);

    setLoading(false);
  }

  return {
    trending,

    topRated,

    newReleases,

    loading,
    error,
    retry,
  };
}
