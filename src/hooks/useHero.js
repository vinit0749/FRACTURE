import { useEffect, useRef, useState } from "react";

import {
  fetchGames,
  fetchGameDetails,
  fetchGameScreenshots,
} from "../api/rawg";

export default function useHero() {
  const [featuredGame, setFeaturedGame] = useState(null);
  const loaded = useRef(false);
  const [screenshots, setScreenshots] = useState([]);

  useEffect(() => {
    if (loaded.current) return;

    loaded.current = true;

    loadFeaturedGame();
  }, []);

  async function loadFeaturedGame() {
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

      const randomGame =
        uniqueGames[Math.floor(Math.random() * uniqueGames.length)];

      if (!randomGame) return;

      const details = await fetchGameDetails(randomGame.id);

      setFeaturedGame(details);

      const screenshotData = await fetchGameScreenshots(details.id);

      const uniqueScreenshots = [
        ...new Map(
          (screenshotData.results || [])
            .map((s) => s.image)
            .filter(Boolean)
            .map((img) => [img, img]),
        ).values(),
      ];

      setScreenshots(uniqueScreenshots);
    } catch (error) {
      console.error("Featured game failed:", error);
    }
  }

  return {
    featuredGame,
    screenshots,
  };
}
