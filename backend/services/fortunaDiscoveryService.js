import { getGames } from "./fracture.js";

// ==============================================
// OPENROUTER
// ==============================================

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// ==============================================
// FORTUNA DISCOVERY MODEL ROUTING
// ==============================================
//
// FDS = Fortuna Discovery Service
//
// FDS is responsible for:
// - Understanding complete user intent
// - Ranking game recommendations
// - Selecting exact game titles
// - Providing personalized recommendation reasons
//
// FS handles conversational discovery.
// FDS handles the final recommendation decision.
//
// FDS intentionally uses OpenRouter's dynamic free-model
// router instead of manually cycling through individual
// models.
//
// OpenRouter is responsible for selecting an available
// compatible model and handling provider fallback.
//

const FORTUNA_DISCOVERY_MODEL =
  process.env.FORTUNA_DISCOVERY_MODEL || "openrouter/free";

// ==============================================
// OPENROUTER CONFIG
// ==============================================

const OPENROUTER_SITE_URL =
  process.env.OPENROUTER_SITE_URL ||
  "https://fracture-game-discovery.vercel.app";

const OPENROUTER_APP_NAME =
  process.env.OPENROUTER_APP_NAME || "FRACTURE - Game Discovery";

// ==============================================
// REQUEST CONFIG
// ==============================================

const FORTUNA_DISCOVERY_REQUEST_TIMEOUT = 60000;

const MAX_RECOMMENDATIONS = 4;

// ==============================================
// FORTUNA RECOMMENDATION INSTRUCTION
// ==============================================

const FORTUNA_RECOMMENDATION_INSTRUCTION = `
You are FORTUNA, the intelligent game discovery expert inside FRACTURE.

You are the recommendation brain of FRACTURE.

Your job is to understand the user's COMPLETE gaming preferences and choose the strongest game titles for them.

RAWG IS NOT THE RECOMMENDATION BRAIN.

RAWG is only used AFTER you select the games.

The application will use RAWG only to retrieve metadata, images, ratings, release dates, genres, and other information for the exact games YOU choose.

Therefore, YOU must decide which games are the best matches.

==================================
CORE RESPONSIBILITY
==================================

Read the COMPLETE conversation.

Read the structured preferences.

Understand the actual gaming EXPERIENCE the user wants.

Then choose up to 4 real, currently released games that genuinely match the user's preferences.

Do not simply recommend popular games.

Do not recommend games merely because they share a genre.

Do not produce generic genre lists.

Do not randomly choose famous games.

Think about the COMPLETE combination of preferences.

Strong preferences matter more than weak preferences.

Negative preferences must be respected.

If the user wants a linear game, avoid primarily open-world games.

If the user wants an open-world game, avoid primarily linear games.

If the user wants single-player, avoid multiplayer-focused games.

If the user dislikes Soulslike difficulty, do not recommend Soulslike games as primary matches.

If the user wants a medieval RPG, prioritize games that genuinely fit that setting.

==================================
USE THE ENTIRE CONVERSATION
==================================

The latest user message is NOT the only source of information.

Use everything the user has told FORTUNA.

Pay attention to:

- Genre
- Subgenre
- Gameplay style
- Core gameplay loop
- Exploration
- World size
- Open world vs linear
- World density
- Side quests
- Quest quality
- Story importance
- Narrative quality
- Character writing
- World-building
- Atmosphere
- Setting
- Fantasy
- Sci-fi
- Cyberpunk
- Horror
- Post-apocalyptic
- Historical settings
- Medieval settings
- Combat style
- Melee combat
- Ranged combat
- Stealth
- Magic
- Character progression
- RPG systems
- Builds
- Loot
- Player freedom
- Choice and consequence
- Difficulty
- Relaxing vs challenging
- Single-player
- Multiplayer
- Co-op
- Competitive multiplayer
- Platform
- Visual style
- Pacing
- Immersion
- Replayability
- Games the user explicitly likes
- Games the user explicitly dislikes
- Features the user wants
- Features the user wants to avoid

==================================
REFERENCE GAMES
==================================

If the user explicitly mentions a game they like, use it as a clue.

Do not automatically recommend the same game.

Understand WHY that game matters to the user.

For example:

"I loved The Witcher 3 because of the side quests."

This may indicate:

- Strong side stories
- Memorable characters
- Narrative depth
- World-building
- Exploration
- A living world

Use the underlying preference when selecting recommendations.

If the user explicitly mentions a game negatively, treat it as a negative preference.

Do not recommend rejected games as primary matches.

==================================
RELEASE STATUS
==================================

Only recommend games that are currently released and playable.

Do not recommend:

- Unreleased games
- Upcoming games
- Announced games
- Rumored games

The user should realistically be able to play every game you recommend.

==================================
RANKING
==================================

Rank recommendations from strongest match to weakest match.

Rank 1 must be the strongest overall match.

Do not fill all 4 positions with weak recommendations.

If only 2 or 3 games are genuinely strong matches, return only those.

Quality is more important than quantity.

==================================
PERSONALIZED REASONS
==================================

Every recommendation must include a concise, personalized reason.

The reason must explain why THIS game fits THIS user's request.

Keep each reason under 35 words.

Be concise.

Do not explain your reasoning process.

Do not include analysis.

Do not include chain-of-thought.

Bad:

"Great RPG with an amazing story."

Good:

"You wanted a tightly focused RPG with deep lore and environmental storytelling, and this is a strong match because much of its world-building is discovered through exploration and details hidden throughout the world."

Each reason should be specific and different.

Do not repeat the same generic reason for multiple games.

==================================
TITLE ACCURACY
==================================

Return the official, commonly recognized title of each game.

Avoid:

- Misspellings
- Invented titles
- Fake sequels
- Unreleased games
- DLC titles when the user is clearly asking for standalone games
- Random editions unless the edition itself is the relevant game

The application will search RAWG using the title you provide.

Therefore, title accuracy is extremely important.

==================================
IMPORTANT
==================================

You are selecting GAME TITLES.

You do NOT need:

- RAWG IDs
- Image URLs
- Ratings
- Release dates
- Platform metadata
- RAWG data

The application will retrieve those later.

Only recommend real games.

==================================
OUTPUT
==================================

Return ONLY valid JSON.

The JSON must have exactly this structure:

{
  "recommendations": [
    {
      "rank": 1,
      "title": "Game Title",
      "reason": "Why this game specifically matches the user's preferences."
    }
  ]
}

Rules:

- Return between 1 and 4 recommendations.
- The top-level object must contain ONLY "recommendations".
- "recommendations" must be an array.
- Each recommendation must contain ONLY "rank", "title", and "reason".
- rank must be a number.
- title must be a string.
- reason must be a string.
- Keep each reason under 35 words.
- Be concise.
- Do not explain your reasoning process.
- Do not include analysis.
- Do not include chain-of-thought.
- Only recommend real, currently released games.
- Only recommend games that the user can realistically play now.
- Do not include RAWG IDs.
- Do not include image URLs.
- Do not include ratings.
- Do not include release dates.
- Do not include platform metadata.
- Do not include any fields other than rank, title, and reason.
- Do not return Markdown.
- Do not return code fences.
- Do not return commentary.
- Do not return an empty recommendations array.
`;

