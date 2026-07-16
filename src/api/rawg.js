const API_KEY = import.meta.env.VITE_RAWG_API_KEY;

const BASE_URL = "https://api.rawg.io/api";

// ==============================================
// GLOBAL API CACHE
// ==============================================

const apiCache = new Map();

const pendingRequests = new Map();

const CACHE_TIME = 1000 * 60 * 10; // 10 minutes

async function cachedFetch(url) {
  // Return valid cached data
  if (apiCache.has(url)) {
    const cached = apiCache.get(url);

    const expired = Date.now() - cached.time > CACHE_TIME;

    if (!expired) {
      return cached.data;
    }

    apiCache.delete(url);
  }

  // Return existing request
  if (pendingRequests.has(url)) {
    return pendingRequests.get(url);
  }

  const request = fetch(url)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`RAWG error ${response.status}`);
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
  return cachedFetch(
    `${BASE_URL}/games?key=${API_KEY}${params ? `&${params}` : ""}`,
  );
}

// ==================================================
// SEARCH AUTOCOMPLETE SUGGESTIONS
// ==================================================

export async function fetchSearchSuggestions(query) {
  const params = new URLSearchParams({
    search: query,
    page_size: 6,
  });

  return cachedFetch(`${BASE_URL}/games?key=${API_KEY}&${params.toString()}`);
}

// ==================================================
// GAME DETAILS
// ==================================================

export async function fetchGameDetails(id) {
  return cachedFetch(`${BASE_URL}/games/${id}?key=${API_KEY}`);
}

// ==================================================
// GAME SCREENSHOTS
// ==================================================

export async function fetchGameScreenshots(id) {
  return cachedFetch(`${BASE_URL}/games/${id}/screenshots?key=${API_KEY}`);
}

// ==================================================
// GENRES
// ==================================================

export async function fetchGenres() {
  return cachedFetch(`${BASE_URL}/genres?key=${API_KEY}`);
}

// ==================================================
// PLATFORMS
// ==================================================

export async function fetchPlatforms() {
  return cachedFetch(`${BASE_URL}/platforms/lists/parents?key=${API_KEY}`);
}

// ==================================================
// GAME TRAILERS
// ==================================================

export async function fetchGameTrailers(id) {
  return cachedFetch(`${BASE_URL}/games/${id}/movies?key=${API_KEY}`);
}

// ==================================================
// SIMILAR GAMES
// ==================================================

export async function fetchSimilarGames(params = "") {
  return cachedFetch(
    `${BASE_URL}/games?key=${API_KEY}${params ? `&${params}` : ""}`,
  );
}
