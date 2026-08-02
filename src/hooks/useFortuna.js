import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext.jsx";

import {
  sendFortunaMessage,
  generateFortunaTitle,
  discoverFortunaGames,
  createFortunaConversation,
  updateFortunaConversation,
  getFortunaConversations,
  getFortunaConversation,
  deleteFortunaConversation,
} from "../api/fortuna.js";

// ==============================================
// EXTRACT PREVIOUSLY SHOWN GAMES
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

        if (title) {
          previousRecommendations.push({
            title,
            reason,
          });
        }
      }
    }

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

        if (title) {
          previousRecommendations.push({
            title,
            reason,
          });
        }
      }
    }
  }

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
  // AUTHENTICATION
  // ============================================

  const { user, loading: authLoading, isAuthenticated } = useAuth();

  // ============================================
  // CONVERSATION TIMELINE
  // ============================================

  const [timeline, setTimeline] = useState([]);

  // ============================================
  // PERSISTED CONVERSATION ID
  // ============================================

  const [conversationId, setConversationId] = useState(null);

  // ============================================
  // CONVERSATION HISTORY
  // ============================================

  const [conversations, setConversations] = useState([]);

  // ============================================
  // HISTORY LOADING
  // ============================================

  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

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

  const [discoveryAttempted, setDiscoveryAttempted] = useState(false);

  // ============================================
  // ERROR
  // ============================================

  const [error, setError] = useState(null);

  // ============================================
  // HISTORY ERROR
  // ============================================

  const [historyError, setHistoryError] = useState(null);

  // ============================================
  // PERSIST CONVERSATION
  // ============================================

  async function persistConversation({ nextTimeline, nextIntent, title }) {
    // ==========================================
    // GUEST USERS
    // ==========================================

    if (authLoading || !isAuthenticated || !user) {
      return null;
    }

    if (!Array.isArray(nextTimeline)) {
      throw new Error("FORTUNA timeline must be an array.");
    }

    if (
      !nextIntent ||
      typeof nextIntent !== "object" ||
      Array.isArray(nextIntent)
    ) {
      throw new Error("FORTUNA intent must be an object.");
    }

    // ==========================================
    // CREATE NEW CONVERSATION
    // ==========================================

    if (!conversationId) {
      const conversation = await createFortunaConversation({
        title:
          typeof title === "string" && title.trim()
            ? title.trim()
            : "New Discovery",

        timeline: nextTimeline,

        intent: nextIntent,
      });

      if (!conversation || !conversation._id) {
        throw new Error("FORTUNA conversation was created without a valid ID.");
      }

      setConversationId(conversation._id);

      // ========================================
      // UPDATE SIDEBAR HISTORY
      // ========================================

      setConversations((previous) => {
        const exists = previous.some(
          (item) => String(item._id) === String(conversation._id),
        );

        if (exists) {
          return previous.map((item) =>
            String(item._id) === String(conversation._id) ? conversation : item,
          );
        }

        return [conversation, ...previous];
      });

      return conversation;
    }

    // ==========================================
    // UPDATE EXISTING CONVERSATION
    // ==========================================

    const conversation = await updateFortunaConversation(conversationId, {
      ...(title !== undefined ? { title } : {}),
      timeline: nextTimeline,
      intent: nextIntent,
    });

    if (!conversation || !conversation._id) {
      throw new Error(
        "FORTUNA conversation update returned an invalid conversation.",
      );
    }

    // ==========================================
    // UPDATE SIDEBAR METADATA
    // ==========================================

    setConversations((previous) =>
      previous.map((item) =>
        String(item._id) === String(conversation._id)
          ? {
              ...item,
              title: conversation.title,
              createdAt: conversation.createdAt,
              updatedAt: conversation.updatedAt,
            }
          : item,
      ),
    );

    return conversation;
  }

  // ============================================
  // LOAD CONVERSATION HISTORY
  // ============================================

  const loadConversations = useCallback(async () => {
    if (authLoading) {
      return [];
    }

    if (!isAuthenticated || !user) {
      setConversations([]);
      setHistoryError(null);
      setIsHistoryLoading(false);

      return [];
    }

    setIsHistoryLoading(true);
    setHistoryError(null);

    try {
      const savedConversations = await getFortunaConversations();

      if (!Array.isArray(savedConversations)) {
        throw new Error("FORTUNA returned invalid conversation history.");
      }

      setConversations(savedConversations);

      return savedConversations;
    } catch (err) {
      console.error("FORTUNA history loading error:", err);

      setHistoryError(
        err?.message || "Failed to load FORTUNA conversation history.",
      );

      return [];
    } finally {
      setIsHistoryLoading(false);
    }
  }, [authLoading, isAuthenticated, user]);

  // ============================================
  // LOAD SINGLE CONVERSATION
  // ============================================

  const loadConversation = useCallback(
    async (id) => {
      if (!id || typeof id !== "string") {
        throw new Error("A valid FORTUNA conversation ID is required.");
      }

      if (authLoading || !isAuthenticated || !user) {
        throw new Error("You must be signed in to access FORTUNA history.");
      }

      setIsLoading(true);
      setError(null);

      try {
        const conversation = await getFortunaConversation(id);

        if (
          !conversation ||
          typeof conversation !== "object" ||
          Array.isArray(conversation)
        ) {
          throw new Error("FORTUNA returned an invalid conversation.");
        }

        const restoredTimeline = Array.isArray(conversation.timeline)
          ? conversation.timeline
          : [];

        const restoredIntent =
          conversation.intent &&
          typeof conversation.intent === "object" &&
          !Array.isArray(conversation.intent)
            ? conversation.intent
            : {};

        setConversationId(conversation._id);

        setTimeline(restoredTimeline);

        setIntent(restoredIntent);

        setInput("");

        setDiscoveryAttempted(
          restoredTimeline.some((item) => item && item.type === "discovery"),
        );

        return conversation;
      } catch (err) {
        console.error("FORTUNA conversation loading error:", err);

        setError(err?.message || "Failed to load FORTUNA conversation.");

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [authLoading, isAuthenticated, user],
  );

  // ============================================
  // DELETE CONVERSATION
  // ============================================

  const removeConversation = useCallback(
    async (id) => {
      if (!id || typeof id !== "string") {
        throw new Error("A valid FORTUNA conversation ID is required.");
      }

      if (authLoading || !isAuthenticated || !user) {
        throw new Error("You must be signed in to access FORTUNA history.");
      }

      await deleteFortunaConversation(id);

      setConversations((previous) =>
        previous.filter(
          (conversation) => String(conversation._id) !== String(id),
        ),
      );

      if (String(conversationId) === String(id)) {
        setTimeline([]);
        setIntent(null);
        setConversationId(null);
        setInput("");
        setDiscoveryAttempted(false);
        setError(null);
      }
    },
    [authLoading, isAuthenticated, user, conversationId],
  );

  // ============================================
  // SEND MESSAGE
  // ============================================

  async function sendMessage(message = input) {
    if (typeof message !== "string" || !message.trim()) {
      return;
    }

    if (isLoading) {
      return;
    }

    const trimmedMessage = message.trim();

    setError(null);
    setIsLoading(true);
    setDiscoveryAttempted(false);

    // ==========================================
    // BUILD FORTUNA CHAT HISTORY
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
    // COLLECT PREVIOUS RECOMMENDATIONS
    // ==========================================

    const previousRecommendations = extractPreviousRecommendations(timeline);

    // ==========================================
    // ADD USER MESSAGE
    // ==========================================

    const userMessage = {
      role: "user",
      content: trimmedMessage,
    };

    const updatedTimeline = [...timeline, userMessage];

    setTimeline(updatedTimeline);

    setInput("");

    try {
      // ========================================
      // STEP 1: ASK FORTUNA
      // ========================================

      const fortunaResponse = await sendFortunaMessage(
        trimmedMessage,
        chatHistory,
        intent,
      );

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
      // ADD FORTUNA RESPONSE
      // ========================================

      const assistantMessage = {
        role: "model",
        content: fortunaResponse.reply.trim(),
      };

      const conversationWithReply = [...updatedTimeline, assistantMessage];

      setTimeline(conversationWithReply);

      // ========================================
      // UPDATE INTENT
      // ========================================

      const newIntent =
        fortunaResponse.intent &&
        typeof fortunaResponse.intent === "object" &&
        !Array.isArray(fortunaResponse.intent)
          ? fortunaResponse.intent
          : intent || {};

      setIntent(newIntent);

      // ========================================
      // DETERMINE WHETHER TITLE SHOULD
      // BE GENERATED
      // ========================================
      //
      // The title is now generated by
      // FORTUNA / Gemini.
      //
      // We generate it once there is enough
      // conversation context.
      //
      // For a new conversation:
      //
      // Message 1:
      // Create "New Discovery"
      //
      // Message 2:
      // Update conversation normally
      //
      // Message 3:
      // Generate a meaningful Gemini title
      //
      // After that:
      // Keep the existing title.
      // ========================================

      const userMessageCount = conversationWithReply.filter(
        (item) =>
          item &&
          item.role === "user" &&
          typeof item.content === "string" &&
          item.content.trim(),
      ).length;

      let generatedTitle;

      if (userMessageCount === 3 && isAuthenticated && user) {
        generatedTitle = await generateFortunaTitle(
          conversationWithReply,
          newIntent,
        );
      }

      // ========================================
      // DETERMINE TITLE
      // ========================================

      const conversationTitle = generatedTitle || undefined;

      // ========================================
      // PERSIST CHAT MESSAGE
      // ========================================

      await persistConversation({
        nextTimeline: conversationWithReply,

        nextIntent: newIntent,

        ...(conversationTitle
          ? {
              title: conversationTitle,
            }
          : {}),
      });

      // ========================================
      // DETERMINE DISCOVERY ACTION
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

      if (discoveryAction === "continue") {
        return;
      }

      // ========================================
      // REFINE
      // ========================================

      if (discoveryAction === "refine") {
        return;
      }

      // ========================================
      // DISCOVER
      // ========================================

      if (discoveryAction !== "discover") {
        return;
      }

      if (
        !newIntent ||
        typeof newIntent !== "object" ||
        Array.isArray(newIntent)
      ) {
        throw new Error(
          "FORTUNA decided to discover but did not return a valid discovery intent.",
        );
      }

      setDiscoveryAttempted(true);

      // ========================================
      // STEP 2: DISCOVERY SERVICE
      // ========================================

      const discoveryResponse = await discoverFortunaGames(
        newIntent,
        conversationWithReply,
        previousRecommendations,
      );

      if (
        !discoveryResponse ||
        typeof discoveryResponse !== "object" ||
        Array.isArray(discoveryResponse)
      ) {
        throw new Error("FORTUNA returned an invalid discovery response.");
      }

      const discoveredGames = Array.isArray(discoveryResponse.results)
        ? discoveryResponse.results
        : [];

      const fortunaRecommendations = Array.isArray(
        discoveryResponse.recommendations,
      )
        ? discoveryResponse.recommendations
        : [];

      // ========================================
      // NO RESULTS
      // ========================================

      if (discoveredGames.length === 0) {
        return;
      }

      // ========================================
      // CREATE DISCOVERY BLOCK
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

      const finalTimeline = [...conversationWithReply, discoveryMessage];

      setTimeline(finalTimeline);

      // ========================================
      // PERSIST DISCOVERY RESULT
      // ========================================

      await persistConversation({
        nextTimeline: finalTimeline,

        nextIntent: newIntent,
      });
    } catch (err) {
      console.error("FORTUNA error:", err);

      setError(err?.message || "FORTUNA is unavailable right now.");
    } finally {
      setIsLoading(false);
    }
  }

  // ============================================
  // RESET / NEW DISCOVERY
  // ============================================

  function resetFortuna() {
    setTimeline([]);

    setInput("");

    setIntent(null);

    setConversationId(null);

    setDiscoveryAttempted(false);

    setError(null);

    setIsLoading(false);
  }

  // ============================================
  // INITIAL HISTORY LOAD
  // ============================================

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      setConversations([]);
      setHistoryError(null);

      return;
    }

    loadConversations();
  }, [authLoading, isAuthenticated, user, loadConversations]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // Current conversation
    timeline,
    conversationId,
    intent,

    // Authentication
    user,
    isAuthenticated,
    authLoading,

    // History
    conversations,
    isHistoryLoading,
    historyError,

    loadConversations,
    loadConversation,
    removeConversation,

    // Input
    input,
    setInput,

    // Loading
    loading: isLoading,
    isLoading,

    // Discovery
    discoveryAttempted,

    // Errors
    error,

    // Actions
    sendMessage,
    resetFortuna,
  };
}
