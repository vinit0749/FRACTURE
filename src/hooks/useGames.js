import { useEffect, useState } from "react";
import { fetchGames } from "../api/fracture";
import { isSafeGame } from "../utils/gameFilter";

function rankSearchResults(games, query) {
  const search = query.toLowerCase().trim();

  return [...games].sort(
    (a, b) => getSearchScore(b, search) - getSearchScore(a, search),
  );
}

function getSearchScore(game, search) {
  const name = game.name.toLowerCase();

  let score = 0;

  if (name === search) score += 10000;

  if (name.startsWith(search)) score += 5000;

  if (name.split(" ").includes(search)) score += 3000;

  search.split(" ").forEach((part) => {
    if (name.includes(part)) score += 500;
  });

  score += (game.rating || 0) * 2;

  return score;
}

const gamesCache = new Map();

export default function useGames({
  page,
  search,
  sort,
  genre,
  platform,
  section,
  setTotalPages,
}) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadGames() {
    setLoading(true);
    setError("");

    try {
      const cacheKey = JSON.stringify({
        page,
        search,
        sort,
        genre,
        platform,
        section,
      });

      if (gamesCache.has(cacheKey)) {
        const cached = gamesCache.get(cacheKey);

        setGames(cached.results);

        setTotalPages?.(cached.totalPages);

        setLoading(false);

        return;
      }

      const params = new URLSearchParams();

      params.append("page", page);

      params.append("page_size", 40);

      if (search) {
        params.append("search", search.trim().toLowerCase());
        params.append("search_exact", false);
      }

      let ordering = sort;

      if (section === "top-rated") {
        ordering = "-rating";
      }

      if (section === "trending") {
        ordering = "-added";

        const today = new Date();

        const oneYearAgo = new Date();

        oneYearAgo.setFullYear(today.getFullYear() - 1);

        params.append(
          "dates",
          `${oneYearAgo.toISOString().split("T")[0]},${today.toISOString().split("T")[0]}`,
        );
      }

      if (section === "new-releases") {
        ordering = "-released";

        const today = new Date();

        const oneYearAgo = new Date();

        oneYearAgo.setFullYear(today.getFullYear() - 1);

        params.append(
          "dates",
          `${oneYearAgo.toISOString().split("T")[0]},${today.toISOString().split("T")[0]}`,
        );
      }

      params.append("ordering", ordering);

      if (genre) {
        params.append("genres", genre);
      }

      if (platform) {
        params.append("platforms", platform);
      }

      const data = await fetchGames(`&${params.toString()}`);

      const totalPages = 100;

      setTotalPages?.(100);

      let results = data.results || [];
      results = results.filter(isSafeGame);

      if (search) {
        results = rankSearchResults(results, search);
      }

      results = results.slice(0, 20);

      gamesCache.set(cacheKey, {
        results,
        totalPages,
      });

      setGames(results);
      setError("");
    } catch (err) {
      console.error("Failed loading games:", err);

      setGames([]);
      setError("We couldn't load games right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGames();
  }, [page, search, sort, genre, platform, section, setTotalPages]);

  return {
    games,
    loading,
    error,
    retry: loadGames,
  };
}
