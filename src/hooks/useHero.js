import { useEffect, useState } from "react";

import {
  fetchGames,
  fetchGameDetails,
  fetchGameScreenshots,
} from "../api/rawg";

let heroCache = null;
let heroPromise = null;

export default function useHero() {
  const [featuredGame, setFeaturedGame] = useState(
    heroCache?.featuredGame || null,
  );

  const [screenshots, setScreenshots] = useState(heroCache?.screenshots || []);

  useEffect(() => {
    if (heroCache) {
      return;
    }

    loadFeaturedGame().then((data) => {
      if (data) {
        setFeaturedGame(data.featuredGame);
        setScreenshots(data.screenshots);
      }
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

        const responses = await Promise.all(
          queries.map((query) => fetchGames(query)),
        );

        const games = responses.flatMap((data) => data.results || []);

        const uniqueGames = [
          ...new Map(
            games
              .filter((game) => game.background_image)
              .map((game) => [game.id, game]),
          ).values(),
        ];

        uniqueGames.sort(() => Math.random() - 0.5);

        const randomGame = uniqueGames[0];

        if (!randomGame) return null;

        const details = await fetchGameDetails(randomGame.id);

        const screenshotData = await fetchGameScreenshots(details.id);

        const uniqueScreenshots = [
          ...new Map(
            (screenshotData.results || [])
              .map((s) => s.image)
              .filter(Boolean)
              .map((img) => [img, img]),
          ).values(),
        ];

        heroCache = {
          featuredGame: details,
          screenshots: uniqueScreenshots,
        };

        return heroCache;
      } catch (error) {
        console.error("Featured game failed:", error);

        return null;
      } finally {
        heroPromise = null;
      }
    })();

    return heroPromise;
  }

  return {
    featuredGame,
    screenshots,
  };
}
