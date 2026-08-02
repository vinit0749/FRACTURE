import auth from "../firebase/auth.js";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// ==============================================
// FORTUNA AUTH TOKEN
// ==============================================
//
// History endpoints require Firebase authentication.
//
// Returns the current user's Firebase ID token.
// ==============================================

async function getFortunaAuthToken() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You must be signed in to access FORTUNA history.");
  }

  return user.getIdToken();
}

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
// GENERATE FORTUNA CONVERSATION TITLE
// ==============================================
//
// Sends the FULL conversation context and the
// accumulated intent to FORTUNA / Gemini.
//
// Gemini is responsible for generating a concise,
// meaningful title based on the actual conversation.
//
// The frontend does NOT choose the title from:
// - The 3rd message
// - The latest message
// - A hardcoded string
//
// Example:
//
// User:
// "I want an open-world game."
// "Something with fantasy would be nice."
// "I also want good exploration."
//
// Gemini may generate:
//
// "Open-World Fantasy Exploration"
//
// The title is based on the complete context,
// not simply the third message.
// ==============================================

export async function generateFortunaTitle(history = [], intent = {}) {
  if (!Array.isArray(history)) {
    throw new Error("FORTUNA conversation history must be an array.");
  }

  if (!intent || typeof intent !== "object" || Array.isArray(intent)) {
    throw new Error("FORTUNA intent must be an object.");
  }

  const response = await fetch(`${BASE_URL}/fortuna/title`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      history,
      intent,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.message || `FORTUNA title generation error ${response.status}`,
    );
  }

  const data = await response.json();

  // ============================================
  // VALIDATE TITLE RESPONSE
  // ============================================

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("FORTUNA returned an invalid title response.");
  }

  if (typeof data.title !== "string" || !data.title.trim()) {
    throw new Error("FORTUNA returned an invalid conversation title.");
  }

  return data.title.trim();
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

// ==============================================
// CREATE FORTUNA CONVERSATION
// ==============================================
//
// Creates a new persisted FORTUNA conversation.
//
// Used when the user sends the first message in
// a new FORTUNA session.
// ==============================================

export async function createFortunaConversation({
  title = "New Discovery",
  timeline = [],
  intent = {},
} = {}) {
  if (!Array.isArray(timeline)) {
    throw new Error("FORTUNA conversation timeline must be an array.");
  }

  if (!intent || typeof intent !== "object" || Array.isArray(intent)) {
    throw new Error("FORTUNA conversation intent must be an object.");
  }

  const token = await getFortunaAuthToken();

  const response = await fetch(`${BASE_URL}/fortuna/history`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify({
      title:
        typeof title === "string" && title.trim()
          ? title.trim()
          : "New Discovery",

      timeline,

      intent,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.message ||
        `Failed to create FORTUNA conversation (${response.status}).`,
    );
  }

  const data = await response.json();

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("FORTUNA returned an invalid conversation response.");
  }

  if (
    !data.conversation ||
    typeof data.conversation !== "object" ||
    Array.isArray(data.conversation)
  ) {
    throw new Error("FORTUNA returned an invalid conversation.");
  }

  return data.conversation;
}

// ==============================================
// UPDATE FORTUNA CONVERSATION
// ==============================================
//
// Updates an existing persisted FORTUNA
// conversation.
//
// Used after the conversation has already been
// created and new messages or discovery blocks
// need to be saved.
// ==============================================

export async function updateFortunaConversation(
  conversationId,
  { title, timeline, intent } = {},
) {
  if (!conversationId || typeof conversationId !== "string") {
    throw new Error("A valid FORTUNA conversation ID is required.");
  }

  if (timeline !== undefined && !Array.isArray(timeline)) {
    throw new Error("FORTUNA conversation timeline must be an array.");
  }

  if (
    intent !== undefined &&
    (!intent || typeof intent !== "object" || Array.isArray(intent))
  ) {
    throw new Error("FORTUNA conversation intent must be an object.");
  }

  const token = await getFortunaAuthToken();

  const updateData = {};

  if (title !== undefined) {
    updateData.title = title;
  }

  if (timeline !== undefined) {
    updateData.timeline = timeline;
  }

  if (intent !== undefined) {
    updateData.intent = intent;
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("No FORTUNA conversation data was provided.");
  }

  const response = await fetch(
    `${BASE_URL}/fortuna/history/${conversationId}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(updateData),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.message ||
        `Failed to update FORTUNA conversation (${response.status}).`,
    );
  }

  const data = await response.json();

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("FORTUNA returned an invalid conversation response.");
  }

  if (
    !data.conversation ||
    typeof data.conversation !== "object" ||
    Array.isArray(data.conversation)
  ) {
    throw new Error("FORTUNA returned an invalid conversation.");
  }

  return data.conversation;
}

// ==============================================
// GET FORTUNA CONVERSATION HISTORY
// ==============================================
//
// Returns the authenticated user's saved
// FORTUNA conversations.
//
// Used to populate the FORTUNA history sidebar.
// ==============================================

export async function getFortunaConversations() {
  const token = await getFortunaAuthToken();

  const response = await fetch(`${BASE_URL}/fortuna/history`, {
    method: "GET",

    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.message ||
        `Failed to fetch FORTUNA conversation history (${response.status}).`,
    );
  }

  const data = await response.json();

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("FORTUNA returned an invalid history response.");
  }

  if (!Array.isArray(data.conversations)) {
    throw new Error("FORTUNA returned invalid conversation history.");
  }

  return data.conversations;
}

// ==============================================
// GET SINGLE FORTUNA CONVERSATION
// ==============================================
//
// Returns one complete saved FORTUNA conversation,
// including its timeline and accumulated intent.
//
// Used when the user selects a conversation from
// the history sidebar.
// ==============================================

export async function getFortunaConversation(conversationId) {
  if (!conversationId || typeof conversationId !== "string") {
    throw new Error("A valid FORTUNA conversation ID is required.");
  }

  const token = await getFortunaAuthToken();

  const response = await fetch(
    `${BASE_URL}/fortuna/history/${conversationId}`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.message ||
        `Failed to fetch FORTUNA conversation (${response.status}).`,
    );
  }

  const data = await response.json();

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("FORTUNA returned an invalid conversation response.");
  }

  if (
    !data.conversation ||
    typeof data.conversation !== "object" ||
    Array.isArray(data.conversation)
  ) {
    throw new Error("FORTUNA returned an invalid conversation.");
  }

  return data.conversation;
}

// ==============================================
// DELETE FORTUNA CONVERSATION
// ==============================================
//
// Permanently deletes one saved FORTUNA
// conversation belonging to the authenticated user.
// ==============================================

export async function deleteFortunaConversation(conversationId) {
  if (!conversationId || typeof conversationId !== "string") {
    throw new Error("A valid FORTUNA conversation ID is required.");
  }

  const token = await getFortunaAuthToken();

  const response = await fetch(
    `${BASE_URL}/fortuna/history/${conversationId}`,
    {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.message ||
        `Failed to delete FORTUNA conversation (${response.status}).`,
    );
  }

  const data = await response.json();

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("FORTUNA returned an invalid delete response.");
  }

  return data;
}
