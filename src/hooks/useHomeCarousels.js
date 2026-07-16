import { useEffect, useState } from "react";
import { fetchGames } from "../api/rawg";

let carouselCache = null;
let carouselPromise = null;

export default function useHomeCarousels() {
  const [trending, setTrending] = useState(carouselCache?.trending || []);

  const [topRated, setTopRated] = useState(carouselCache?.topRated || []);

  const [newReleases, setNewReleases] = useState(
    carouselCache?.newReleases || [],
  );

  const [loading, setLoading] = useState(!carouselCache);

  useEffect(() => {
    if (carouselCache) {
      return;
    }

    loadCarousels();
  }, []);

  async function loadCarousels() {
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

        const newReleaseParams = `ordering=-added&page_size=20&dates=${formatDate(lastYear)},${formatDate(today)}`;

        const [trendingData, topRatedData, newReleaseData] = await Promise.all([
          fetchGames(trendingParams),

          fetchGames(topRatedParams),

          fetchGames(newReleaseParams),
        ]);

        const data = {
          trending: trendingData.results || [],

          topRated: topRatedData.results || [],

          newReleases: (newReleaseData.results || []).filter(
            (game) => game.background_image,
          ),
        };

        // Store completed result
        carouselCache = data;

        return data;
      } catch (error) {
        console.error("Carousel loading failed:", error);

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
  };
}