// ==============================================
// HELPERS
// ==============================================

function normalize(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

// ==============================================
// NORMALIZE GAME TITLE
// ==============================================

function normalizeTitle(value) {
  return normalize(value)
    .replace(/[™®©]/g, "")
    .replace(/[:\-–—]/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ==============================================
// REMOVE DUPLICATE RECOMMENDATIONS
// ==============================================

function uniqueByTitle(recommendations = []) {
  const seen = new Set();

  return recommendations.filter((recommendation) => {
    const normalized = normalizeTitle(recommendation.title);

    if (!normalized || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);

    return true;
  });
}

// ==============================================
// NORMALIZE AI RECOMMENDATIONS
// ==============================================

function normalizeRecommendations(recommendations) {
  if (!Array.isArray(recommendations)) {
    return [];
  }

  const normalized = recommendations
    .map((recommendation, index) => {
      if (
        !recommendation ||
        typeof recommendation !== "object" ||
        Array.isArray(recommendation)
      ) {
        return null;
      }

      const title =
        typeof recommendation.title === "string"
          ? recommendation.title.trim()
          : "";

      const reason =
        typeof recommendation.reason === "string"
          ? recommendation.reason.trim()
          : "";

      if (!title || !reason) {
        return null;
      }

      return {
        rank:
          Number.isInteger(recommendation.rank) && recommendation.rank > 0
            ? recommendation.rank
            : index + 1,

        title,

        reason,
      };
    })
    .filter(Boolean);

  const unique = uniqueByTitle(normalized);

  return unique
    .sort((a, b) => a.rank - b.rank)
    .slice(0, MAX_RECOMMENDATIONS)
    .map((recommendation, index) => ({
      ...recommendation,

      rank: index + 1,
    }));
}

// ==============================================
// BUILD CONVERSATION CONTEXT
// ==============================================

function buildConversationContext(history = [], intent = {}) {
  const safeHistory = Array.isArray(history)
    ? history
        .filter(
          (item) =>
            item &&
            typeof item.content === "string" &&
            (item.role === "user" ||
              item.role === "model" ||
              item.role === "assistant"),
        )
        .map((item) => ({
          role:
            item.role === "model" || item.role === "assistant"
              ? "assistant"
              : "user",

          content: item.content.trim(),
        }))
        .filter((item) => item.content)
    : [];

  return {
    conversation: safeHistory,

    structuredPreferences: {
      readyForDiscovery: Boolean(intent?.readyForDiscovery),

      genres: Array.isArray(intent?.genres) ? intent.genres : [],

      platforms: Array.isArray(intent?.platforms) ? intent.platforms : [],

      features: Array.isArray(intent?.features) ? intent.features : [],

      setting: intent?.setting || null,

      gameplayStyle: intent?.gameplayStyle || null,

      exploration: intent?.exploration || null,

      storyImportance: intent?.storyImportance || null,

      combatStyle: intent?.combatStyle || null,

      worldStructure: intent?.worldStructure || null,

      multiplayer: intent?.multiplayer || null,

      difficulty: intent?.difficulty || null,

      playerFreedom: intent?.playerFreedom || null,

      referenceGames: Array.isArray(intent?.referenceGames)
        ? intent.referenceGames
        : [],
    },
  };
}

// ==============================================
// PARSE AI JSON SAFELY
// ==============================================

function parseRecommendationResponse(responseText) {
  if (typeof responseText !== "string" || !responseText.trim()) {
    throw new Error("FORTUNA returned an empty recommendation response.");
  }

  let cleaned = responseText.trim();

  // ============================================
  // REMOVE MARKDOWN FENCES
  // ============================================

  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

  // ============================================
  // DIRECT JSON PARSE
  // ============================================

  try {
    const parsed = JSON.parse(cleaned);

    return parsed;
  } catch (error) {
    console.warn(
      "FORTUNA direct JSON parse failed. Attempting truncated JSON recovery...",
    );
  }

  // ============================================
  // TRUNCATED JSON RECOVERY
  // ============================================
  //
  // Free models may occasionally stop generation
  // before completing the full JSON response.
  //
  // Recover ONLY fully completed recommendation
  // objects from the response.
  //
  // Example:
  //
  // {
  //   "recommendations": [
  //     {
  //       "rank": 1,
  //       "title": "Game",
  //       "reason": "Complete reason."
  //     },
  //     {
  //       "rank": 2,
  //       "title": "Another Game",
  //       "reason": "Truncated...
  //
  // The first complete recommendation is recovered.
  // The incomplete recommendation is discarded.
  // ============================================

  const recommendationMatches = [
    ...cleaned.matchAll(
      /\{\s*"rank"\s*:\s*(\d+)\s*,\s*"title"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"reason"\s*:\s*"((?:\\.|[^"\\])*)"\s*\}/g,
    ),
  ];

  if (recommendationMatches.length > 0) {
    const recommendations = recommendationMatches
      .map((match) => {
        try {
          return {
            rank: Number(match[1]),

            title: JSON.parse(`"${match[2]}"`),

            reason: JSON.parse(`"${match[3]}"`),
          };
        } catch (error) {
          console.warn(
            "FORTUNA failed to recover one recommendation object:",
            error,
          );

          return null;
        }
      })
      .filter(Boolean);

    if (recommendations.length > 0) {
      console.warn(
        `FORTUNA recovered ${recommendations.length} complete recommendation(s) from truncated JSON.`,
      );

      return {
        recommendations,
      };
    }
  }

  // ============================================
  // FAILED RECOVERY
  // ============================================

  console.error(
    "FORTUNA recommendation JSON could not be parsed or recovered.",
  );

  console.error("FORTUNA recommendation raw response:", responseText);

  throw new Error("FORTUNA returned invalid recommendation data.");
}

// ==============================================
// OPENROUTER REQUEST
// ==============================================
//
// FDS uses OpenRouter's dynamic free-model router.
//
// Instead of manually trying:
//
// 120B → openrouter/free → 20B
//
// FDS makes one request to:
//
// openrouter/free
//
// OpenRouter handles model/provider fallback.
// ==============================================

async function requestOpenRouter(messages) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, FORTUNA_DISCOVERY_REQUEST_TIMEOUT);

  try {
    console.log(
      `FORTUNA FDS requesting dynamic model routing: ${FORTUNA_DISCOVERY_MODEL}`,
    );

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,

        "Content-Type": "application/json",

        "HTTP-Referer": OPENROUTER_SITE_URL,

        "X-Title": OPENROUTER_APP_NAME,
      },

      signal: controller.signal,

      body: JSON.stringify({
        model: FORTUNA_DISCOVERY_MODEL,

        messages,

        temperature: 0.2,

        max_tokens: 2000,

        response_format: {
          type: "json_object",
        },

        reasoning: {
          effort: "low",
        },

        provider: {
          allow_fallbacks: true,
        },
      }),
    });

    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error(
        "FORTUNA FDS returned a non-JSON OpenRouter response:",
        responseText,
      );

      const error = new Error(
        `OpenRouter returned an invalid response (${response.status}).`,
      );

      error.status = response.status;

      throw error;
    }

    // ==========================================
    // OPENROUTER ERROR
    // ==========================================

    if (!response.ok) {
      const errorMessage =
        data?.error?.message ||
        `OpenRouter request failed with status ${response.status}.`;

      const error = new Error(errorMessage);

      error.status = response.status;

      error.code = data?.error?.code;

      error.raw = data;

      console.error(
        "FORTUNA FDS OpenRouter error:",
        JSON.stringify(data, null, 2),
      );

      throw error;
    }

    // ==========================================
    // SUCCESS
    // ==========================================

    console.log("FORTUNA FDS dynamic model request succeeded.");

    return data;
  } catch (error) {
    // ==========================================
    // TIMEOUT
    // ==========================================

    if (error?.name === "AbortError") {
      const timeoutError = new Error(
        "FORTUNA discovery request timed out while waiting for the AI model.",
      );

      timeoutError.code = "timeout";

      console.error(
        "FORTUNA FDS request timed out after",
        FORTUNA_DISCOVERY_REQUEST_TIMEOUT,
        "ms.",
      );

      throw timeoutError;
    }

    // ==========================================
    // OTHER ERROR
    // ==========================================

    console.error("FORTUNA FDS request failed:", error);

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ==============================================
// ASK FORTUNA TO CHOOSE GAMES
// ==============================================

async function selectGamesWithFortuna(intent, history = []) {
  const context = buildConversationContext(history, intent);

  const userPrompt = `
The following is the user's complete FORTUNA discovery context.

CONVERSATION:
${JSON.stringify(context.conversation, null, 2)}

STRUCTURED PREFERENCES:
${JSON.stringify(context.structuredPreferences, null, 2)}

You are now making the FINAL GAME RECOMMENDATIONS.

Use the user's complete conversation and structured preferences.

Choose the strongest currently released games that match the user's COMPLETE desired experience.

The AI is the recommendation brain.

RAWG will only retrieve the exact game titles you select after this response.

Think carefully about:

1. What the user explicitly wants.
2. What the user strongly prefers.
3. What the user explicitly dislikes.
4. Why reference games were mentioned.
5. Which preferences are most important.
6. Whether each game genuinely matches the complete experience.

Do not recommend a game merely because it belongs to the requested genre.

Return ONLY a valid JSON object.

The JSON object MUST have exactly this structure:

{
  "recommendations": [
    {
      "rank": 1,
      "title": "Game Title",
      "reason": "Why this game specifically matches the user's preferences."
    }
  ]
}

Rules:

- Return between 1 and 4 recommendations.
- The top-level object must contain ONLY "recommendations".
- "recommendations" must be an array.
- Each recommendation must contain ONLY "rank", "title", and "reason".
- rank must be a number.
- title must be a string.
- reason must be a string.
- Keep each reason under 35 words.
- Be concise.
- Do not explain your reasoning process.
- Do not include analysis.
- Do not include chain-of-thought.
- Only recommend real, currently released games.
- Only recommend games that the user can realistically play now.
- Do not include RAWG IDs.
- Do not include image URLs.
- Do not include ratings.
- Do not include release dates.
- Do not include platform metadata.
- Do not include any fields other than rank, title, and reason.
- Do not return Markdown.
- Do not return code fences.
- Do not return commentary.
- Do not return an empty recommendations array.
`;

  const completion = await requestOpenRouter([
    {
      role: "system",

      content: FORTUNA_RECOMMENDATION_INSTRUCTION,
    },

    {
      role: "user",

      content: userPrompt,
    },
  ]);

  // ============================================
  // LOG COMPLETION METADATA ONLY
  // ============================================

  console.log("FORTUNA discovery completion metadata:", {
    model: completion?.model,

    provider: completion?.provider,

    finishReason: completion?.choices?.[0]?.finish_reason,

    nativeFinishReason: completion?.choices?.[0]?.native_finish_reason,
  });

  const responseMessage = completion?.choices?.[0]?.message;

  console.log(
    "FORTUNA discovery message:",
    JSON.stringify(responseMessage, null, 2),
  );

  const responseText = responseMessage?.content;

  if (!responseText || !responseText.trim()) {
    console.error("FORTUNA returned an empty recommendation response.");

    console.error(
      "FORTUNA full completion:",
      JSON.stringify(completion, null, 2),
    );

    throw new Error("FORTUNA returned an empty recommendation response.");
  }

  const parsedResponse = parseRecommendationResponse(responseText);

  const recommendations = normalizeRecommendations(
    parsedResponse.recommendations,
  );

  if (recommendations.length === 0) {
    throw new Error("FORTUNA could not find suitable game recommendations.");
  }

  return recommendations;
}

// ==============================================
// FIND GAME IN RAWG
// ==============================================

async function searchRawgGame(title) {
  const params = new URLSearchParams();

  params.set("search", title);

  params.set("page_size", "10");

  const data = await getGames(params.toString());

  const games = Array.isArray(data?.results) ? data.results : [];

  if (games.length === 0) {
    return null;
  }

  const normalizedRequestedTitle = normalizeTitle(title);

  // ============================================
  // EXACT TITLE MATCH
  // ============================================

  const exactMatch = games.find(
    (game) => normalizeTitle(game.name) === normalizedRequestedTitle,
  );

  if (exactMatch) {
    return exactMatch;
  }

  // ============================================
  // TITLE CONTAINS MATCH
  // ============================================

  const containsMatch = games.find((game) => {
    const normalizedGameTitle = normalizeTitle(game.name);

    return (
      normalizedGameTitle.includes(normalizedRequestedTitle) ||
      normalizedRequestedTitle.includes(normalizedGameTitle)
    );
  });

  if (containsMatch) {
    return containsMatch;
  }

  // ============================================
  // FALLBACK
  // ============================================

  return games[0];
}

// ==============================================
// RETRIEVE AI-SELECTED GAMES FROM RAWG
// ==============================================
//
// All RAWG searches run in parallel.
//
// Promise.allSettled() ensures one failed
// lookup does not break the entire discovery.
//

async function retrieveRecommendedGames(recommendations) {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return [];
  }

  const settledResults = await Promise.allSettled(
    recommendations.map(async (recommendation) => {
      const game = await searchRawgGame(recommendation.title);

      if (!game) {
        throw new Error(
          `RAWG could not retrieve FORTUNA recommendation: ${recommendation.title}`,
        );
      }

      return {
        ...game,

        fortunaRank: recommendation.rank,

        fortunaReason: recommendation.reason,

        fortunaRecommendedTitle: recommendation.title,
      };
    }),
  );

  const results = [];

  settledResults.forEach((result, index) => {
    const recommendation = recommendations[index];

    if (result.status === "fulfilled") {
      results.push(result.value);

      return;
    }

    console.warn(
      `RAWG retrieval failed for "${recommendation.title}":`,
      result.reason,
    );
  });

  // ==========================================
  // PRESERVE FORTUNA RANK ORDER
  // ==========================================

  return results.sort((a, b) => a.fortunaRank - b.fortunaRank);
}

