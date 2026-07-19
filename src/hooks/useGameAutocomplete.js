import { useEffect, useRef, useState } from "react";
import { fetchSearchSuggestions } from "../api/fracture";

const suggestionCache = new Map();

export default function useGameAutocomplete(query) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const debounceTimer = useRef(null);

  useEffect(() => {
    const search = query.trim().toLowerCase();

    // Clear old suggestions for empty input
    if (search.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setError("");
      return;
    }

    // Cache hit
    if (suggestionCache.has(search)) {
      setSuggestions(suggestionCache.get(search));
      setLoading(false);
      setError("");
      return;
    }

    clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const data = await fetchSearchSuggestions(search);

        const results = data.results || [];

        const cleanedResults = results
          .filter((game) => game.background_image)
          .slice(0, 6);

        suggestionCache.set(search, cleanedResults);

        setSuggestions(cleanedResults);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Autocomplete failed:", error);
          setSuggestions([]);
          setError("Suggestions are temporarily unavailable.");
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(debounceTimer.current);
    };
  }, [query]);

  return {
    suggestions,
    loading,
    error,
  };
}
