const API_KEY = import.meta.env.VITE_RAWG_API_KEY;

const BASE_URL = "https://api.rawg.io/api";

export async function fetchGames(params = "") {
  const response = await fetch(`${BASE_URL}/games?key=${API_KEY}${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch games");
  }

  return response.json();
}

export async function fetchGameDetails(id) {
  const response = await fetch(`${BASE_URL}/games/${id}?key=${API_KEY}`);

  if (!response.ok) {
    throw new Error("Failed to fetch game details");
  }

  return response.json();
}

export async function fetchGameScreenshots(id) {
  const response = await fetch(
    `${BASE_URL}/games/${id}/screenshots?key=${API_KEY}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch screenshots");
  }

  return response.json();
}
