import { getGames } from "./fracture.js";

// ==============================================
// FORTUNA — FORTUNA DISCOVERY SERVICE (FDS)
// ==============================================
//
// FDS = Fortuna Discovery Service
//
// Responsibilities:
// - Select the best game recommendations
// - Use Gemini to understand the user's current taste
// - Rank recommendations by relevance
// - Generate personalized reasons
// - Avoid previously shown games
// - Respect current preferences and exclusions
// - Retrieve the selected games from IGDB
//
// FDS does NOT:
// - Maintain conversation state
// - Decide whether discovery should happen
// - Decide when discovery should trigger
// - Ask the user questions
//
// FORTUNA / FS is responsible for deciding WHEN
// discovery should happen.
//
// FDS is only called AFTER FORTUNA decides:
//
// discoveryAction: "discover"
//
// Flow:
//
// User conversation
//       ↓
// Fortuna Service (FS)
//       ↓
// Gemini decides discovery is appropriate
//       ↓
// Fortuna Discovery Service (FDS)
//       ↓
// Gemini selects best game titles
//       ↓
// IGDB retrieves those games
//       ↓
// Final discovery results
//
// IMPORTANT:
//
// FDS should never independently decide whether the
// user wants recommendations.
//
// If this service is called, discovery has already
// been requested by FORTUNA.
//
// ==============================================

// ==============================================
// GEMINI CONFIG
// ==============================================

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

const FORTUNA_DISCOVERY_MODEL =
  process.env.FORTUNA_DISCOVERY_MODEL || "gemini-3.1-flash-lite";

const FORTUNA_DISCOVERY_REQUEST_TIMEOUT = 60000;

const MAX_RECOMMENDATIONS = 4;

// ==============================================
// FDS SYSTEM INSTRUCTION
// ==============================================

const FORTUNA_RECOMMENDATION_INSTRUCTION = `
You are FORTUNA's recommendation engine inside FRACTURE.

The user has already decided to discover games.

Your job is to select the best real games for the user's CURRENT taste.

You do NOT decide whether discovery should happen.
You do NOT ask questions.
You do NOT continue the conversation.
You do NOT search IGDB.

The application will retrieve your selected titles from IGDB afterward.

==================================================
CORE PRINCIPLES
==================================================

1. Understand the user's CURRENT preferences from the provided intent and conversation.

2. Match the actual experience the user wants, not just broad genres.

3. Prioritize specific gameplay mechanics over generic genre labels.

4. Respect explicit dislikes, exclusions, and rejected games.

5. Use the latest clarified preference when preferences conflict.

6. Use reference games as taste signals, not automatic recommendations.

7. If previous games are provided, do not repeat them.

8. If the conversation asks for "more", "another batch", "similar", or "something different", use the previous games and conversation as context.

9. Recommend only real, released, standalone games.

10. Do not recommend DLC, expansions, unreleased games, or invented titles.

11. Prefer strong matches over popular games.

12. Two excellent matches are better than four weak matches.

13. Return between 1 and 4 recommendations.

14. FORTUNA can provide a maximum of 4 game recommendations per discovery.

15. If the user asks for more than 4 games, such as 5, 6, 10, etc., return ONLY 4 recommendations. Never attempt to return more than 4.

16. Rank recommendations from strongest match to weakest match.

17. Each recommendation reason must be specific and concise.

==================================================
MATCHING PRIORITY
==================================================

Use this priority order:

1. Explicit current requirements
2. Explicit dislikes and exclusions
3. Specific gameplay mechanics
4. Latest clarified preferences
5. Desired gameplay experience
6. Core gameplay loop
7. Positive reference games
8. Setting
9. World structure
10. Genre
11. Combat
12. Exploration
13. Progression
14. Player freedom
15. Story
16. Atmosphere
17. Difficulty
18. Multiplayer
19. Platform

Specific gameplay requirements are more important than broad labels.

Examples:

"parry-heavy combat"
means parrying should be a meaningful part of combat.

"melee-focused"
means melee should be central to gameplay.

"open-world freedom"
means meaningful exploration and player freedom.

"hack and slash"
means fast, combo-oriented melee combat.

"stealth-focused"
means stealth should be a meaningful gameplay option.

Do not reduce specific requirements into generic genres.

==================================================
REFERENCE GAMES
==================================================

Only treat explicitly liked games as positive references.

If the user says:

"I like Sekiro because of the parrying."

Then:

- Sekiro is a positive reference.
- Parry-focused combat is a strong preference.

If the user dislikes a referenced game:

- Do not recommend it.
- Do not treat it as a positive reference.

A game mentioned casually is not automatically a positive reference.

==================================================
PREVIOUSLY SHOWN GAMES
==================================================

Previously shown games are provided separately.

Never repeat a previously shown game unless the user explicitly asks for it again.

If the user asks for:

- more games
- another batch
- more like these
- similar games
- something similar

then:

1. Use previous games as taste signals.
2. Learn what connects those games.
3. Find NEW games that fit the same desired experience.
4. Never simply repeat the previous titles.

If a previously shown game was explicitly disliked, never recommend it.

==================================================
CONVERSATION CONTEXT
==================================================

Use the recent conversation to understand context.

Resolve phrases such as:

"these"
"them"
"more"
"another"
"something similar"
"something different"

using the surrounding conversation.

The accumulated intent is the primary preference state.

The conversation provides additional context, especially for:

- recent preference changes
- recommendation feedback
- rejected games
- requests for similar games
- requests for something completely different

==================================================
QUALITY
==================================================

Recommend games that genuinely fit.

Do not recommend a game only because it is:

- popular
- highly rated
- from the same genre
- made by the same developer
- superficially similar

A recommendation should match the experience the user actually described.

Return 1 to 4 strong matches.

Rank the strongest match first.

Each reason must be under 30 words.

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Use exactly this structure:

{
  "recommendations": [
    {
      "rank": 1,
      "title": "Game Title",
      "reason": "Specific reason this game fits the user's preferences."
    }
  ]
}

The top-level object must contain ONLY:

- recommendations

Each recommendation must contain ONLY:

- rank
- title
- reason

No Markdown.
No code fences.
No commentary.
No analysis.
No chain-of-thought.
`;