// ==============================================
// FORTUNA DISCOVERY
// ==============================================

export async function discoverGamesFromIntent(intent, history = []) {
  if (!intent || typeof intent !== "object" || Array.isArray(intent)) {
    throw new Error("A valid FORTUNA intent is required.");
  }

  // ============================================
  // NOT READY
  // ============================================

  if (intent.readyForDiscovery !== true) {
    return {
      count: 0,

      results: [],

      recommendations: [],

      readyForDiscovery: false,
    };
  }

  // ============================================
  // STEP 1
  // FORTUNA AI SELECTS THE GAMES
  // ============================================

  const fortunaRecommendations = await selectGamesWithFortuna(intent, history);

  // ============================================
  // STEP 2
  // RAWG RETRIEVES THE AI-SELECTED TITLES
  // ============================================

  const games = await retrieveRecommendedGames(fortunaRecommendations);

  // ============================================
  // NO RAWG MATCHES
  // ============================================

  if (games.length === 0) {
    return {
      count: 0,

      results: [],

      recommendations: fortunaRecommendations,

      readyForDiscovery: true,
    };
  }

  // ============================================
  // FINAL RESPONSE
  // ============================================

  return {
    count: games.length,

    results: games,

    recommendations: fortunaRecommendations,

    readyForDiscovery: true,
  };
}
