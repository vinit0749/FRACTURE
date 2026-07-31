const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// ==============================================
// FORTUNA CHAT
// ==============================================
//
// Sends the user's conversation to FORTUNA.
//
// FORTUNA / Gemini is responsible for:
// - Understanding the conversation
// - Maintaining accumulated intent
// - Deciding whether to continue
// - Deciding whether preferences are being refined
// - Deciding whether discovery should trigger
//
// The frontend does NOT decide whether discovery
// should happen.
//
// FORTUNA returns:
//
// discoveryAction:
// - "continue"
// - "refine"
// - "discover"
// ==============================================

export async function sendFortunaMessage(message, history = [], intent = null) {
  if (!message || typeof message !== "string") {
    throw new Error("A valid FORTUNA message is required.");
  }

  if (!Array.isArray(history)) {
    throw new Error("FORTUNA conversation history must be an array.");
  }

  if (
    intent !== null &&
    (typeof intent !== "object" || Array.isArray(intent))
  ) {
    throw new Error("FORTUNA intent must be an object or null.");
  }

  const response = await fetch(`${BASE_URL}/fortuna/chat`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      message: message.trim(),
      history,
      intent: intent || {},
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.message || `FORTUNA backend error ${response.status}`,
    );
  }

  const data = await response.json();

  // ============================================
  // VALIDATE FORTUNA RESPONSE
  // ============================================

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("FORTUNA returned an invalid response.");
  }

  if (!data.reply || typeof data.reply !== "string") {
    throw new Error("FORTUNA returned an empty response.");
  }

  // ============================================
  // VALIDATE DISCOVERY ACTION
  // ============================================
  //
  // FORTUNA / Gemini is the sole decision-maker.
  //
  // The frontend trusts the backend decision.
  //
  // Valid values:
  //
  // continue
  // refine
  // discover
  // ============================================

  if (!["continue", "refine", "discover"].includes(data.discoveryAction)) {
    throw new Error("FORTUNA returned an invalid discovery action.");
  }

  // ============================================
  // VALIDATE INTENT
  // ============================================

  if (
    !data.intent ||
    typeof data.intent !== "object" ||
    Array.isArray(data.intent)
  ) {
    throw new Error("FORTUNA returned an invalid intent.");
  }

  return {
    reply: data.reply,
    discoveryAction: data.discoveryAction,
    intent: data.intent,
    replacePreferences:
      typeof data.replacePreferences === "boolean"
        ? data.replacePreferences
        : false,
  };
}

// ==============================================
// FORTUNA DISCOVERY
// ==============================================
//
// This function executes the discovery pipeline
// AFTER FORTUNA has decided:
//
// discoveryAction === "discover"
//
// The frontend does not independently decide
// whether discovery is appropriate.
//
// Flow:
//
// FORTUNA
//    ↓
// discoveryAction: "discover"
//    ↓
// useFortuna.js
//    ↓
// discoverFortunaGames()
//    ↓
// FORTUNA Discovery Service
//    ↓
// Gemini selects games
//    ↓
// RAWG retrieves games
//
// `previousRecommendations` allows FDS to:
// - Avoid previously shown games
// - Use previous games as taste signals
// - Find fresh games for "more" requests
// ==============================================

export async function discoverFortunaGames(
  intent,
  history = [],
  previousRecommendations = [],
) {
  if (!intent || typeof intent !== "object" || Array.isArray(intent)) {
    throw new Error("A valid FORTUNA discovery intent is required.");
  }

  if (!Array.isArray(history)) {
    throw new Error("FORTUNA conversation history must be an array.");
  }

  if (!Array.isArray(previousRecommendations)) {
    throw new Error("FORTUNA previous recommendations must be an array.");
  }

  const response = await fetch(`${BASE_URL}/fortuna/discover`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      intent,
      history,
      previousRecommendations,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.message || `FORTUNA backend error ${response.status}`,
    );
  }

  const data = await response.json();

  // ============================================
  // VALIDATE DISCOVERY RESPONSE
  // ============================================

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("FORTUNA returned an invalid discovery response.");
  }

  // ============================================
  // VALIDATE RESULTS
  // ============================================

  if (!Array.isArray(data.results)) {
    throw new Error("FORTUNA returned invalid discovery results.");
  }

  // ============================================
  // VALIDATE RECOMMENDATIONS
  // ============================================

  if (
    data.recommendations !== undefined &&
    !Array.isArray(data.recommendations)
  ) {
    throw new Error("FORTUNA returned invalid recommendation data.");
  }

  return data;
}
