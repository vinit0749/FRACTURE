import { useEffect, useState } from "react";

import {
  fetchGameDetails,
  fetchGameScreenshots,
  fetchGameTrailer,
} from "../api/fracture";

export default function useGameDetails(id) {
  const [game, setGame] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [trailer, setTrailer] = useState(null);
  const [similarGames, setSimilarGames] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadGame() {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      // ==========================================
      // GAME DETAILS
      // ==========================================

      const gameData = await fetchGameDetails(id);

      setGame(gameData);

      // ==========================================
      // SCREENSHOTS + TRAILER
      // ==========================================

      const [shots, trailerData] = await Promise.all([
        fetchGameScreenshots(id).catch((err) => {
          console.warn("Failed to fetch screenshots:", err);
          return { results: [] };
        }),
        fetchGameTrailer(gameData.name).catch((err) => {
          console.warn("Failed to fetch YouTube trailer:", err);
          return null;
        }),
      ]);

      setScreenshots(shots?.results || []);
      setTrailer(trailerData?.trailer || null);

      // ==========================================
      // SIMILAR GAMES
      // ==========================================
      //
      // IGDB provides an actual `similar_games`
      // relationship for games.
      //
      // We no longer generate "similar" games by:
      // - matching genres
      // - matching developers
      // - adding random popular games
      //
      // This gives us genuine IGDB similarity data.
      // ==========================================

      const similar = Array.isArray(gameData.similar_games)
        ? gameData.similar_games
        : [];

      const uniqueGames = new Map();

      similar.forEach((similarGame) => {
        if (similarGame && similarGame.id && similarGame.id !== gameData.id) {
          uniqueGames.set(similarGame.id, similarGame);
        }
      });

      setSimilarGames([...uniqueGames.values()].slice(0, 6));
    } catch (err) {
      console.error(err);

      setGame(null);
      setScreenshots([]);
      setTrailer(null);
      setSimilarGames([]);

      setError("We couldn't load this game right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGame();
  }, [id]);

  return {
    game,
    screenshots,
    trailer,
    similarGames,
    loading,
    error,
    retry: loadGame,
  };
}