// ==============================================
// NORMALIZE TEXT
// ==============================================

function normalize(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
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

  return uniqueByTitle(normalized)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, MAX_RECOMMENDATIONS)
    .map((recommendation, index) => ({
      rank: index + 1,
      title: recommendation.title,
      reason: recommendation.reason,
    }));
}

// ==============================================
// NORMALIZE PREVIOUSLY SHOWN GAMES
// ==============================================

function normalizePreviouslyShownGames(previousRecommendations = []) {
  if (!Array.isArray(previousRecommendations)) {
    return [];
  }

  return previousRecommendations
    .map((recommendation) => {
      if (!recommendation) {
        return null;
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
        return null;
      }

      return {
        title,
        reason,
      };
    })
    .filter(Boolean);
}

// ==============================================
// FILTER PREVIOUSLY SHOWN GAMES
// ==============================================

function filterPreviouslyShownGames(
  recommendations = [],
  previousRecommendations = [],
) {
  const previousTitles = new Set(
    normalizePreviouslyShownGames(previousRecommendations).map((game) =>
      normalizeTitle(game.title),
    ),
  );

  return recommendations.filter(
    (recommendation) =>
      !previousTitles.has(normalizeTitle(recommendation.title)),
  );
}

// ==============================================
// BUILD COMPACT FDS CONTEXT
// ==============================================
//
// FDS intentionally receives a compact context.
//
// FS already maintains the accumulated intent.
// Therefore FDS does not need the entire conversation.
//
// Recent conversation is only used for:
// - "more like these"
// - "similar"
// - recommendation feedback
// - recent preference changes
//
// Keeping this compact reduces Gemini token usage.
//
// ==============================================

function buildDiscoveryContext(
  history = [],
  intent = {},
  previousRecommendations = [],
) {
  const conversation = Array.isArray(history)
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
        .slice(-8)
    : [];

  const previouslyShownGames = normalizePreviouslyShownGames(
    previousRecommendations,
  );

  return {
    preferences: {
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

    conversation,

    previouslyShownGames,
  };
}

// ==============================================
// PARSE GEMINI RESPONSE
// ==============================================

function parseRecommendationResponse(responseText) {
  if (typeof responseText !== "string" || !responseText.trim()) {
    throw new Error("FORTUNA returned an empty recommendation response.");
  }

  let cleaned = responseText.trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Continue recovery.
  }

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      // Continue recovery.
    }
  }

  throw new Error("FORTUNA returned invalid recommendation data.");
}

// ==============================================
// GEMINI REQUEST
// ==============================================

async function requestGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, FORTUNA_DISCOVERY_REQUEST_TIMEOUT);

  const url =
    `${GEMINI_API_URL}/${FORTUNA_DISCOVERY_MODEL}:generateContent` +
    `?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;

  try {
    const response = await fetch(url, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      signal: controller.signal,

      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: FORTUNA_RECOMMENDATION_INSTRUCTION,
            },
          ],
        },

        contents: [
          {
            role: "user",

            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],

        generationConfig: {
          temperature: 0.35,

          maxOutputTokens: 300,

          responseMimeType: "application/json",
        },
      }),
    });

    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(
        `Gemini returned an invalid response (${response.status}).`,
      );
    }

    if (!response.ok) {
      const error = new Error(
        data?.error?.message ||
          `Gemini request failed with status ${response.status}.`,
      );

      error.status = response.status;
      error.code = data?.error?.status;
      error.raw = data;

      throw error;
    }

    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error(
        "FORTUNA discovery request timed out while waiting for Gemini.",
      );

      timeoutError.code = "timeout";

      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ==============================================
// FORTUNA GAME SELECTION
// ==============================================
//
// IMPORTANT:
//
// FDS does NOT decide whether discovery should happen.
//
// FS has already decided that.
//
// FDS only answers:
//
// "Which games best match this user right now?"
//
// ==============================================

async function selectGamesWithFortuna(
  intent,
  history = [],
  previousRecommendations = [],
) {
  const context = buildDiscoveryContext(
    history,
    intent,
    previousRecommendations,
  );

  const previouslyShownTitles = context.previouslyShownGames.map(
    (game) => game.title,
  );

  const userPrompt = `
