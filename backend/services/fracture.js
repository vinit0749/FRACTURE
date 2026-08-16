import dotenv from "dotenv";

dotenv.config();

// ==============================================
// IGDB CONFIGURATION
// ==============================================

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error(
    "Missing required environment variables: TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET",
  );
}

const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const IGDB_BASE_URL = "https://api.igdb.com/v4";

const CACHE_TIME = 1000 * 60 * 10;
const REQUEST_TIMEOUT = 10000;
const MAX_CACHE_ENTRIES = 500;

const IGDB_REQUEST_INTERVAL = 300;
const MAX_RATE_LIMIT_COOLDOWN = 10000;

// ==============================================
// ERROR HELPER
// ==============================================

function createError(message, details = {}, status = 500) {
  const error = new Error(message);

  error.status = status;
  error.details = details;

  return error;
}

// ==============================================
// CACHE
// ==============================================

const cache = new Map();
const pendingRequests = new Map();

// ==============================================
// IGDB REQUEST QUEUE
// ==============================================

let igdbQueue = Promise.resolve();
let nextIGDBRequestAt = 0;
let rateLimitUntil = 0;

// ==============================================
// IGDB TOKEN CACHE
// ==============================================

let accessToken = null;
let tokenExpiresAt = 0;

// ==============================================
// CACHE HELPERS
// ==============================================

