import express from "express";

import { askFortuna } from "../services/fortunaService.js";

import { discoverGamesFromIntent } from "../services/fortunaDiscoveryService.js";

const router = express.Router();

// ==================================
// FORTUNA CHAT + INTENT
// ==================================

router.post("/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        message: "A valid message is required.",
      });
    }

    if (!Array.isArray(history)) {
      return res.status(400).json({
        message: "Conversation history must be an array.",
      });
    }

    const fortunaResponse = await askFortuna(message, history);

    return res.json({
      reply: fortunaResponse.reply,
      intent: fortunaResponse.intent,
    });
  } catch (error) {
    console.error("FORTUNA chat route error:", error);

    return res.status(500).json({
      message: error.message || "FORTUNA is unavailable right now.",
    });
  }
});

// ==================================
// FORTUNA DISCOVERY
// ==================================

router.post("/discover", async (req, res) => {
  try {
    const { intent, history = [] } = req.body;

    if (!intent || typeof intent !== "object") {
      return res.status(400).json({
        message: "A valid FORTUNA intent is required.",
      });
    }

    if (!Array.isArray(history)) {
      return res.status(400).json({
        message: "Conversation history must be an array.",
      });
    }

    const discovery = await discoverGamesFromIntent(intent, history);

    return res.json(discovery);
  } catch (error) {
    console.error("FORTUNA discovery route error:", error);

    return res.status(500).json({
      message: error.message || "FORTUNA could not discover games right now.",
    });
  }
});

export default router;
