import Groq from "groq-sdk";

import { getGames } from "./fracture.js";

// ==============================================
// GROQ
// ==============================================

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const FORTUNA_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

// ==============================================
// CONFIG
// ==============================================

const MAX_RECOMMENDATIONS = 6;

// ==============================================
// FORTUNA RECOMMENDATION INSTRUCTION
// ==============================================

const FORTUNA_RECOMMENDATION_INSTRUCTION = `
You are FORTUNA, the intelligent game discovery expert inside FRACTURE.

You are the recommendation brain of FRACTURE.

Your job is to understand the user's COMPLETE gaming preferences and choose the strongest game titles for them.

RAWG IS NOT THE RECOMMENDATION BRAIN.

RAWG is only used AFTER you select the games.

The application will use RAWG only to retrieve the metadata, images, ratings, release dates, genres, and other information for the exact games YOU choose.

Therefore, YOU must decide which games are the best matches.

==================================
CORE RESPONSIBILITY
==================================

Read the COMPLETE conversation.

Read the structured preferences.

Understand the actual gaming EXPERIENCE the user wants.

Then choose up to 6 real, currently released games that genuinely match the user's preferences.

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

This may indicate that the user values:

- Strong side stories
- Memorable characters
- Narrative depth
- Exploration
- A living world

Use the underlying preference when selecting recommendations.

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

Do not fill all 6 positions with weak recommendations.

If only 3 or 4 games are genuinely strong matches, return only those.

==================================
PERSONALIZED REASONS
==================================

Every recommendation must include a concise, personalized reason.

The reason must explain why THIS game fits THIS user's request.

Bad:

"Great RPG with an amazing story."

Good:

"You wanted a compact medieval RPG with a clear linear structure, and this is a strong match because it focuses on a tightly directed journey rather than a massive open world."

Each reason should be specific and different.

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

- The top-level object must contain only "recommendations".
- "recommendations" must be an array.
- Each recommendation must contain rank, title, and reason.
- rank must be a number.
- title must be a string.
- reason must be a string.
- Do not return Markdown.
- Do not return code fences.
- Do not return commentary.
- Do not return additional fields.
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

function normalizeTitle(value) {
  return normalize(value)
    .replace(/[™®©]/g, "")
    .replace(/[:\-–—]/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

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
      if (!recommendation || typeof recommendation !== "object") {
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
          role: item.role === "model" ? "assistant" : item.role,

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

  // Remove accidental Markdown fences if the model
  // returns them despite the instruction.

  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

  let parsedResponse;

  try {
    parsedResponse = JSON.parse(cleaned);
  } catch (error) {
    console.error("FORTUNA recommendation JSON parse error:", error);

    console.error("FORTUNA recommendation raw response:", responseText);

    throw new Error("FORTUNA returned invalid recommendation data.");
  }

  if (
    !parsedResponse ||
    typeof parsedResponse !== "object" ||
    Array.isArray(parsedResponse)
  ) {
    throw new Error("FORTUNA returned an invalid recommendation format.");
  }

  return parsedResponse;
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

Return ONLY the JSON object required by your instructions.
`;

  const completion = await groq.chat.completions.create({
    model: FORTUNA_MODEL,

    messages: [
      {
        role: "system",
        content: FORTUNA_RECOMMENDATION_INSTRUCTION,
      },

      {
        role: "user",
        content: userPrompt,
      },
    ],

    temperature: 0.4,

    max_completion_tokens: 1400,

    // IMPORTANT:
    // Use simple JSON mode instead of json_schema.
    // This is more compatible with the model and
    // prevents the json_validate_failed error.
    response_format: {
      type: "json_object",
    },
  });

  const responseText = completion.choices?.[0]?.message?.content;

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

async function retrieveRecommendedGames(recommendations) {
  const results = [];

  for (const recommendation of recommendations) {
    try {
      const game = await searchRawgGame(recommendation.title);

      if (!game) {
        console.warn(
          `RAWG could not retrieve FORTUNA recommendation: ${recommendation.title}`,
        );

        continue;
      }

      results.push({
        ...game,

        // FORTUNA'S AI DECISION
        fortunaRank: recommendation.rank,

        fortunaReason: recommendation.reason,

        fortunaRecommendedTitle: recommendation.title,
      });
    } catch (error) {
      console.error(
        `RAWG retrieval failed for "${recommendation.title}":`,
        error,
      );
    }
  }

  return results;
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
  // RAWG ONLY RETRIEVES THE AI-SELECTED TITLES
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