function setCache(key, data) {
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

// ==============================================
// GET TWITCH ACCESS TOKEN
// ==============================================

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT);

  try {
    const params = new URLSearchParams();

    params.set("client_id", CLIENT_ID);
    params.set("client_secret", CLIENT_SECRET);
    params.set("grant_type", "client_credentials");

    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw createError(
        `Twitch authentication failed with status ${response.status}`,
        {
          detail: errorText || "Unable to obtain Twitch access token.",
        },
        response.status,
      );
    }

    const data = await response.json();

    if (!data.access_token) {
      throw createError(
        "Twitch authentication returned no access token.",
        {},
        502,
      );
    }

    accessToken = data.access_token;

    const expiresIn = Number(data.expires_in) || 0;

    tokenExpiresAt = Date.now() + Math.max(expiresIn - 60, 60) * 1000;

    return accessToken;
  } catch (error) {
    if (error.name === "AbortError") {
      throw createError(
        "Twitch authentication request timed out.",
        {
          detail: "The Twitch OAuth request exceeded the timeout limit.",
        },
        504,
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// ==============================================
// DELAY
// ==============================================

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==============================================
// RAW IGDB REQUEST
// ==============================================

async function makeIGDBRequest(endpoint, query, token) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT);

  try {
    return await fetch(`${IGDB_BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Client-ID": CLIENT_ID,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: query,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw createError(
        "IGDB request timed out.",
        {
          detail: "The IGDB upstream request exceeded the timeout limit.",
        },
        504,
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// ==============================================
// RATE-LIMITED IGDB REQUEST
// ==============================================

function queueIGDBRequest(endpoint, query, token) {
  const queuedRequest = igdbQueue.then(async () => {
    let cooldownWait = Math.max(0, rateLimitUntil - Date.now());

    if (cooldownWait > 0) {
      console.warn(
        `IGDB rate-limit cooldown active. Waiting ${cooldownWait}ms...`,
      );

      await wait(cooldownWait);
    }

    let spacingWait = Math.max(0, nextIGDBRequestAt - Date.now());

    if (spacingWait > 0) {
      await wait(spacingWait);
    }

    nextIGDBRequestAt = Date.now() + IGDB_REQUEST_INTERVAL;

    let response = await makeIGDBRequest(endpoint, query, token);

    if (response.status === 429) {
      const retryAfterHeader = response.headers.get("retry-after");

      const retryAfterSeconds = Number(retryAfterHeader);

      const retryDelay =
        Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
          ? Math.min(retryAfterSeconds * 1000, MAX_RATE_LIMIT_COOLDOWN)
          : 5000;

      rateLimitUntil = Math.max(rateLimitUntil, Date.now() + retryDelay);

      console.warn(
        `IGDB rate limit reached. Cooling down for ${retryDelay}ms...`,
      );

      await wait(retryDelay);

      cooldownWait = Math.max(0, rateLimitUntil - Date.now());

      if (cooldownWait > 0) {
        await wait(cooldownWait);
      }

      spacingWait = Math.max(0, nextIGDBRequestAt - Date.now());

      if (spacingWait > 0) {
        await wait(spacingWait);
      }

      nextIGDBRequestAt = Date.now() + IGDB_REQUEST_INTERVAL;

      response = await makeIGDBRequest(endpoint, query, token);
    }

    return response;
  });

  igdbQueue = queuedRequest.catch(() => {});

  return queuedRequest;
}

// ==============================================
// IGDB API FETCH
// ==============================================

async function fractureFetch(endpoint, query) {
  if (typeof endpoint !== "string" || !endpoint.trim()) {
    throw createError("Invalid IGDB endpoint.", {}, 400);
  }

  if (typeof query !== "string" || !query.trim()) {
    throw createError("Invalid IGDB query.", {}, 400);
  }

  const cacheKey = `${endpoint}:${query}`;

  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);

    if (Date.now() - cached.time < CACHE_TIME) {
      return cached.data;
    }

    cache.delete(cacheKey);
  }

  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  const request = (async () => {
    try {
      let token = await getAccessToken();

      let response = await queueIGDBRequest(endpoint, query, token);

      if (response.status === 401) {
        accessToken = null;
        tokenExpiresAt = 0;

        token = await getAccessToken();

        response = await queueIGDBRequest(endpoint, query, token);
      }

      if (!response.ok) {
        const errorText = await response.text();

        console.error(`IGDB ${response.status} ERROR`);
        console.error("Endpoint:", endpoint);
        console.error("Query:", query);
        console.error("Response:", errorText);

        const detail =
          errorText || `IGDB upstream returned status ${response.status}.`;

        throw createError(
          `IGDB error ${response.status}`,
          {
            detail,
            endpoint,
            query,
          },
          response.status,
        );
      }

      const data = await response.json();

      setCache(cacheKey, data);

      return data;
    } catch (error) {
      if (error.name === "AbortError") {
        throw createError(
          "IGDB request timed out.",
          {
            detail: "The IGDB upstream request exceeded the timeout limit.",
          },
          504,
        );
      }

      throw error;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, request);

  return request;
}

// ==============================================
// IMAGE HELPERS
// ==============================================

function buildIGDBImageUrl(url, size) {
  if (!url) {
    return null;
  }

  let imageUrl = url;

  if (imageUrl.startsWith("//")) {
    imageUrl = `https:${imageUrl}`;
  } else if (imageUrl.startsWith("http://")) {
    imageUrl = imageUrl.replace("http://", "https://");
  } else if (!imageUrl.startsWith("https://")) {
    imageUrl = `https:${imageUrl}`;
  }

  return imageUrl.replace(/\/t_[^/]+(?=\/)/, `/${size}`);
}

function getCoverUrl(cover, size = "t_cover_big") {
  return buildIGDBImageUrl(cover?.url, size);
}

function getScreenshotUrl(screenshot, size = "t_screenshot_big") {
  return buildIGDBImageUrl(screenshot?.url, size);
}

// ==============================================
// WEBSITE HELPERS
// ==============================================

function normalizeWebsites(websites) {
  if (!Array.isArray(websites)) {
    return [];
  }

  return websites
    .filter((website) => website?.url)
    .map((website) => ({
      id: website.id ?? null,
      url: website.url,
      category: website.category ?? null,
      trusted: website.trusted ?? false,
    }));
}

// ==============================================
// PLATFORM NORMALIZER
// ==============================================

function normalizePlatforms(platforms) {
  if (!Array.isArray(platforms)) {
    return [];
  }

  return platforms
    .filter((platform) => platform && typeof platform === "object")
    .map((platform) => ({
      platform: {
        id: platform.id ?? null,
        name: platform.name || "Unknown Platform",
        slug: platform.slug || null,
        abbreviation: platform.abbreviation || null,
      },
    }));
}

// ==============================================
// GENRE NORMALIZER
// ==============================================

function normalizeGenres(genres) {
  if (!Array.isArray(genres)) {
    return [];
  }

  return genres
    .filter((genre) => genre && typeof genre === "object" && genre.name)
    .map((genre) => ({
      id: genre.id ?? null,
      name: genre.name,
      slug: genre.slug || null,
    }));
}

// ==============================================
// THEME NORMALIZER
// ==============================================

function normalizeThemes(themes) {
  if (!Array.isArray(themes)) {
    return [];
  }

  return themes
    .filter((theme) => theme && typeof theme === "object" && theme.name)
    .map((theme) => ({
      id: theme.id ?? null,
      name: theme.name,
      slug: theme.slug || null,
    }));
}

// ==============================================
// KEYWORD NORMALIZER
// ==============================================

function normalizeKeywords(keywords) {
  if (!Array.isArray(keywords)) {
    return [];
  }

  return keywords
    .filter((keyword) => keyword && typeof keyword === "object" && keyword.name)
    .map((keyword) => ({
      id: keyword.id ?? null,
      name: keyword.name,
      slug: keyword.slug || null,
    }));
}

// ==============================================
// COMPANY NORMALIZER
// ==============================================

function normalizeCompanies(involvedCompanies) {
  if (!Array.isArray(involvedCompanies)) {
    return [];
  }

  return involvedCompanies
    .filter((company) => company?.company?.name)
    .map((company) => ({
      id: company.company.id ?? null,
      name: company.company.name,
    }));
}

// ==============================================
// DEVELOPER NORMALIZER
// ==============================================

function normalizeDevelopers(involvedCompanies) {
  if (!Array.isArray(involvedCompanies)) {
    return [];
  }

  return involvedCompanies
    .filter((company) => company?.developer && company?.company?.name)
    .map((company) => ({
      id: company.company.id ?? null,
      name: company.company.name,
    }));
}

// ==============================================
// PUBLISHER NORMALIZER
// ==============================================

function normalizePublishers(involvedCompanies) {
  if (!Array.isArray(involvedCompanies)) {
    return [];
  }

  return involvedCompanies
    .filter((company) => company?.publisher && company?.company?.name)
    .map((company) => ({
      id: company.company.id ?? null,
      name: company.company.name,
    }));
}

// ==============================================
// DATE NORMALIZER
// ==============================================

function normalizeReleaseDate(timestamp) {
  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
    return null;
  }

  try {
    return new Date(timestamp * 1000).toISOString().split("T")[0];
  } catch {
    return null;
  }
}

// ==============================================
// RATING NORMALIZER
// ==============================================

function normalizeRating(rating) {
  if (typeof rating !== "number" || !Number.isFinite(rating)) {
    return null;
  }

  return Number((rating / 20).toFixed(2));
}

// ==============================================
// IGDB AGGREGATED RATING NORMALIZER
// ==============================================

function normalizeAggregatedRating(rating) {
  if (typeof rating !== "number" || !Number.isFinite(rating)) {
    return null;
  }

  return Number(rating.toFixed(1));
}

// ==============================================
// SIMILAR GAME NORMALIZER
// ==============================================

function normalizeSimilarGame(game) {
  if (!game || typeof game !== "object") {
    return null;
  }

  const coverImage = getCoverUrl(game.cover, "t_cover_big");
  const backgroundImage = getCoverUrl(game.cover, "t_1080p");

  return {
    id: game.id,

    name: game.name || "Unknown Game",

    slug:
      game.slug ||
      game.name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") ||
      String(game.id),

    background_image: backgroundImage || coverImage || null,
    backgroundImage: backgroundImage || coverImage || null,
    cover_image: coverImage || backgroundImage || null,
    image: coverImage || backgroundImage || null,

    rating: normalizeRating(game.rating),
    rating_top: normalizeRating(game.rating),

    ratings_count:
      typeof game.total_rating_count === "number" ? game.total_rating_count : 0,

    aggregated_rating: normalizeAggregatedRating(game.aggregated_rating),

    aggregated_rating_count:
      typeof game.aggregated_rating_count === "number"
        ? game.aggregated_rating_count
        : 0,

    released: normalizeReleaseDate(game.first_release_date),
    first_release_date: normalizeReleaseDate(game.first_release_date),

    genres: normalizeGenres(game.genres),
    platforms: normalizePlatforms(game.platforms),

    developers: normalizeDevelopers(game.involved_companies),

    rawg_id: null,
    igdb_id: game.id,
  };
}

// ==============================================
// NORMALIZE GAME
// ==============================================

function normalizeGame(game) {
  if (!game || typeof game !== "object") {
    return null;
  }

  const coverImage = getCoverUrl(game.cover, "t_cover_big");
  const backgroundImage = getCoverUrl(game.cover, "t_1080p");

  const screenshots = Array.isArray(game.screenshots)
    ? game.screenshots
        .filter((screenshot) => screenshot?.url)
        .map((screenshot) => ({
          id: screenshot.id ?? null,
          image: getScreenshotUrl(screenshot, "t_screenshot_big"),
          thumbnail: getScreenshotUrl(screenshot, "t_screenshot_med"),
          width: screenshot.width ?? null,
          height: screenshot.height ?? null,
        }))
    : [];

  const developers = normalizeDevelopers(game.involved_companies);
  const publishers = normalizePublishers(game.involved_companies);

  const similarGames = Array.isArray(game.similar_games)
    ? game.similar_games.map(normalizeSimilarGame).filter(Boolean)
    : [];

  return {
    id: game.id,

    name: game.name || "Unknown Game",

    slug:
      game.slug ||
      game.name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") ||
      String(game.id),

    background_image: backgroundImage || coverImage || null,
    backgroundImage: backgroundImage || coverImage || null,
    cover_image: coverImage || backgroundImage || null,
    image: coverImage || backgroundImage || null,

    rating: normalizeRating(game.rating),
    rating_top: normalizeRating(game.rating),

    ratings_count:
      typeof game.total_rating_count === "number" ? game.total_rating_count : 0,

    aggregated_rating: normalizeAggregatedRating(game.aggregated_rating),

    aggregated_rating_count:
      typeof game.aggregated_rating_count === "number"
        ? game.aggregated_rating_count
        : 0,

    released: normalizeReleaseDate(game.first_release_date),
    first_release_date: normalizeReleaseDate(game.first_release_date),

    genres: normalizeGenres(game.genres),
    platforms: normalizePlatforms(game.platforms),

    themes: normalizeThemes(game.themes),
    keywords: normalizeKeywords(game.keywords),

    summary: game.summary || "",
    description_raw: game.summary || "",
    storyline: game.storyline || "",

    developers,
    publishers,

    screenshots,

    websites: normalizeWebsites(game.websites),

    similar_games: similarGames,

    rawg_id: null,
    igdb_id: game.id,
  };
}

// ==============================================
// GAMES
// ==============================================

export async function getGames(query = "") {
  const fields = `
    id,
    name,
    slug,
    summary,
    storyline,
    first_release_date,
    rating,
    total_rating_count,
    aggregated_rating,
    aggregated_rating_count,
    cover.url,

    genres.id,
    genres.name,
    genres.slug,

    platforms.id,
    platforms.name,
    platforms.slug,
    platforms.abbreviation,

    themes.id,
    themes.name,
    themes.slug,

    keywords.id,
    keywords.name,
    keywords.slug,

    involved_companies.developer,
    involved_companies.publisher,
    involved_companies.company.id,
    involved_companies.company.name
  `;

  const params = new URLSearchParams(query);

  // ============================================
  // PAGINATION
  // ============================================

  const page = Math.max(Number(params.get("page")) || 1, 1);

  const pageSize = Math.min(
    Math.max(Number(params.get("page_size")) || 40, 1),
    40,
  );

  const offset = (page - 1) * pageSize;

  // ============================================
  // SEARCH
  // ============================================

  const search = params.get("search")?.trim();

  // ============================================
  // FILTERS
  // ============================================

  const genre = params.get("genres");
  const platform = params.get("platforms");
  const dates = params.get("dates");

  // ============================================
  // SORTING
  // ============================================

  const ordering = params.get("ordering");

  // ============================================
  // WHERE CONDITIONS
  // ============================================

  const conditions = [];

  conditions.push("cover != null");
  conditions.push("game_type = 0");
  conditions.push("version_parent = null");

  // ============================================
  // GENRE
  // ============================================

  if (genre) {
    const genreIds = genre
      .split(",")
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0);

    if (genreIds.length === 1) {
      conditions.push(`genres = ${genreIds[0]}`);
    } else if (genreIds.length > 1) {
      conditions.push(`genres = (${genreIds.join(",")})`);
    }
  }

  // ============================================
  // PLATFORM
  // ============================================

  if (platform) {
    const platformIds = platform
      .split(",")
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0);

    if (platformIds.length === 1) {
      conditions.push(`platforms = ${platformIds[0]}`);
    } else if (platformIds.length > 1) {
      conditions.push(`platforms = (${platformIds.join(",")})`);
    }
  }

  // ============================================
  // DATE FILTER
  // ============================================

  if (dates) {
    const [startDate, endDate] = dates.split(",");

    if (startDate && endDate) {
      const startTimestamp = Math.floor(
        new Date(`${startDate}T00:00:00Z`).getTime() / 1000,
      );

      const endTimestamp = Math.floor(
        new Date(`${endDate}T23:59:59Z`).getTime() / 1000,
      );

      if (Number.isFinite(startTimestamp) && Number.isFinite(endTimestamp)) {
        conditions.push(
          `first_release_date >= ${startTimestamp} & first_release_date <= ${endTimestamp}`,
        );
      }
    }
  }

  // ============================================
  // BUILD QUERY
  // ============================================

  let igdbQuery = `
    fields ${fields};
  `;

  // ============================================
  // SEARCH
  // ============================================

  if (search) {
    const escapedSearch = search.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

    igdbQuery += `
      search "${escapedSearch}";
    `;
  }

  // ============================================
  // ORDERING
  // ============================================

  if (!search) {
    switch (ordering) {
      // ==========================================
      // TOP RATED
      // ==========================================
      //
      // Goal:
      // Start with genuinely acclaimed games,
      // then progressively descend into the larger
      // pool of well-reviewed games.
      //
      // The important part is that this is NOT simply
      // "highest score wins".
      //
      // A game needs BOTH:
      //
      // 1. A strong aggregated score
      // 2. A meaningful number of aggregated reviews
      //
      // This prevents obscure games with tiny review
      // samples from appearing above established classics.
      //
      // Page 1 therefore begins with the strongest,
      // highly reviewed games.
      //
      // Later pages naturally descend through the
      // broader highly-rated catalogue.
      // ==========================================

      case "-rating": {
        conditions.push("aggregated_rating != null");
        conditions.push("aggregated_rating_count > 0");

        igdbQuery = `
    fields ${fields};

    where ${conditions.join(" & ")};

    sort aggregated_rating desc;
    sort aggregated_rating_count desc;

    limit ${pageSize};
    offset ${offset};
  `;

        break;
      }

      // ==========================================
      // NEW RELEASES
      // ==========================================

      case "-released":
        igdbQuery += `
          where ${conditions.join(" & ")};

          sort total_rating_count desc;
        `;

        break;

      case "released":
        igdbQuery += `
          where ${conditions.join(" & ")};

          sort first_release_date asc;
        `;

        break;

      // ==========================================
      // POPULAR
      // ==========================================

      case "-popular":
        igdbQuery += `
          where ${conditions.join(" & ")};

          sort total_rating_count desc;
        `;

        break;

      // ==========================================
      // EXPLORE / TRENDING
      // DO NOT CHANGE
      // ==========================================

      case "-added":
        igdbQuery += `
          where ${conditions.join(" & ")};

          sort total_rating_count desc;
        `;

        break;

      // ==========================================
      // NAME
      // ==========================================

      case "name":
        igdbQuery += `
          where ${conditions.join(" & ")};

          sort name asc;
        `;

        break;

      case "-name":
        igdbQuery += `
          where ${conditions.join(" & ")};

          sort name desc;
        `;

        break;

      default:
        igdbQuery += `
          where ${conditions.join(" & ")};
        `;

        break;
    }
  } else {
    igdbQuery += `
      where ${conditions.join(" & ")};
    `;
  }

  // ============================================
  // PAGINATION
  // ============================================

  if (!igdbQuery.includes(`limit ${pageSize};`)) {
    igdbQuery += `
      limit ${pageSize};
      offset ${offset};
    `;
  }

  // ============================================
  // DEBUG
  // ============================================

  console.log("==============================================");
  console.log("FRACTURE GAMES REQUEST");
  console.log("Page:", page);
  console.log("Page Size:", pageSize);
  console.log("Offset:", offset);
  console.log("Ordering:", ordering || "default");
  console.log("Search:", search || "none");
  console.log("==============================================");

  // ============================================
  // FETCH GAMES + TOTAL COUNT
  // ============================================

  // Fetch the current page
  const data = await fractureFetch("games", igdbQuery);

  const results = Array.isArray(data)
    ? data.map(normalizeGame).filter(Boolean)
    : [];

  // ============================================
  // GET TOTAL FILTERED COUNT
  // ============================================

  // Build a separate query containing only the filters.
  // No limit / offset / sorting because we need the
  // total number of matching games.

  let countQuery = "";

  if (search) {
    const escapedSearch = search.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

    countQuery += `
    search "${escapedSearch}";
  `;
  }

  countQuery += `
  where ${conditions.join(" & ")};
`;

  // IGDB count endpoint
  const countData = await fractureFetch("games/count", countQuery);

  const totalCount =
    typeof countData?.count === "number" ? countData.count : results.length;

  return {
    count: totalCount,
    results,
  };
}

// ==============================================
// SINGLE GAME DETAILS
// ==============================================

export async function getGameDetails(id) {
  const gameId = Number(id);

  if (!Number.isInteger(gameId) || gameId < 1) {
    throw createError("Invalid IGDB game ID.", {}, 400);
  }

  const query = `
    fields
      id,
      name,
      slug,
      summary,
      storyline,
      first_release_date,
      rating,
      total_rating_count,
      aggregated_rating,
      aggregated_rating_count,
      cover.url,

      genres.id,
      genres.name,
      genres.slug,

      platforms.id,
      platforms.name,
      platforms.slug,
      platforms.abbreviation,

      themes.id,
      themes.name,
      themes.slug,

      keywords.id,
      keywords.name,
      keywords.slug,

      involved_companies.developer,
      involved_companies.publisher,
      involved_companies.company.id,
      involved_companies.company.name,

      screenshots.id,
      screenshots.url,
      screenshots.width,
      screenshots.height,
      screenshots.image_id,

      websites.id,
      websites.url,
      websites.category,
      websites.trusted,

      similar_games;

    where id = ${gameId};
    limit 1;
  `;

  console.log("==============================================");
  console.log("IGDB GAME DETAILS REQUEST");
  console.log("Game ID:", gameId);
  console.log("==============================================");

  const data = await fractureFetch("games", query);

  if (!Array.isArray(data) || data.length === 0) {
    throw createError(
      "Game not found.",
      {
        detail: "IGDB could not find the requested game.",
      },
      404,
    );
  }

  const game = data[0];

  // ============================================
  // SIMILAR GAMES
  // ============================================

  let similarGames = [];

  if (Array.isArray(game.similar_games)) {
    const similarIds = game.similar_games
      .map(Number)
      .filter(
        (similarId) =>
          Number.isInteger(similarId) && similarId > 0 && similarId !== gameId,
      )
      .slice(0, 12);

    if (similarIds.length > 0) {
      const similarQuery = `
        fields
          id,
          name,
          slug,
          rating,
          total_rating_count,
          aggregated_rating,
          aggregated_rating_count,
          first_release_date,
          cover.url,

          genres.id,
          genres.name,
          genres.slug,

          platforms.id,
          platforms.name,
          platforms.slug,
          platforms.abbreviation,

          involved_companies.developer,
          involved_companies.company.id,
          involved_companies.company.name;

        where id = (${similarIds.join(",")});

        limit ${similarIds.length};
      `;

      console.log("==============================================");
      console.log("IGDB SIMILAR GAMES REQUEST");
      console.log("IDs:", similarIds);
      console.log("==============================================");

      try {
        const similarData = await fractureFetch("games", similarQuery);

        if (Array.isArray(similarData)) {
          const order = new Map(
            similarIds.map((similarId, index) => [similarId, index]),
          );

          similarGames = similarData
            .filter(
              (similarGame) =>
                similarGame &&
                Number.isInteger(Number(similarGame.id)) &&
                Number(similarGame.id) !== gameId,
            )
            .sort(
              (a, b) =>
                (order.get(Number(a.id)) ?? 999) -
                (order.get(Number(b.id)) ?? 999),
            );
        }
      } catch (error) {
        console.error("Failed to fetch similar games:", error);
        similarGames = [];
      }
    }
  }

  return normalizeGame({
    ...game,
    similar_games: similarGames,
  });
}

// ==============================================
// GAME SCREENSHOTS
// ==============================================

export async function getGameScreenshots(id) {
  const gameId = Number(id);

  if (!Number.isInteger(gameId) || gameId < 1) {
    throw createError("Invalid IGDB game ID.", {}, 400);
  }

  const query = `
    fields
      id,
      url,
      width,
      height,
      image_id;

    where game = ${gameId};

    limit 50;
  `;

  const data = await fractureFetch("screenshots", query);

  return {
    results: Array.isArray(data)
      ? data
          .filter((screenshot) => screenshot?.url)
          .map((screenshot) => ({
            id: screenshot.id,
            image: getScreenshotUrl(screenshot, "t_screenshot_big"),
            thumbnail: getScreenshotUrl(screenshot, "t_screenshot_med"),
            width: screenshot.width || null,
            height: screenshot.height || null,
          }))
      : [],
  };
}

// ==============================================
// GAME TRAILERS
// ==============================================

export async function getGameTrailers(id) {
  const game = await getGameDetails(id);

  return {
    results: [],
    game,
  };
}

// ==============================================
// GENRES
// ==============================================

export async function getGenres() {
  const query = `
    fields
      id,
      name,
      slug;

    limit 500;
  `;

  const data = await fractureFetch("genres", query);

  return {
    count: Array.isArray(data) ? data.length : 0,
    results: Array.isArray(data) ? data : [],
  };
}

// ==============================================
// PLATFORMS
// ==============================================

export async function getPlatforms() {
  const query = `
    fields
      id,
      name,
      slug,
      abbreviation;

    limit 500;
  `;

  const data = await fractureFetch("platforms", query);

  return {
    count: Array.isArray(data) ? data.length : 0,
    results: Array.isArray(data) ? data : [],
  };
}

// ==============================================
// SIMILAR GAMES
// ==============================================

export async function getSimilarGames(id) {
  const game = await getGameDetails(id);

  return {
    count: game.similar_games?.length || 0,
    results: game.similar_games || [],
  };
}

// ==============================================
// YOUTUBE TRAILER SEARCH
// ==============================================

export async function getYouTubeTrailer(query) {
  if (!query || typeof query !== "string") {
    throw createError("Invalid YouTube search query.", {}, 400);
  }

  if (!process.env.YOUTUBE_API_KEY) {
    throw createError("Missing YouTube API configuration.", {}, 500);
  }

  const youtubeUrl = new URL("https://www.googleapis.com/youtube/v3/search");

  youtubeUrl.searchParams.set("part", "snippet");
  youtubeUrl.searchParams.set("q", query);
  youtubeUrl.searchParams.set("type", "video");
  youtubeUrl.searchParams.set("maxResults", "5");
  youtubeUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY);

  const response = await fetch(youtubeUrl);

  if (!response.ok) {
    throw createError(
      `YouTube API error ${response.status}`,
      {
        detail: "Failed to search YouTube trailers.",
      },
      response.status,
    );
  }

  const data = await response.json();

  const video = data.items?.[0];

  if (!video?.id?.videoId) {
    return null;
  }

  return {
    videoId: video.id.videoId,
    title: video.snippet.title,
    channelTitle: video.snippet.channelTitle,
    thumbnail:
      video.snippet.thumbnails?.high?.url ||
      video.snippet.thumbnails?.medium?.url ||
      video.snippet.thumbnails?.default?.url ||
      null,
  };
}
