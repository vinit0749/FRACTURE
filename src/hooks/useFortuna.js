import { useState } from "react";

import { sendFortunaMessage, discoverFortunaGames } from "../api/fortuna.js";

// ==============================================
// FORTUNA HOOK
// ==============================================
//
// Responsibilities:
//
// - Maintain visible conversation timeline
// - Maintain accumulated discovery intent
// - Send conversation to Fortuna Service
// - Trust Fortuna Service's discoveryAction
// - Call Discovery Service only when FORTUNA decides
// - Pass previously shown games to FDS
// - Keep discovery results visible
//
// IMPORTANT:
//
// Gemini / FORTUNA is the decision-maker.
//
// The frontend does NOT:
//
// - Detect discovery requests
// - Guess whether "yes" means discovery
// - Guess whether "sure" means discovery
// - Guess whether "more games" means discovery
// - Decide whether the user is ready
// - Decide when discovery should happen
//
// Flow:
//
// User message
//      ↓
// Fortuna Service / Gemini
//      ↓
// discoveryAction
//      ↓
// continue → conversation only
// refine   → conversation only
// discover → Discovery Service
//      ↓
// FDS / Gemini
//      ↓
// RAWG
//      ↓
// Discovery results
//
// ==============================================

// ==============================================
// EXTRACT PREVIOUSLY SHOWN GAMES
// ==============================================
//
// FDS needs to know which games have already been
// shown so it can avoid repeating them.
//
// Discovery blocks are UI-only and are not sent as
// normal FS conversation messages.
//
// Supports:
//
// 1. RAWG game objects
//    { name: "Grand Theft Auto V" }
//
// 2. FORTUNA recommendation objects
//    { title: "Grand Theft Auto V" }
//
// ==============================================

