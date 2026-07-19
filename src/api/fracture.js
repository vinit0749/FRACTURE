const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// ==============================================
// GLOBAL API CACHE
// ==============================================

const apiCache = new Map();

const pendingRequests = new Map();

const CACHE_TIME = 1000 * 60 * 10; // 10 minutes

async function cachedFetch(url) {
  // Cache hit
  if (apiCache.has(url)) {
    const cached = apiCache.get(url);

    const expired = Date.now() - cached.time > CACHE_TIME;

    if (!expired) {
      return cached.data;
    }

    apiCache.delete(url);
  }

  // Duplicate request protection
  if (pendingRequests.has(url)) {
    return pendingRequests.get(url);
  }

  const request = fetch(url)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`FRACTURE backend error ${response.status}`);
      }

      const data = await response.json();

      apiCache.set(url, {
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

// ==================================================
// FETCH GAMES
// ==================================================

export async function fetchGames(params = "") {
  return cachedFetch(`${BASE_URL}/games${params ? `?${params}` : ""}`);
}

// ==================================================
// SEARCH AUTOCOMPLETE
// ==================================================

export async function fetchSearchSuggestions(query) {
  const params = new URLSearchParams({
    search: query,
    page_size: 6,
  });

  return cachedFetch(`${BASE_URL}/games?${params.toString()}`);
}

// ==================================================
// GAME DETAILS
// ==================================================

export async function fetchGameDetails(id) {
  return cachedFetch(`${BASE_URL}/games/${id}`);
}

// ==================================================
// SCREENSHOTS
// ==================================================

export async function fetchGameScreenshots(id) {
  return cachedFetch(`${BASE_URL}/games/${id}/screenshots`);
}

// ==================================================
// GENRES
// ==================================================

export async function fetchGenres() {
  return cachedFetch(`${BASE_URL}/games/genres`);
}

// ==================================================
// PLATFORMS
// ==================================================

export async function fetchPlatforms() {
  return cachedFetch(`${BASE_URL}/games/platforms`);
}

// ==================================================
// TRAILERS
// ==================================================

export async function fetchGameTrailers(id) {
  return cachedFetch(`${BASE_URL}/games/${id}/movies`);
}

// ==================================================
// SIMILAR GAMES
// ==================================================

export async function fetchSimilarGames(params = "") {
  return cachedFetch(`${BASE_URL}/games${params ? `?${params}` : ""}`);
}
