const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// ==============================================
// FORTUNA CHAT
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
      message,
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

  // ==========================================
  // VALIDATE FORTUNA RESPONSE
  // ==========================================

  if (!data || typeof data !== "object") {
    throw new Error("FORTUNA returned an invalid response.");
  }

  if (!data.reply || typeof data.reply !== "string") {
    throw new Error("FORTUNA returned an empty response.");
  }

  return data;
}

// ==============================================
// FORTUNA DISCOVERY
// ==============================================
//
// FORTUNA is responsible for:
// - Understanding the user's taste
// - Choosing the best games
// - Explaining why each game fits
//
// RAWG is responsible only for:
// - Retrieving the actual game data
// - Providing game IDs
// - Providing images
// - Providing ratings
// - Providing genres
// - Providing release dates
//
// The full conversation is sent so FORTUNA
// can make recommendations based on everything
// the user said, not only the final structured intent.
// ==============================================

export async function discoverFortunaGames(intent, history = []) {
  if (!intent || typeof intent !== "object") {
    throw new Error("A valid FORTUNA discovery intent is required.");
  }

  if (!Array.isArray(history)) {
    throw new Error("FORTUNA conversation history must be an array.");
  }

  const response = await fetch(`${BASE_URL}/fortuna/discover`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      intent,
      history,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.message || `FORTUNA backend error ${response.status}`,
    );
  }

  const data = await response.json();

  // ==========================================
  // VALIDATE DISCOVERY RESPONSE
  // ==========================================

  if (!data || typeof data !== "object") {
    throw new Error("FORTUNA returned an invalid discovery response.");
  }

  return data;
}
