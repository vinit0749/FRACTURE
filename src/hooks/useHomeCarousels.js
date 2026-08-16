import { useEffect, useState } from "react";
import { fetchGames } from "../api/fracture";
import { isSafeGame } from "../utils/gameFilter";

let carouselCache = null;
let carouselPromise = null;

const CAROUSEL_SIZE = 20;
const FETCH_SIZE = 40;

/* ============================================================
   HELPERS
   ============================================================ */

function isUsableGame(game) {
  return (
    Boolean(game) &&
    isSafeGame(game) &&
    Boolean(game.background_image) &&
    Boolean(game.released)
  );
}

function uniqueGames(games) {
  return [
    ...new Map(
      (games || []).filter(isUsableGame).map((game) => [game.id, game]),
    ).values(),
  ];
}

function takeGames(games) {
  return uniqueGames(games).slice(0, CAROUSEL_SIZE);
}

/* ============================================================
   HOOK
   ============================================================ */

export default function useHomeCarousels() {
  const [trending, setTrending] = useState(carouselCache?.trending || []);

  const [topRated, setTopRated] = useState(carouselCache?.topRated || []);

  const [newReleases, setNewReleases] = useState(
    carouselCache?.newReleases || [],
  );

  const [loading, setLoading] = useState(!carouselCache);
  const [error, setError] = useState("");

  /* ==========================================================
     INITIAL LOAD
     ========================================================== */

  useEffect(() => {
    if (carouselCache) {
      applyData(carouselCache);
      return;
    }

    loadCarousels();
  }, []);

  /* ==========================================================
     LOAD
     ========================================================== */

  async function loadCarousels() {
    if (carouselPromise) {
      const data = await carouselPromise;
      applyData(data);
      return;
    }

    setLoading(true);
    setError("");

    carouselPromise = (async () => {
      try {
        console.log("FRACTURE Home: loading carousels");

        /* ====================================================
           1. TRENDING

           EXACT SAME DATASET AS TRENDING PAGE

           - added / popularity ordering
           - games from the last 3 years
           ==================================================== */

        const today = new Date();

        const threeYearsAgo = new Date();

        threeYearsAgo.setFullYear(today.getFullYear() - 3);

        const trendingData = await fetchGames(
          `&ordering=-added&page_size=${FETCH_SIZE}&dates=${
            threeYearsAgo.toISOString().split("T")[0]
          },${today.toISOString().split("T")[0]}`,
        );

        const trending = takeGames(trendingData?.results);

        console.log("FRACTURE Trending:", trending.length);

        /* ====================================================
           2. TOP RATED

           EXACT SAME DATASET AS TOP RATED PAGE
           ==================================================== */

        await new Promise((resolve) => setTimeout(resolve, 750));

        const topRatedData = await fetchGames(
          `&ordering=-rating&page_size=${FETCH_SIZE}`,
        );

        const topRated = takeGames(topRatedData?.results);

        console.log("FRACTURE Top Rated:", topRated.length);

        /* ====================================================
           3. NEW RELEASES

           EXACT SAME DATASET AS NEW RELEASES PAGE

           - released ordering
           - games from the last 1 year
           ==================================================== */

        await new Promise((resolve) => setTimeout(resolve, 750));

        const oneYearAgo = new Date();

        oneYearAgo.setFullYear(today.getFullYear() - 1);

        const newReleaseData = await fetchGames(
          `&ordering=-released&page_size=${FETCH_SIZE}&dates=${
            oneYearAgo.toISOString().split("T")[0]
          },${today.toISOString().split("T")[0]}`,
        );

        const newReleases = takeGames(newReleaseData?.results);

        console.log("FRACTURE New Releases:", newReleases.length);

        /* ====================================================
           FINAL
           ==================================================== */

        const result = {
          trending,
          topRated,
          newReleases,
        };

        console.log("FRACTURE Home carousels:", {
          trending: trending.length,
          topRated: topRated.length,
          newReleases: newReleases.length,
        });

        carouselCache = result;

        return result;
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

  /* ==========================================================
     RETRY
     ========================================================== */

  function retry() {
    carouselCache = null;

    setError("");
    setLoading(true);

    loadCarousels();
  }

  /* ==========================================================
     APPLY
     ========================================================== */

  function applyData(data) {
    setTrending(data?.trending || []);
    setTopRated(data?.topRated || []);
    setNewReleases(data?.newReleases || []);

    setLoading(false);
  }

  /* ==========================================================
     RETURN
     ========================================================== */

  return {
    trending,
    topRated,
    newReleases,
    loading,
    error,
    retry,
  };
}
