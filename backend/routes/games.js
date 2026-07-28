import express from "express";

import {
  getGames,
  getGameDetails,
  getGameScreenshots,
  getGameTrailers,
  getGenres,
  getPlatforms,
} from "../services/fracture.js";

import { generalApiLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

// ==================================
// Rate limit public RAWG API proxy
// ==================================

router.use(generalApiLimiter);

// ==================================
// Allowed RAWG game query parameters
// ==================================

const ALLOWED_GAME_PARAMS = new Set([
  "search",
  "search_exact",
  "search_precise",
  "genres",
  "developers",
  "publishers",
  "platforms",
  "stores",
  "tags",
  "dates",
  "ordering",
  "page",
  "page_size",
  "metacritic",
  "exclude_additions",
  "exclude_collection",
  "exclude_parents",
  "exclude_game_series",
  "exclude_stores",
  "parent_platforms",
  "creators",
  "game_series",
]);

const MAX_QUERY_LENGTH = 1000;
const MAX_PAGE_SIZE = 40;
const MAX_PAGE = 1000;

// ==================================
// Validate game query parameters
// ==================================

function validateGameQuery(query) {
  const queryString = new URLSearchParams(query).toString();

  if (queryString.length > MAX_QUERY_LENGTH) {
    return {
      valid: false,
      message: "Game query is too long.",
    };
  }

  for (const key of Object.keys(query)) {
    if (!ALLOWED_GAME_PARAMS.has(key)) {
      return {
        valid: false,
        message: `Unsupported query parameter: ${key}`,
      };
    }
  }

  if (query.page !== undefined) {
    const page = Number(query.page);

    if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
      return {
        valid: false,
        message: "Page must be an integer between 1 and 1000.",
      };
    }
  }

  if (query.page_size !== undefined) {
    const pageSize = Number(query.page_size);

    if (
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > MAX_PAGE_SIZE
    ) {
      return {
        valid: false,
        message: `Page size must be an integer between 1 and ${MAX_PAGE_SIZE}.`,
      };
    }
  }

  return {
    valid: true,
    queryString,
  };
}

// ==================================
// GET ALL GAMES
// GET SIMILAR GAMES
//
// /api/games
// /api/games?genres=action
// /api/games?developers=123
// ==================================

router.get("/", async (req, res) => {
  try {
    const validation = validateGameQuery(req.query);

    if (!validation.valid) {
      return res.status(400).json({
        message: validation.message,
      });
    }

    const data = await getGames(validation.queryString);

    return res.json({
      count: data.count,
      results: data.results || [],
    });
  } catch (error) {
    console.error("Games route error:", error);

    const status = error.status || 500;
    const message = error.details?.detail || "Failed to fetch games";

    return res.status(status).json({
      message,
    });
  }
});

// ==================================
// GET GAME SCREENSHOTS
//
// /api/games/:id/screenshots
// ==================================

router.get("/:id/screenshots", async (req, res) => {
  try {
    const data = await getGameScreenshots(req.params.id);

    return res.json({
      results: data.results || [],
    });
  } catch (error) {
    console.error("Screenshots route error:", error);

    const status = error.status || 500;
    const message = error.details?.detail || "Failed to fetch screenshots";

    return res.status(status).json({
      message,
    });
  }
});

// ==================================
// GET GAME TRAILERS
//
// /api/games/:id/movies
// ==================================

router.get("/:id/movies", async (req, res) => {
  try {
    const data = await getGameTrailers(req.params.id);

    return res.json({
      results: data.results || [],
    });
  } catch (error) {
    console.error("Trailers route error:", error);

    const status = error.status || 500;
    const message = error.details?.detail || "Failed to fetch trailers";

    return res.status(status).json({
      message,
    });
  }
});

// ==================================
// GET GENRES
//
// /api/games/genres
// ==================================

router.get("/genres", async (req, res) => {
  try {
    const data = await getGenres();

    return res.json(data);
  } catch (error) {
    console.error("Genres route error:", error);

    const status = error.status || 500;
    const message = error.details?.detail || "Failed to fetch genres";

    return res.status(status).json({
      message,
    });
  }
});

// ==================================
// GET PLATFORMS
//
// /api/games/platforms
// ==================================

router.get("/platforms", async (req, res) => {
  try {
    const data = await getPlatforms();

    return res.json(data);
  } catch (error) {
    console.error("Platforms route error:", error);

    const status = error.status || 500;
    const message = error.details?.detail || "Failed to fetch platforms";

    return res.status(status).json({
      message,
    });
  }
});

// ==================================
// GET GAME DETAILS
//
// /api/games/:id
// ==================================

router.get("/:id", async (req, res) => {
  try {
    const data = await getGameDetails(req.params.id);

    return res.json(data);
  } catch (error) {
    console.error("Game details route error:", error);

    const status = error.status || 500;
    const message = error.details?.detail || "Failed to fetch game details";

    return res.status(status).json({
      message,
    });
  }
});

export default router;
