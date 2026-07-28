import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.RAWG_API_KEY;

if (!API_KEY) {
  throw new Error("Missing required environment variable: RAWG_API_KEY");
}

const BASE_URL = "https://api.rawg.io/api";

const CACHE_TIME = 1000 * 60 * 10; // 10 minutes
const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_CACHE_ENTRIES = 500;
const MAX_ENDPOINT_LENGTH = 2000;

// ===================================
// Error Helper
// ===================================

function createError(message, details = {}, status = 500) {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
}

// ===================================
// Cache
// ===================================

const cache = new Map();

// Prevent duplicate simultaneous requests
const pendingRequests = new Map();

// ===================================
// Cache Helpers
// ===================================

function setCache(key, data) {
  // Remove the oldest cache entry if the cache is full
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;

    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }

  cache.set(key, {
    data,
    time: Date.now(),
  });
}

// ===================================
// RAWG API Fetch
// ===================================

async function fractureFetch(endpoint = "") {
  if (!API_KEY) {
    throw createError("Missing RAWG API configuration", {}, 500);
  }

  if (typeof endpoint !== "string") {
    throw createError("Invalid RAWG endpoint", {}, 400);
  }

  if (endpoint.length > MAX_ENDPOINT_LENGTH) {
    throw createError("RAWG request is too large", {}, 400);
  }

  // Cache key deliberately excludes the API key
  const cacheKey = endpoint;

  const url = `${BASE_URL}${endpoint}${
    endpoint.includes("?") ? "&" : "?"
  }key=${API_KEY}`;

  // ===================================
  // Return cached response
  // ===================================

  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);

    if (Date.now() - cached.time < CACHE_TIME) {
      return cached.data;
    }

    cache.delete(cacheKey);
  }

  // ===================================
  // Return existing pending request
  // ===================================

  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  // ===================================
  // Create request with timeout
  // ===================================

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT);

  const request = fetch(url, {
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const detail =
          response.status >= 500
            ? "RAWG upstream failure"
            : "Invalid RAWG request";

        throw createError(
          `RAWG error ${response.status}`,
          { detail },
          response.status,
        );
      }

      const data = await response.json();

      setCache(cacheKey, data);

      return data;
    })
    .catch((error) => {
      if (error.name === "AbortError") {
        throw createError(
          "RAWG request timed out",
          {
            detail: "RAWG upstream request exceeded the timeout limit.",
          },
          504,
        );
      }

      throw error;
    })
    .finally(() => {
      clearTimeout(timeout);
      pendingRequests.delete(cacheKey);
    });

  pendingRequests.set(cacheKey, request);

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
  return fractureFetch("/genres");
}

// ================================
// Platforms
// ================================

export async function getPlatforms() {
  return fractureFetch("/platforms");
}

// ================================
// Similar Games
// ================================

export async function getSimilarGames(params = "") {
  return fractureFetch(`/games${params ? `?${params}` : ""}`);
}
