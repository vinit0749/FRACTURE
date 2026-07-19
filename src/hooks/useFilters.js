import { useEffect, useState } from "react";

import { fetchGenres, fetchPlatforms } from "../api/fracture";

let filtersCache = null;
let filtersPromise = null;

export default function useFilters() {
  const [genres, setGenres] = useState(filtersCache?.genres || []);

  const [platforms, setPlatforms] = useState(filtersCache?.platforms || []);
  const [error, setError] = useState("");

  useEffect(() => {
    if (filtersCache) {
      setError("");
      return;
    }

    loadFilters();
  }, []);

  async function loadFilters() {
    setError("");

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
        setError("We couldn't load the filter options. Please try again.");

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

  function retry() {
    setError("");
    loadFilters();
  }

  return {
    genres,
    platforms,
    error,
    retry,
  };
}
