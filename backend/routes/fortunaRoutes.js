import express from "express";
import mongoose from "mongoose";

import {
  askFortuna,
  generateFortunaTitle,
} from "../services/fortunaService.js";
import { discoverGamesFromIntent } from "../services/fortunaDiscoveryService.js";

import FortunaConversation from "../models/fortunaConversation.js";
import authenticateToken from "../middleware/auth.js";

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
// GENERATE FORTUNA CONVERSATION TITLE
// ==============================================
//
// This endpoint generates a contextual title using:
//
// 1. The FULL conversation history
// 2. The accumulated FORTUNA intent
//
// The title is NOT generated from only:
// - The 3rd user message
// - The latest user message
// - A hardcoded frontend rule
//
// Example:
//
// User:
// "I want an open-world game."
// "Something with fantasy would be nice."
// "I also want good exploration."
//
// History + Intent
//        ↓
// Fortuna / Gemini
//        ↓
// "Open-World Fantasy Exploration"
//
// The AI decides what the conversation is
// actually about based on the complete context.
//
// ==============================================

router.post("/title", async (req, res) => {
  try {
    const { history = [], intent = {} } = req.body;

    // ============================================
    // VALIDATE HISTORY
    // ============================================

    if (!Array.isArray(history)) {
      return res.status(400).json({
        message: "FORTUNA conversation history must be an array.",
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
    // REQUIRE CONVERSATION CONTEXT
    // ============================================

    if (history.length === 0) {
      return res.status(400).json({
        message: "FORTUNA requires conversation context to generate a title.",
      });
    }

    // ============================================
    // GENERATE CONTEXTUAL TITLE
    // ============================================

    const title = await generateFortunaTitle(history, intent);

    // ============================================
    // RETURN TITLE
    // ============================================

    return res.status(200).json({
      title,
    });
  } catch (error) {
    console.error("FORTUNA title generation error:", error);

    return res.status(500).json({
      message:
        error?.message || "FORTUNA could not generate a conversation title.",
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
// ==============================================

router.post("/discover", async (req, res) => {
  try {
    const { intent, history = [], previousRecommendations = [] } = req.body;

    // ============================================
    // VALIDATE INTENT
    // ============================================

    if (!intent || typeof intent !== "object" || Array.isArray(intent)) {
      return res.status(400).json({
        message: "A valid FORTUNA discovery intent is required.",
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

// ==============================================
// FORTUNA HISTORY
// ==============================================
//
// All history routes require authentication.
//
// Users can only access conversations belonging
// to their own Firebase UID.
//
// ==============================================

// ==============================================
// GET FORTUNA HISTORY
// ==============================================
//
// Returns the user's conversations ordered from
// most recently updated to oldest.
//
// Does NOT return the full timeline.
// This keeps the history list lightweight.
//
// ==============================================

router.get("/history", authenticateToken, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    const conversations = await FortunaConversation.find({
      firebaseUid,
    })
      .select("_id title createdAt updatedAt")
      .sort({
        updatedAt: -1,
      })
      .lean();

    return res.status(200).json({
      conversations,
    });
  } catch (error) {
    console.error("FORTUNA history fetch error:", error);

    return res.status(500).json({
      message: "Failed to fetch FORTUNA conversation history.",
    });
  }
});

// ==============================================
// GET SINGLE FORTUNA CONVERSATION
// ==============================================

router.get("/history/:conversationId", authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const firebaseUid = req.user.uid;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        message: "Invalid FORTUNA conversation ID.",
      });
    }

    const conversation = await FortunaConversation.findOne({
      _id: conversationId,
      firebaseUid,
    }).lean();

    if (!conversation) {
      return res.status(404).json({
        message: "FORTUNA conversation not found.",
      });
    }

    return res.status(200).json({
      conversation,
    });
  } catch (error) {
    console.error("FORTUNA conversation fetch error:", error);

    return res.status(500).json({
      message: "Failed to fetch FORTUNA conversation.",
    });
  }
});

// ==============================================
// CREATE FORTUNA CONVERSATION
// ==============================================

router.post("/history", authenticateToken, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    const { title, timeline, intent } = req.body;

    // ==========================================
    // VALIDATE TIMELINE
    // ==========================================

    if (!Array.isArray(timeline)) {
      return res.status(400).json({
        message: "FORTUNA conversation timeline must be an array.",
      });
    }

    // ==========================================
    // CREATE CONVERSATION
    // ==========================================

    const conversation = await FortunaConversation.create({
      firebaseUid,

      title:
        typeof title === "string" && title.trim()
          ? title.trim()
          : "New Discovery",

      timeline,

      intent:
        intent && typeof intent === "object" && !Array.isArray(intent)
          ? intent
          : {},
    });

    return res.status(201).json({
      conversation,
    });
  } catch (error) {
    console.error("FORTUNA conversation creation error:", error);

    return res.status(500).json({
      message: "Failed to create FORTUNA conversation.",
    });
  }
});

// ==============================================
// UPDATE FORTUNA CONVERSATION
// ==============================================

router.put("/history/:conversationId", authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const firebaseUid = req.user.uid;

    // ==========================================
    // VALIDATE CONVERSATION ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        message: "Invalid FORTUNA conversation ID.",
      });
    }

    const { title, timeline, intent } = req.body;

    const updateData = {};

    // ==========================================
    // UPDATE TITLE
    // ==========================================

    if (typeof title === "string" && title.trim()) {
      updateData.title = title.trim();
    }

    // ==========================================
    // UPDATE TIMELINE
    // ==========================================

    if (timeline !== undefined) {
      if (!Array.isArray(timeline)) {
        return res.status(400).json({
          message: "FORTUNA conversation timeline must be an array.",
        });
      }

      updateData.timeline = timeline;
    }

    // ==========================================
    // UPDATE INTENT
    // ==========================================

    if (intent !== undefined) {
      if (!intent || typeof intent !== "object" || Array.isArray(intent)) {
        return res.status(400).json({
          message: "FORTUNA conversation intent must be an object.",
        });
      }

      updateData.intent = intent;
    }

    // ==========================================
    // VALIDATE UPDATE
    // ==========================================

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "No valid conversation data was provided.",
      });
    }

    // ==========================================
    // UPDATE CONVERSATION
    // ==========================================

    const conversation = await FortunaConversation.findOneAndUpdate(
      {
        _id: conversationId,
        firebaseUid,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      },
    ).lean();

    if (!conversation) {
      return res.status(404).json({
        message: "FORTUNA conversation not found.",
      });
    }

    return res.status(200).json({
      conversation,
    });
  } catch (error) {
    console.error("FORTUNA conversation update error:", error);

    return res.status(500).json({
      message: "Failed to update FORTUNA conversation.",
    });
  }
});

// ==============================================
// DELETE FORTUNA CONVERSATION
// ==============================================

router.delete(
  "/history/:conversationId",
  authenticateToken,
  async (req, res) => {
    try {
      const { conversationId } = req.params;

      const firebaseUid = req.user.uid;

      // ==========================================
      // VALIDATE CONVERSATION ID
      // ==========================================

      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({
          message: "Invalid FORTUNA conversation ID.",
        });
      }

      // ==========================================
      // DELETE CONVERSATION
      // ==========================================

      const conversation = await FortunaConversation.findOneAndDelete({
        _id: conversationId,
        firebaseUid,
      });

      if (!conversation) {
        return res.status(404).json({
          message: "FORTUNA conversation not found.",
        });
      }

      return res.status(200).json({
        message: "FORTUNA conversation deleted successfully.",
      });
    } catch (error) {
      console.error("FORTUNA conversation deletion error:", error);

      return res.status(500).json({
        message: "Failed to delete FORTUNA conversation.",
      });
    }
  },
);

export default router;
