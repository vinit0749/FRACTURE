import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.RAWG_API_KEY;

const BASE_URL = "https://api.rawg.io/api";

// ===================================
// Cache
// ===================================

const cache = new Map();

// Prevent duplicate simultaneous requests
const pendingRequests = new Map();

const CACHE_TIME = 1000 * 60 * 10; // 10 minutes

async function fractureFetch(endpoint = "") {
  const url = `${BASE_URL}${endpoint}${
    endpoint.includes("?") ? "&" : "?"
  }key=${API_KEY}`;

  // Return cached response
  if (cache.has(url)) {
    const cached = cache.get(url);

    if (Date.now() - cached.time < CACHE_TIME) {
      return cached.data;
    }

    cache.delete(url);
  }

  // Return pending request if already fetching
  if (pendingRequests.has(url)) {
    return pendingRequests.get(url);
  }

  const request = fetch(url)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`RAWG error ${response.status}`);
      }

      const data = await response.json();

      cache.set(url, {
        data,
        time: Date.now(),
      });

      pendingRequests.delete(url);

      return data;
    })
    .catch((error) => {
      pendingRequests.delete(url);
      throw error;
    });

  pendingRequests.set(url, request);

  return request;
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