Select the strongest game matches for the user's current preferences.

PREFERENCES:
${JSON.stringify(context.preferences)}

RECENT CONTEXT:
${JSON.stringify(context.conversation)}

PREVIOUSLY SHOWN:
${JSON.stringify(previouslyShownTitles)}

Rules:
- Match the specific experience first.
- Respect dislikes and exclusions.
- Use recent conversation context when relevant.
- If previous games exist, use them as taste signals.
- Return new titles only.
- Never repeat previously shown games.
- Recommend only real released standalone games.
- Prefer strong matches over popularity.
- Return 1 to 4 recommendations maximum.
- If the user requested more than 4, return exactly 4 when 4 strong matches are available.
- Never return more than 4 recommendations.
- Return only the required JSON object.
`;

  const completion = await requestGemini(userPrompt);

  const responseText =
    completion?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("")
      .trim() || "";

  if (!responseText) {
    throw new Error("FORTUNA returned an empty recommendation response.");
  }

  const parsedResponse = parseRecommendationResponse(responseText);

  let recommendations = normalizeRecommendations(
    parsedResponse?.recommendations,
  );

  recommendations = filterPreviouslyShownGames(
    recommendations,
    previousRecommendations,
  );

  recommendations = recommendations.map((recommendation, index) => ({
    rank: index + 1,
    title: recommendation.title,
    reason: recommendation.reason,
  }));

  if (recommendations.length === 0) {
    throw new Error(
      "FORTUNA could not find suitable new game recommendations.",
    );
  }

  return recommendations;
}

// ==============================================
// FIND GAME IN IGDB
// ==============================================

async function searchIGDBGame(title) {
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
  // EXACT TITLE MATCH FIRST
  // ============================================

  const exactMatch = games.find(
    (game) => normalizeTitle(game.name) === normalizedRequestedTitle,
  );

  if (exactMatch) {
    return exactMatch;
  }

  // ============================================
  // CONFIDENT PARTIAL MATCH
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

  // Never blindly accept IGDB's first result.

  return null;
}

// ==============================================
// RETRIEVE AI-SELECTED GAMES FROM IGDB
// ==============================================

async function retrieveRecommendedGames(recommendations) {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return [];
  }

  const settledResults = await Promise.allSettled(
    recommendations.map(async (recommendation) => {
      const game = await searchIGDBGame(recommendation.title);

      if (!game) {
        throw new Error(
          `IGDB could not confidently retrieve recommendation: ${recommendation.title}`,
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
      `IGDB retrieval failed for "${recommendation.title}":`,
      result.reason,
    );
  });

  return results.sort((a, b) => a.fortunaRank - b.fortunaRank);
}

// ==============================================
// FORTUNA DISCOVERY
// ==============================================
//
// This function is called ONLY after FS decides:
//
// discoveryAction === "discover"
//
// FDS does not independently decide whether
// discovery should happen.
//
// ==============================================

export async function discoverGamesFromIntent(
  intent,
  history = [],
  options = {},
) {
  if (!intent || typeof intent !== "object" || Array.isArray(intent)) {
    throw new Error("A valid FORTUNA intent is required.");
  }

  const previousRecommendations = Array.isArray(
    options?.previousRecommendations,
  )
    ? options.previousRecommendations
    : [];

  // ============================================
  // STEP 1
  // ============================================
  //
  // Gemini selects the best titles.
  //
  // FS has already decided that discovery should
  // happen, so there is NO second discovery
  // decision here.
  //
  // ============================================

  const fortunaRecommendations = await selectGamesWithFortuna(
    intent,
    history,
    previousRecommendations,
  );

  // ============================================
  // STEP 2
  // ============================================
  //
  // IGDB retrieves the exact selected titles.
  //
  // ============================================

  const games = await retrieveRecommendedGames(fortunaRecommendations);

  // ============================================
  // NO IGDB MATCHES
  // ============================================

  if (games.length === 0) {
    return {
      count: 0,

      results: [],

      recommendations: fortunaRecommendations,

      readyForDiscovery: intent.readyForDiscovery === true,

      discoveryTriggered: true,
    };
  }

  // ============================================
  // FINAL RESULT
  // ============================================

  return {
    count: games.length,

    results: games,

    recommendations: fortunaRecommendations,

    readyForDiscovery: intent.readyForDiscovery === true,

    discoveryTriggered: true,
  };
}
