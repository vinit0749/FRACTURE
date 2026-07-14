import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchGames } from "../api/rawg";

const RandomGameContext = createContext();

export function RandomGameProvider({ children }) {
  const navigate = useNavigate();

  const [showRandomOverlay, setShowRandomOverlay] = useState(false);
  const [randomStatus, setRandomStatus] = useState("searching");

  async function getRandomGame() {
    try {
      setShowRandomOverlay(true);
      setRandomStatus("searching");

      const randomPage = Math.floor(Math.random() * 50) + 1;

      const data = await fetchGames(`page=${randomPage}&page_size=20`);

      if (!data?.results?.length) {
        setShowRandomOverlay(false);
        return;
      }

      const randomGame =
        data.results[Math.floor(Math.random() * data.results.length)];

      setRandomStatus("found");

      setTimeout(() => {
        setShowRandomOverlay(false);

        setTimeout(() => {
          navigate(`/game/${randomGame.id}`);
        }, 300);
      }, 1200);
    } catch (error) {
      console.error("Random game error:", error);

      setShowRandomOverlay(false);
    }
  }

  return (
    <RandomGameContext.Provider
      value={{
        getRandomGame,
        showRandomOverlay,
        randomStatus,
      }}
    >
      {children}
    </RandomGameContext.Provider>
  );
}

export function useRandomGameContext() {
  return useContext(RandomGameContext);
}