function extractPreviousRecommendations(timeline = []) {
  if (!Array.isArray(timeline)) {
    return [];
  }

  const previousRecommendations = [];

  for (const item of timeline) {
    if (!item || item.type !== "discovery") {
      continue;
    }

    // ============================================
    // EXTRACT RAWG GAMES
    // ============================================

    if (Array.isArray(item.games)) {
      for (const game of item.games) {
        if (!game || typeof game !== "object") {
          continue;
        }

        const title =
          typeof game.name === "string"
            ? game.name.trim()
            : typeof game.title === "string"
              ? game.title.trim()
              : "";

        const reason =
          typeof game.fortunaReason === "string"
            ? game.fortunaReason.trim()
            : "";

        if (!title) {
          continue;
        }

        previousRecommendations.push({
          title,
          reason,
        });
      }
    }

    // ============================================
    // EXTRACT FORTUNA RECOMMENDATIONS
    // ============================================

    if (Array.isArray(item.recommendations)) {
      for (const recommendation of item.recommendations) {
        if (!recommendation || typeof recommendation !== "object") {
          continue;
        }

        const title =
          typeof recommendation.title === "string"
            ? recommendation.title.trim()
            : typeof recommendation.name === "string"
              ? recommendation.name.trim()
              : "";

        const reason =
          typeof recommendation.reason === "string"
            ? recommendation.reason.trim()
            : typeof recommendation.fortunaReason === "string"
              ? recommendation.fortunaReason.trim()
              : "";

        if (!title) {
          continue;
        }

        previousRecommendations.push({
          title,
          reason,
        });
      }
    }
  }

  // ============================================
  // REMOVE DUPLICATES
  // ============================================

  const seen = new Set();

  return previousRecommendations.filter((recommendation) => {
    const key = recommendation.title.trim().toLowerCase();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

// ==============================================
// FORTUNA HOOK
// ==============================================

export function useFortuna() {
  // ============================================
  // CONVERSATION TIMELINE
  // ============================================
  //
  // Contains:
  //
  // - User messages
  // - FORTUNA messages
  // - Discovery result blocks
  //
  // Discovery blocks remain visible in the UI
  // but are excluded from FS chat history.
  // ============================================

  const [timeline, setTimeline] = useState([]);

  // ============================================
  // INPUT
  // ============================================

  const [input, setInput] = useState("");

  // ============================================
  // LOADING
  // ============================================

  const [isLoading, setIsLoading] = useState(false);

  // ============================================
  // ACCUMULATED DISCOVERY INTENT
  // ============================================

  const [intent, setIntent] = useState(null);

  // ============================================
  // DISCOVERY ATTEMPTED
  // ============================================
  //
  // true when FORTUNA decided to trigger
  // Discovery Service for the current message.
  // ============================================

  const [discoveryAttempted, setDiscoveryAttempted] = useState(false);

  // ============================================
  // ERROR
  // ============================================

  const [error, setError] = useState(null);

  // ============================================
  // SEND MESSAGE
  // ============================================

  async function sendMessage(message = input) {
    // ==========================================
    // BASIC VALIDATION
    // ==========================================

    if (typeof message !== "string" || !message.trim()) {
      return;
    }

    const trimmedMessage = message.trim();

    // ==========================================
    // PREVENT DUPLICATE REQUESTS
    // ==========================================

    if (isLoading) {
      return;
    }

    // ==========================================
    // RESET ERROR
    // ==========================================

    setError(null);

    // ==========================================
    // START LOADING
    // ==========================================

    setIsLoading(true);

    // ==========================================
    // RESET DISCOVERY ATTEMPT STATE
    // ==========================================

    setDiscoveryAttempted(false);

    // ==========================================
    // BUILD FS CHAT HISTORY
    // ==========================================
    //
    // Only actual conversation messages are sent.
    //
    // Discovery blocks are UI-only and therefore
    // excluded from the FORTUNA conversation.
    // ==========================================

    const chatHistory = timeline
      .filter(
        (item) =>
          item &&
          (item.role === "user" || item.role === "model") &&
          typeof item.content === "string" &&
          item.content.trim(),
      )
      .map((item) => ({
        role: item.role,
        content: item.content.trim(),
      }));

    // ==========================================
    // COLLECT PREVIOUSLY SHOWN GAMES
    // ==========================================
    //
    // This is separate from chat history.
    //
    // FDS uses this to:
    //
    // - Avoid repeating games
    // - Understand what was previously shown
    // - Find new games for later discovery
    // ==========================================

    const previousRecommendations = extractPreviousRecommendations(timeline);

    // ==========================================
    // ADD USER MESSAGE TO TIMELINE
    // ==========================================

    const userMessage = {
      role: "user",
      content: trimmedMessage,
    };

    const updatedTimeline = [...timeline, userMessage];

    setTimeline(updatedTimeline);

    // ==========================================
    // CLEAR INPUT
    // ==========================================

    setInput("");

    try {
      // ========================================
      // STEP 1
      // ASK FORTUNA
      // ========================================
      //
      // Gemini decides:
      //
      // continue
      // refine
      // discover
      //
      // The frontend does not interpret the
      // user's message to make this decision.
      // ========================================

      const fortunaResponse = await sendFortunaMessage(
        trimmedMessage,
        chatHistory,
        intent,
      );

      // ========================================
      // VALIDATE FORTUNA RESPONSE
      // ========================================

      if (
        !fortunaResponse ||
        typeof fortunaResponse !== "object" ||
        Array.isArray(fortunaResponse)
      ) {
        throw new Error("FORTUNA returned an invalid response.");
      }

      if (
        typeof fortunaResponse.reply !== "string" ||
        !fortunaResponse.reply.trim()
      ) {
        throw new Error("FORTUNA returned an empty response.");
      }

      // ========================================
      // ADD FORTUNA RESPONSE TO TIMELINE
      // ========================================

      const assistantMessage = {
        role: "model",
        content: fortunaResponse.reply.trim(),
      };

      const conversationWithReply = [...updatedTimeline, assistantMessage];

      setTimeline(conversationWithReply);

      // ========================================
      // SAVE ACCUMULATED INTENT
      // ========================================

      const newIntent =
        fortunaResponse.intent &&
        typeof fortunaResponse.intent === "object" &&
        !Array.isArray(fortunaResponse.intent)
          ? fortunaResponse.intent
          : intent;

      setIntent(newIntent);

      // ========================================
      // VALIDATE DISCOVERY ACTION
      // ========================================
      //
      // FORTUNA / Gemini is the sole decision-maker.
      //
      // Valid actions:
      //
      // "continue"
      // "refine"
      // "discover"
      //
      // Invalid actions safely fall back to
      // normal conversation.
      // ========================================

      const validDiscoveryActions = ["continue", "refine", "discover"];

      const discoveryAction = validDiscoveryActions.includes(
        fortunaResponse.discoveryAction,
      )
        ? fortunaResponse.discoveryAction
        : "continue";

      // ========================================
      // CONTINUE
      // ========================================
      //
      // Normal conversation.
      // ========================================

      if (discoveryAction === "continue") {
        return;
      }

      // ========================================
      // REFINE
      // ========================================
      //
      // User changed or refined preferences.
      //
      // FORTUNA has already updated the intent.
      //
      // Do NOT trigger discovery automatically.
      // ========================================

      if (discoveryAction === "refine") {
        return;
      }

      // ========================================
      // DISCOVER
      // ========================================
      //
      // Only reach this point when FORTUNA
      // explicitly returned "discover".
      // ========================================

      if (discoveryAction !== "discover") {
        return;
      }

      // ========================================
      // VALIDATE DISCOVERY INTENT
      // ========================================

      if (
        !newIntent ||
        typeof newIntent !== "object" ||
        Array.isArray(newIntent)
      ) {
        throw new Error(
          "FORTUNA decided to discover but did not return a valid discovery intent.",
        );
      }

      // ========================================
      // MARK DISCOVERY ATTEMPT
      // ========================================
      //
      // At this point:
      //
      // - Gemini decided "discover"
      // - Fortuna Service validated readiness
      // - Frontend is allowed to call FDS
      // ========================================

      setDiscoveryAttempted(true);

      // ========================================
      // STEP 2
      // RUN DISCOVERY SERVICE
      // ========================================
      //
      // FORTUNA already decided discovery should
      // happen.
      //
      // FDS now:
      //
      // - Selects games
      // - Ranks games
      // - Generates reasons
      // - Avoids previously shown games
      //
      // FDS does NOT decide whether discovery
      // should happen.
      // ========================================

      const discoveryResponse = await discoverFortunaGames(
        newIntent,
        conversationWithReply,
        previousRecommendations,
      );

      // ========================================
      // VALIDATE DISCOVERY RESPONSE
      // ========================================

      if (
        !discoveryResponse ||
        typeof discoveryResponse !== "object" ||
        Array.isArray(discoveryResponse)
      ) {
        throw new Error("FORTUNA returned an invalid discovery response.");
      }

      // ========================================
      // EXTRACT DISCOVERED GAMES
      // ========================================

      const discoveredGames = Array.isArray(discoveryResponse.results)
        ? discoveryResponse.results
        : [];

      // ========================================
      // EXTRACT RECOMMENDATIONS
      // ========================================

      const fortunaRecommendations = Array.isArray(
        discoveryResponse.recommendations,
      )
        ? discoveryResponse.recommendations
        : [];

      // ========================================
      // NO RESULTS
      // ========================================
      //
      // Discovery was genuinely triggered by
      // FORTUNA, but no usable RAWG games were
      // retrieved.
      //
      // Keep the conversation intact.
      // ========================================

      if (discoveredGames.length === 0) {
        return;
      }

      // ========================================
      // CREATE DISCOVERY MESSAGE
      // ========================================

      const discoveryMessage = {
        type: "discovery",

        id:
          `discovery-${Date.now()}-` +
          `${Math.random().toString(36).slice(2, 8)}`,

        recommendations: fortunaRecommendations,

        games: discoveredGames,

        intent: newIntent,
      };

      // ========================================
      // ADD DISCOVERY TO TIMELINE
      // ========================================
      //
      // Previous discovery blocks remain visible.
      // ========================================

      setTimeline((currentTimeline) => [...currentTimeline, discoveryMessage]);
    } catch (err) {
      // ========================================
      // ERROR HANDLING
      // ========================================

      console.error("FORTUNA error:", err);

      setError(err?.message || "FORTUNA is unavailable right now.");
    } finally {
      // ========================================
      // STOP LOADING
      // ========================================

      setIsLoading(false);
    }
  }

  // ============================================
  // RESET FORTUNA
  // ============================================

  function resetFortuna() {
    setTimeline([]);

    setInput("");

    setIntent(null);

    setDiscoveryAttempted(false);

    setError(null);

    setIsLoading(false);
  }

  // ============================================
  // RETURN
  // ============================================

  return {
    // ==========================================
    // CONVERSATION
    // ==========================================

    timeline,

    // ==========================================
    // INPUT
    // ==========================================

    input,

    setInput,

    // ==========================================
    // LOADING
    // ==========================================

    loading: isLoading,

    isLoading,

    // ==========================================
    // INTENT
    // ==========================================

    intent,

    // ==========================================
    // DISCOVERY STATE
    // ==========================================

    discoveryAttempted,

    // ==========================================
    // ERROR
    // ==========================================

    error,

    // ==========================================
    // ACTIONS
    // ==========================================

    sendMessage,

    resetFortuna,
  };
}
