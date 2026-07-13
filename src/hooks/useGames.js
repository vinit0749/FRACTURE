import { useEffect, useState } from "react";
import { fetchGames } from "../api/rawg";

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

// cache already loaded pages
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

  useEffect(() => {
    const controller = new AbortController();

    async function loadGames() {
      setLoading(true);

      try {
        const cacheKey = JSON.stringify({
          page,
          search,
          sort,
          genre,
          platform,
          section,
        });

        // use cached result if available
        if (gamesCache.has(cacheKey)) {
          const cached = gamesCache.get(cacheKey);

          setGames(cached.results);

          if (setTotalPages) {
            setTotalPages(cached.totalPages);
          }

          setLoading(false);

          return;
        }

        const params = new URLSearchParams();

        params.append("page", page);

        params.append("page_size", search ? 40 : 20);

        if (search) {
          params.append("search", search.trim().toLowerCase());

          params.append("search_exact", false);
        }

        let ordering = sort;

        if (section === "top-rated") {
          ordering = "-rating";
        }

        if (section === "new-releases") {
          ordering = "-added";

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

        const data = await fetchGames(
          `&${params.toString()}`,
          controller.signal,
        );

        let totalPages = 1;

        if (data.count) {
          totalPages = Math.ceil(data.count / 20);

          if (setTotalPages) {
            setTotalPages(totalPages);
          }
        }

        let results = data.results || [];

        if (section === "new-releases") {
          results = results.filter((game) => game.background_image);
        }

        if (search) {
          results = rankSearchResults(results, search);
        }

        gamesCache.set(cacheKey, {
          results,
          totalPages,
        });

        setGames(results);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed loading games:", error);

          setGames([]);
        }
      } finally {
        setLoading(false);
      }
    }

    loadGames();

    return () => {
      controller.abort();
    };
  }, [page, search, sort, genre, platform, section, setTotalPages]);

  return {
    games,
    loading,
  };
}
