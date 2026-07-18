import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.RAWG_API_KEY;

const BASE_URL = "https://api.rawg.io/api";

async function fractureFetch(endpoint = "") {
  const url = `${BASE_URL}${endpoint}${
    endpoint.includes("?") ? "&" : "?"
  }key=${API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`RAWG error ${response.status}`);
  }

  return response.json();
}

// ================================
// Games
// ================================

export async function getGames(params = "") {
  return fractureFetch(`/games${params ? `?${params}` : ""}`);
}

// ================================
// Single Game Details
// ================================

export async function getGameDetails(id) {
  return fractureFetch(`/games/${id}`);
}

// ================================
// Game Screenshots
// ================================

export async function getGameScreenshots(id) {
  return fractureFetch(`/games/${id}/screenshots`);
}

// ================================
// Game Trailers
// ================================

export async function getGameTrailers(id) {
  return fractureFetch(`/games/${id}/movies`);
}

// ================================
// Genres
// ================================

export async function getGenres() {
  return fractureFetch(`/genres`);
}

// ================================
// Platforms
// ================================

export async function getPlatforms() {
  return fractureFetch(`/platforms/lists/parents`);
}

// ================================
// Similar Games
// ================================

export async function getSimilarGames(params = "") {
  return fractureFetch(`/games${params ? `?${params}` : ""}`);
}
