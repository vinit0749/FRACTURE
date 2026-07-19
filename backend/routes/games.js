import express from "express";

import {
  getGames,
  getGameDetails,
  getGameScreenshots,
  getGameTrailers,
  getGenres,
  getPlatforms,
} from "../services/fracture.js";

const router = express.Router();

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
    const params = new URLSearchParams(req.query).toString();

    const data = await getGames(params);

    res.json({
      count: data.count,
      results: data.results || [],
    });
  } catch (error) {
    console.error("Games route error:", error);

    const status = error.status || 500;
    const message = error.details?.detail || "Failed to fetch games";

    res.status(status).json({
      message,
      error: error.message,
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

    res.json({
      results: data.results || [],
    });
  } catch (error) {
    console.error("Screenshots route error:", error);

    const status = error.status || 500;
    const message = error.details?.detail || "Failed to fetch screenshots";

    res.status(status).json({
      message,
      error: error.message,
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

    res.json({
      results: data.results || [],
    });
  } catch (error) {
    console.error("Trailers route error:", error);

    const status = error.status || 500;
    const message = error.details?.detail || "Failed to fetch trailers";

    res.status(status).json({
      message,
      error: error.message,
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

    res.json(data);
  } catch (error) {
    console.error("Genres route error:", error);

    const status = error.status || 500;
    const message = error.details?.detail || "Failed to fetch genres";

    res.status(status).json({
      message,
      error: error.message,
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

    res.json(data);
  } catch (error) {
    console.error("Platforms route error:", error);

    const status = error.status || 500;
    const message = error.details?.detail || "Failed to fetch platforms";

    res.status(status).json({
      message,
      error: error.message,
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

    res.json(data);
  } catch (error) {
    console.error("Game details route error:", error);

    const status = error.status || 500;
    const message = error.details?.detail || "Failed to fetch game details";

    res.status(status).json({
      message,
      error: error.message,
    });
  }
});

export default router;
