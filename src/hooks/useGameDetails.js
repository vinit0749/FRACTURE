import { useEffect, useState } from "react";

import {
  fetchGameDetails,
  fetchGameScreenshots,
  fetchGameTrailers,
  fetchSimilarGames,
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

      const gameData = await fetchGameDetails(id);

      setGame(gameData);

      const [shots, trailers] = await Promise.all([
        fetchGameScreenshots(id),
        fetchGameTrailers(id),
      ]);

      setScreenshots(shots.results || []);
      setTrailer(trailers.results?.[0] || null);

      /* ================= SIMILAR GAMES ================= */

      const genreIds = gameData.genres?.map((genre) => genre.id).join(",");

      const developerId = gameData.developers?.[0]?.id;

      const requests = [];

      // Same Genres
      if (genreIds) {
        requests.push(fetchSimilarGames(`genres=${genreIds}&page_size=20`));
      }

      // Same Developer
      if (developerId) {
        requests.push(
          fetchSimilarGames(`developers=${developerId}&page_size=20`),
        );
      }

      // Popular Games
      requests.push(fetchSimilarGames(`ordering=-added&page_size=20`));

      const results = await Promise.all(requests);

      const uniqueGames = new Map();

      results.forEach((response) => {
        response.results?.forEach((game) => {
          if (game.id !== gameData.id) {
            uniqueGames.set(game.id, game);
          }
        });
      });

      const shuffled = [...uniqueGames.values()]
        .sort(() => Math.random() - 0.5)
        .slice(0, 6);

      setSimilarGames(shuffled);
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
