import express from "express";

import { askFortuna } from "../services/fortunaService.js";
import { discoverGamesFromIntent } from "../services/fortunaDiscoveryService.js";

const router = express.Router();

// ==============================================
// FORTUNA CHAT
// ==============================================
//
// FORTUNA Service handles:
//
// - Understanding the user's message
// - Maintaining accumulated intent
// - Natural conversation
// - Deciding whether discovery should happen
// - Deciding whether preferences were refined
//
// discoveryAction returned by FORTUNA:
//
// - "continue" → keep chatting
// - "refine"   → preferences changed/refined
// - "discover" → discovery should run
//
// IMPORTANT:
//
// This route does NOT inspect the user's message
// to determine whether discovery should happen.
//
// FORTUNA / Gemini is the decision-maker.
//
// Flow:
//
// User message
//      ↓
// POST /chat
//      ↓
// Fortuna Service (Gemini)
//      ↓
// discoveryAction
//      ↓
// Frontend
//      ↓
// If "discover" → POST /discover
//
// ==============================================

router.post("/chat", async (req, res) => {
  try {
    const { message, history = [], intent = {} } = req.body;

    // ============================================
    // VALIDATE MESSAGE
    // ============================================

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        message: "A valid message is required.",
      });
    }

    // ============================================
    // VALIDATE HISTORY
    // ============================================

    if (!Array.isArray(history)) {
      return res.status(400).json({
        message: "Conversation history must be an array.",
      });
    }

    // ============================================
    // VALIDATE INTENT
    // ============================================

    if (!intent || typeof intent !== "object" || Array.isArray(intent)) {
      return res.status(400).json({
        message: "FORTUNA intent must be an object.",
      });
    }

    // ============================================
    // ASK FORTUNA
    // ============================================

    const fortunaResponse = await askFortuna(message, history, intent);

    // ============================================
    // RETURN FORTUNA RESPONSE
    // ============================================
    //
    // The response comes directly from Fortuna Service.
    //
    // The route does NOT:
    //
    // - Inspect keywords
    // - Detect "yes"
    // - Detect "sure"
    // - Detect "more games"
    // - Decide readiness
    // - Decide discovery
    //
    // Gemini / FORTUNA already made that decision.
    //
    // ============================================

    return res.json({
      reply: fortunaResponse.reply,

      discoveryAction: fortunaResponse.discoveryAction,

      intent: fortunaResponse.intent,
    });
  } catch (error) {
    console.error("FORTUNA chat route error:", error);

    return res.status(500).json({
      message: error?.message || "FORTUNA is unavailable right now.",
    });
  }
});

// ==============================================
// FORTUNA DISCOVERY
// ==============================================
//
// This route executes the discovery pipeline.
//
// IMPORTANT:
//
// This route does NOT decide whether discovery
// should happen.
//
// FORTUNA Service already made that decision.
//
// The frontend calls this route only after:
//
// discoveryAction === "discover"
//
// Flow:
//
// Fortuna Service
//      ↓
// discoveryAction: "discover"
//      ↓
// Frontend
//      ↓
// POST /discover
//      ↓
// Fortuna Discovery Service
//      ↓
// Gemini selects games
//      ↓
// RAWG retrieves game data
//
// ==============================================

router.post("/discover", async (req, res) => {
  try {
    const { intent, history = [], previousRecommendations = [] } = req.body;

    // ============================================
    // VALIDATE INTENT
    // ============================================

    if (!intent || typeof intent !== "object" || Array.isArray(intent)) {
      return res.status(400).json({
        message: "A valid FORTUNA intent is required.",
      });
    }

    // ============================================
    // VALIDATE HISTORY
    // ============================================

    if (!Array.isArray(history)) {
      return res.status(400).json({
        message: "FORTUNA conversation history must be an array.",
      });
    }

    // ============================================
    // VALIDATE PREVIOUS RECOMMENDATIONS
    // ============================================

    if (!Array.isArray(previousRecommendations)) {
      return res.status(400).json({
        message: "Previous recommendations must be an array.",
      });
    }

    // ============================================
    // RUN DISCOVERY
    // ============================================
    //
    // The caller has already received:
    //
    // discoveryAction: "discover"
    //
    // from Fortuna Service.
    //
    // This route simply executes the discovery pipeline.
    //
    // ============================================

    const discovery = await discoverGamesFromIntent(intent, history, {
      explicitDiscovery: true,
      previousRecommendations,
    });

    // ============================================
    // RETURN DISCOVERY
    // ============================================

    return res.json(discovery);
  } catch (error) {
    console.error("FORTUNA discovery route error:", error);

    return res.status(500).json({
      message: error?.message || "FORTUNA could not discover games right now.",
    });
  }
});

export default router;
