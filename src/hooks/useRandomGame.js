import { useState } from "react";

import { fetchGames } from "../api/rawg";

function useRandomGame() {
  const [loadingRandom, setLoadingRandom] = useState(false);

  async function getRandomGame() {
    try {
      setLoadingRandom(true);

      const randomPage = Math.floor(Math.random() * 50) + 1;

      const data = await fetchGames(`page=${randomPage}&page_size=20`);

      if (!data?.results?.length) {
        setLoadingRandom(false);
        return null;
      }

      const randomGame =
        data.results[Math.floor(Math.random() * data.results.length)];

      setLoadingRandom(false);

      return randomGame;
    } catch (error) {
      console.error("Random game error:", error);

      setLoadingRandom(false);

      return null;
    }
  }

  return {
    getRandomGame,
    loadingRandom,
  };
}

export default useRandomGame;
