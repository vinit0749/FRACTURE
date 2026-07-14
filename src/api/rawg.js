const API_KEY = import.meta.env.VITE_RAWG_API_KEY;

const BASE_URL = "https://api.rawg.io/api";

export async function fetchGames(params = "", signal) {
  const response = await fetch(
    `${BASE_URL}/games?key=${API_KEY}${params ? `&${params}` : ""}`,
    { signal },
  );

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

export async function fetchGenres() {
  const response = await fetch(`${BASE_URL}/genres?key=${API_KEY}`);

  if (!response.ok) {
    throw new Error("Failed to fetch genres");
  }

  return response.json();
}

export async function fetchPlatforms() {
  const response = await fetch(
    `${BASE_URL}/platforms/lists/parents?key=${API_KEY}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch platforms");
  }

  return response.json();
}

export async function fetchGameTrailers(id) {
  const response = await fetch(`${BASE_URL}/games/${id}/movies?key=${API_KEY}`);

  if (!response.ok) {
    throw new Error("Failed to fetch trailers");
  }

  return response.json();
}

export async function fetchSimilarGames(params = "") {
  const response = await fetch(
    `${BASE_URL}/games?key=${API_KEY}${params ? `&${params}` : ""}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch similar games");
  }

  return response.json();
}
