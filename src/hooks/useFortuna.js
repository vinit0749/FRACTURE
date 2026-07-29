import { useState } from "react";

import { sendFortunaMessage, discoverFortunaGames } from "../api/fortuna.js";

// ==============================================
// FORTUNA HOOK
// ==============================================

export function useFortuna() {
  // ============================================
  // CONVERSATION TIMELINE
  //
  // This contains BOTH:
  //
  // - User messages
  // - Fortuna messages
  // - Discovery result blocks
  //
  // Discovery blocks are kept in the UI timeline
  // but are excluded from chat history sent to
  // the chat API.
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
  // DISCOVERY INTENT
  //
  // Represents the user's CURRENT accumulated
  // preferences.
  //
  // This is sent to the backend on every new
  // FORTUNA message so the backend can preserve
  // preferences that the latest AI response may
  // accidentally omit.
  // ============================================

  const [intent, setIntent] = useState(null);

  // ============================================
  // ERROR
  // ============================================

  const [error, setError] = useState(null);

  // ============================================
  // SEND MESSAGE
  // ============================================

  async function sendMessage(message = input) {
    if (!message || typeof message !== "string") {
      return;
    }

    const trimmedMessage = message.trim();

    if (!trimmedMessage || isLoading) {
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
    // EXTRACT CHAT HISTORY
    //
    // Discovery blocks are UI-only.
    //
    // They should NOT be sent to the chat API
    // as conversation messages.
    // ==========================================

    const currentHistory = timeline
      .filter(
        (item) =>
          item &&
          (item.role === "user" || item.role === "model") &&
          typeof item.content === "string",
      )
      .map((item) => ({
        role: item.role,
        content: item.content,
      }));

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
      //
      // IMPORTANT:
      //
      // Send the CURRENT accumulated intent along
      // with the conversation.
      //
      // This protects previously extracted
      // preferences if the AI returns an intent
      // that accidentally omits them.
      // ========================================

      const fortunaResponse = await sendFortunaMessage(
        trimmedMessage,
        currentHistory,
        intent,
      );

      if (!fortunaResponse?.reply) {
        throw new Error("FORTUNA returned an empty response.");
      }

      // ========================================
      // ADD FORTUNA RESPONSE
      // ========================================

      const assistantMessage = {
        role: "model",
        content: fortunaResponse.reply,
      };

      const conversationWithReply = [...updatedTimeline, assistantMessage];

      setTimeline(conversationWithReply);

      // ========================================
      // SAVE CURRENT ACCUMULATED INTENT
      // ========================================

      const newIntent = fortunaResponse?.intent || intent || null;

      setIntent(newIntent);

      // ========================================
      // CHECK DISCOVERY READINESS
      // ========================================

      const readyForDiscovery = newIntent?.readyForDiscovery === true;

      // ========================================
      // FORTUNA NEEDS MORE INFORMATION
      // ========================================

      if (!readyForDiscovery) {
        return;
      }

      // ========================================
      // VALIDATE INTENT
      // ========================================

      if (!newIntent) {
        throw new Error(
          "FORTUNA is ready for discovery but did not return a valid discovery intent.",
        );
      }

      // ========================================
      // STEP 2
      // DISCOVER GAMES
      //
      // IMPORTANT:
      //
      // Use the COMPLETE conversation up to this
      // point.
      //
      // This allows FORTUNA to understand both
      // the current request and everything that
      // came before it.
      // ========================================

      const discoveryHistory = [...conversationWithReply];

      const discoveryResponse = await discoverFortunaGames(
        newIntent,
        discoveryHistory,
      );

      // ========================================
      // VALIDATE DISCOVERY RESPONSE
      // ========================================

      const discoveredGames = Array.isArray(discoveryResponse?.results)
        ? discoveryResponse.results
        : [];

      const fortunaRecommendations = Array.isArray(
        discoveryResponse?.recommendations,
      )
        ? discoveryResponse.recommendations
        : [];

      // ========================================
      // ADD DISCOVERY TO TIMELINE
      //
      // DO NOT REPLACE PREVIOUS DISCOVERIES.
      //
      // Every discovery becomes part of the
      // permanent conversation timeline.
      // ========================================

      if (discoveredGames.length > 0) {
        const discoveryMessage = {
          type: "discovery",

          id: `discovery-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

          analysis: discoveryResponse?.analysis || "",

          recommendations: fortunaRecommendations,

          games: discoveredGames,

          intent: newIntent,
        };

        setTimeline((currentTimeline) => [
          ...currentTimeline,
          discoveryMessage,
        ]);
      }
    } catch (err) {
      console.error("FORTUNA error:", err);

      setError(err.message || "FORTUNA is unavailable right now.");
    } finally {
      // ========================================
      // STOP LOADING
      // ========================================

      setIsLoading(false);
    }
  }

  // ============================================
  // RESET FORTUNA
  //
  // Starts a completely fresh conversation.
  // ============================================

  function resetFortuna() {
    setTimeline([]);

    setInput("");

    setIntent(null);

    setError(null);

    setIsLoading(false);
  }

  // ============================================
  // RETURN
  // ============================================

  return {
    // ==========================================
    // CONVERSATION TIMELINE
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
    // CURRENT DISCOVERY INTENT
    // ==========================================

    intent,

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
