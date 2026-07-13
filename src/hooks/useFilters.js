import { useEffect, useState } from "react";

import { fetchGenres, fetchPlatforms } from "../api/rawg";

let filtersCache = null;
let filtersPromise = null;

export default function useFilters() {
  const [genres, setGenres] = useState(filtersCache?.genres || []);

  const [platforms, setPlatforms] = useState(filtersCache?.platforms || []);

  useEffect(() => {
    if (filtersCache) {
      return;
    }

    loadFilters();
  }, []);

  async function loadFilters() {
    if (filtersPromise) {
      const data = await filtersPromise;

      setGenres(data.genres);
      setPlatforms(data.platforms);

      return;
    }

    filtersPromise = (async () => {
      try {
        const [genreData, platformData] = await Promise.all([
          fetchGenres(),
          fetchPlatforms(),
        ]);

        const data = {
          genres: genreData.results || [],
          platforms: platformData.results || [],
        };

        filtersCache = data;

        return data;
      } catch (error) {
        console.error("Filters loading failed:", error);

        return {
          genres: [],
          platforms: [],
        };
      } finally {
        filtersPromise = null;
      }
    })();

    const data = await filtersPromise;

    setGenres(data.genres);
    setPlatforms(data.platforms);
  }

  return {
    genres,
    platforms,
  };
}
