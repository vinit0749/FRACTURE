import { useEffect, useState } from "react";

import {
  fetchGames,
  fetchGameDetails,
  fetchGameScreenshots,
} from "../api/fracture";

let heroCache = null;
let heroPromise = null;

function getHeroMetadata(game) {
  const today = new Date();

  const releaseDate = game.released ? new Date(game.released) : null;

  const monthsOld = releaseDate
    ? (today - releaseDate) / (1000 * 60 * 60 * 24 * 30)
    : 999;

  if (game.metacritic >= 90) {
    return {
      heroType: "CRITIC'S CHOICE",
      badge: "CRITIC'S CHOICE",
      reason:
        "One of the highest rated experiences recognized by critics worldwide.",
      category: "TOP RATED",
      score: game.metacritic,
    };
  }

  if (monthsOld <= 12) {
    return {
      heroType: "NEW RELEASE",
      badge: "LATEST ADVENTURE",
      reason: "A fresh gaming experience waiting to be discovered.",
      category: "NEW",
      score: game.rating,
    };
  }

  if (game.rating >= 4 && !game.metacritic) {
    return {
      heroType: "HIDDEN GEM",
      badge: "PLAYER FAVORITE",
      reason: "An underrated experience loved by the community.",
      category: "DISCOVERY",
      score: game.rating,
    };
  }

  return {
    heroType: "TRENDING NOW",

    badge: "FEATURED DISCOVERY",

    reason: "A popular game that players are discovering right now.",

    category: "TRENDING",

    score: game.rating,
  };
}

export default function useHero() {
  const [featuredGame, setFeaturedGame] = useState(
    heroCache?.featuredGame || null,
  );

  const [heroImages, setHeroImages] = useState(heroCache?.heroImages || []);

  const [heroMeta, setHeroMeta] = useState(heroCache?.heroMeta || null);

  const [loading, setLoading] = useState(!heroCache);
  const [error, setError] = useState("");

  useEffect(() => {
    if (heroCache) {
      setFeaturedGame(heroCache.featuredGame);
      setHeroImages(heroCache.heroImages);
      setHeroMeta(heroCache.heroMeta);
      setError("");
      setLoading(false);

      return;
    }

    loadFeaturedGame().then((data) => {
      if (!data) {
        setLoading(false);

        return;
      }

      setFeaturedGame(data.featuredGame);

      setHeroImages(data.heroImages);

      setHeroMeta(data.heroMeta);
      setError("");
      setLoading(false);
    });
  }, []);

  async function loadFeaturedGame() {
    if (heroPromise) {
      return heroPromise;
    }

    heroPromise = (async () => {
      try {
        const queries = [
          "&ordering=-metacritic&page_size=40",

          "&ordering=-rating&page_size=40",

          "&ordering=-added&page_size=40",

          "&tags=indie&page_size=40",

          "&genres=action&page_size=40",
        ];

        const responses = await Promise.all(queries.map(fetchGames));

        const games = responses.flatMap((data) => data.results || []);

        const uniqueGames = [
          ...new Map(
            games

              .filter((game) => game.background_image)

              .map((game) => [game.id, game]),
          ).values(),
        ];

        uniqueGames.sort(() => Math.random() - 0.5);

        const selected = uniqueGames[0];

        if (!selected) {
          return null;
        }

        const details = await fetchGameDetails(selected.id);

        const screenshotData = await fetchGameScreenshots(details.id);

        const screenshots = [
          ...new Set(
            (screenshotData.results || [])

              .map((shot) => shot.image)

              .filter(Boolean),
          ),
        ];

        const images = [details.background_image, ...screenshots].filter(
          Boolean,
        );

        heroCache = {
          featuredGame: details,

          heroImages: [...new Set(images)],

          heroMeta: getHeroMetadata(details),
        };

        return heroCache;
      } catch (error) {
        console.error("Hero loading failed:", error);
        setError("We couldn't load the hero experience. Please try again.");

        return null;
      } finally {
        heroPromise = null;
      }
    })();

    return heroPromise;
  }

  function retry() {
    setError("");
    setLoading(true);
    loadFeaturedGame();
  }

  return {
    featuredGame,

    heroImages,

    heroMeta,
    loading,
    error,
    retry,
  };
}
