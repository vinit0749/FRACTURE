import { useEffect, useState } from "react";

import {
  fetchGames,
  fetchGameDetails,
  fetchGameScreenshots,
} from "../api/rawg";

let heroCache = null;
let heroLoading = false;

export default function useHero() {
  const [featuredGame, setFeaturedGame] = useState(
    heroCache?.featuredGame || null,
  );

  const [screenshots, setScreenshots] = useState(heroCache?.screenshots || []);

  useEffect(() => {
    if (heroCache || heroLoading) return;

    loadFeaturedGame();
  }, []);

  async function loadFeaturedGame() {
    heroLoading = true;

    try {
      const pools = [];

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

      responses.forEach((data) => {
        if (data.results) {
          pools.push(...data.results);
        }
      });

      const uniqueGamesMap = new Map();

      pools.forEach((game) => {
        if (game.background_image) {
          uniqueGamesMap.set(game.id, game);
        }
      });

      const uniqueGames = [...uniqueGamesMap.values()];

      // Same random selection behaviour as vanilla
      uniqueGames.sort(() => Math.random() - 0.5);

      const randomGame = uniqueGames[0];

      if (!randomGame) {
        heroLoading = false;
        return;
      }

      // Full details request
      const details = await fetchGameDetails(randomGame.id);

      // Screenshot request
      const screenshotData = await fetchGameScreenshots(details.id);

      const uniqueScreenshots = [
        ...new Map(
          (screenshotData.results || [])
            .map((s) => s.image)
            .filter(Boolean)
            .map((img) => [img, img]),
        ).values(),
      ];

      // Save cache
      heroCache = {
        featuredGame: details,
        screenshots: uniqueScreenshots,
      };

      setFeaturedGame(details);
      setScreenshots(uniqueScreenshots);
    } catch (error) {
      console.error("Featured game failed:", error);
    } finally {
      heroLoading = false;
    }
  }

  return {
    featuredGame,
    screenshots,
  };
}
