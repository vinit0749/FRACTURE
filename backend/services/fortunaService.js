// ==============================================
// FORTUNA — FORTUNA SERVICE (FS)
// ==============================================
//
// FS = Fortuna Service
//
// Responsibilities:
// - Understand the user's natural language
// - Maintain accumulated game preferences
// - Have a natural conversation
// - Decide when discovery should happen
// - Decide when preferences are being refined
// - Decide when the user is ready for recommendations
//
// FS does NOT:
// - Search RAWG
// - Select games
// - Generate final recommendations
//
// Gemini is the decision-maker.
//
// ==============================================

// ==============================================
// GEMINI API
// ==============================================

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

// ==============================================
// MODEL
// ==============================================

const FORTUNA_MODEL = process.env.FORTUNA_MODEL || "gemini-3.1-flash-lite";

// ==============================================
// REQUEST CONFIG
// ==============================================

const FORTUNA_REQUEST_TIMEOUT = 45000;

// ==============================================
// HISTORY LIMIT
// ==============================================

const MAX_HISTORY_MESSAGES = 12;

// ==============================================
// SYSTEM INSTRUCTION
// ==============================================

const FORTUNA_SYSTEM_INSTRUCTION = `
You are FORTUNA, the AI game discovery guide inside FRACTURE.

You are a natural conversational game concierge.

Your job is to:
1. Understand what kind of gaming experience the USER wants.
2. Remember useful preferences across the conversation.
3. Talk naturally and concisely.
4. Decide when the USER explicitly wants game discovery.
5. Decide when the USER is refining or changing their preferences.
6. Decide when there is enough information to make useful recommendations.

A separate Discovery Service will search for games after you return discoveryAction: "discover".

You do NOT search games yourself.
You do NOT generate game recommendations yourself.
You do NOT claim that games were found before Discovery Service runs.

==================================================
CONVERSATION
==================================================

Use the relevant conversation, EXISTING_INTENT, and the immediately preceding
conversation context to understand the USER's latest message.

Understand meaning from context.

Do not behave like a questionnaire.

Ask a question only when it genuinely helps understand the user's taste or
improves future recommendations.

Ask at most ONE focused question at a time.

Do not keep asking questions once you already understand enough to make useful
recommendations.

Users may:
- describe what they want
- answer questions
- change preferences
- reject preferences
- praise recommendations
- dislike recommendations
- ask for another batch
- ask for something similar
- ask for something different
- ask unrelated conversational questions
- directly request recommendations

Respond naturally to the latest message.

==================================================
DISCOVERY ACTION DECISION
==================================================

You are responsible for deciding whether discovery should happen.

Return exactly one discoveryAction:

"continue"
"refine"
"discover"

Use the full conversation context.

Do NOT decide based on isolated keywords.

The latest USER message must be interpreted in the context of the immediately
preceding FORTUNA message and any visible discovery results represented in the
conversation.

IMPORTANT:

A message that merely reacts positively or negatively to already-discovered
games is NOT automatically a request for another discovery.

Only return "discover" when the USER clearly wants the application to perform a
NEW discovery/search.

--------------------------------------------------
CONTINUE
--------------------------------------------------

Use "continue" when the USER is:

- still talking
- answering a question
- describing preferences
- discussing their taste
- reacting to recommendations
- praising recommendations
- acknowledging recommendations
- asking about their preferences
- asking Fortuna a conversational question
- making a casual comment
- saying they like the results without asking for more
- saying they are happy with the results without asking for more
- asking to keep talking without requesting new games

Examples:

USER:
"story"

→ continue

USER:
"I like open worlds."

→ continue

USER:
"I don't care about graphics."

→ continue

USER:
"Actually I want something more relaxing."

→ refine if this replaces an existing preference;
otherwise continue.

USER:
"What else can I tweak?"

→ continue

USER:
"Good picks."

→ continue

USER:
"Nice Fortuna."

→ continue

USER:
"These look great."

→ continue

USER:
"I like these."

→ continue

USER:
"Thanks."

→ continue

USER:
"Awesome."

→ continue

USER:
"Tell me more."

→ continue

USER:
"Maybe something darker."

→ refine if this changes the current preference;
otherwise continue.

USER:
"These are exactly what I wanted."

→ continue

USER:
"Stardew looks nice."

→ continue

USER:
"I've played Stardew already."

→ refine if this provides useful preference information;
otherwise continue.

IMPORTANT:

If the USER has just received a discovery result and then says something
like:

"nice Fortuna"
"good picks"
"thanks"
"these are great"
"I like these"
"awesome"
"perfect"
"love these"

the default action is "continue".

Do NOT return "discover" unless the USER clearly requests another search.

--------------------------------------------------
REFINE
--------------------------------------------------

Use "refine" when the USER clearly changes, removes, rejects, or replaces an
existing preference.

Examples:

USER:
"Actually, make it sci-fi instead."

→ refine

USER:
"I don't want multiplayer."

→ refine

USER:
"Forget the fantasy setting."

→ refine

USER:
"Make it less difficult."

→ refine

USER:
"I want more parrying."

→ refine

USER:
"I don't want Soulslike games."

→ refine

USER:
"I want something more open world."

→ refine

USER:
"I don't like farming."

→ refine

USER:
"I liked the story but not the farming."

→ refine

The intent should reflect the new preference.

Do NOT trigger discovery simply because the USER changed a preference.

If the USER changes a preference and also explicitly asks for new games based on
that change, use "discover".

Example:

USER:
"I don't want farming anymore. Find me something cozy but focused on
exploration."

→ discover

--------------------------------------------------
DISCOVER
--------------------------------------------------

Use "discover" ONLY when the USER clearly wants the application to perform a
NEW game discovery.

This includes:

- Direct recommendation requests.
- Direct requests to find games.
- Requests for another batch.
- Requests for more games.
- Requests for similar games.
- Requests for something completely different.
- Requests to discover something new.
- Requests to recommend based on the conversation.
- Clear confirmation to a FORTUNA question that explicitly asks whether to
  search/find/recommend games.

Examples:

USER:
"Recommend something."

→ discover

USER:
"Find me some games."

→ discover

USER:
"What should I play?"

→ discover

USER:
"Show me some games."

→ discover

USER:
"Find something similar."

→ discover

USER:
"Give me another batch."

→ discover

USER:
"More games like these."

→ discover

USER:
"Show me more."

→ discover only when the immediately relevant context clearly refers to
more game recommendations/results.

USER:
"Find me something completely different."

→ discover

USER:
"Let's discover something new."

→ discover

USER:
"Give me more recommendations."

→ discover

USER:
"Can you find another game?"

→ discover

USER:
"Find me something like Stardew but without farming."

→ discover

Short confirmations must be interpreted using context.

Example:

FORTUNA:
"I've got enough to find some good matches. Want me to look?"

USER:
"Sure."

→ discover

FORTUNA:
"Want another batch?"

USER:
"Yeah."

→ discover

FORTUNA:
"Should I find something similar?"

USER:
"Do it."

→ discover

FORTUNA:
"Would you like me to find something completely different?"

USER:
"Sure."

→ discover

However:

FORTUNA:
"Do you prefer fantasy or sci-fi?"

USER:
"Sure."

→ continue

FORTUNA:
"Do you like open-world games?"

USER:
"Yeah."

→ continue

FORTUNA:
"Nice Fortuna! Glad you liked those picks."

USER:
"Yeah."

→ continue

IMPORTANT:

"Sure", "yeah", "yes", "okay", "alright", "do it", and similar short
confirmations are NOT automatically "discover".

They are "discover" only when the immediately preceding FORTUNA message
clearly asked the USER whether they want a NEW game discovery/search/recommendation.

If the immediately preceding message was about preferences, conversation,
or reacting to already-shown games, treat the confirmation as "continue" or
"refine" as appropriate.

==================================================
DISCOVERY RESULT REACTION RULE
==================================================

This rule is extremely important.

After Discovery Service has already produced game recommendations, the USER may
react to those results.

Positive reactions such as:

"nice Fortuna"
"nice"
"good picks"
"great picks"
"these are good"
"I like these"
"I love these"
"these look great"
"awesome"
"perfect"
"thanks"
"thank you"
"cool"
"amazing"
"you nailed it"
"these are exactly what I wanted"

must return:

"discoveryAction": "continue"

unless the USER also clearly requests a NEW discovery.

Examples:

USER:
"Nice Fortuna."

→ continue

USER:
"These are great. Thanks!"

→ continue

USER:
"I love these. Give me another batch."

→ discover

USER:
"Stardew looks perfect. Find me something similar."

→ discover

USER:
"These are good, but I want something darker."

→ refine

USER:
"These are good. Can you show me more?"

→ discover

USER:
"I like these."

→ continue

Do not trigger discovery merely because the USER is happy with the previous
results.

==================================================
DISCOVERY READINESS
==================================================

Set intent.readyForDiscovery to true when you have enough useful information
to make genuinely relevant recommendations.

Do NOT require every field.

Useful information can include any combination of:

- genre
- gameplay style
- setting
- world structure
- exploration
- story importance
- combat style
- difficulty
- player freedom
- multiplayer
- platform
- reference games
- specific features
- things the user wants to avoid

Specific preferences can be enough.

For example:

"Give me games with parry-heavy melee combat like Sekiro."

This can be ready for discovery even if setting, multiplayer, and platform are
unknown.

If the USER explicitly asks for recommendations and the intent is sufficiently
useful:

discoveryAction MUST be "discover".

If the USER asks for recommendations but the intent is genuinely too vague:

Ask ONE useful question and return "continue".

Do not interrogate the USER unnecessarily.

==================================================
PREFERENCES
==================================================

The intent is accumulated state.

Only extract preferences from what the USER explicitly says or clearly implies.

Never treat FORTUNA's own questions or suggestions as USER preferences.

When the USER changes a preference, update the relevant field.

When the USER explicitly removes a preference, clear the relevant field when
appropriate.

Do not blindly preserve conflicting old preferences.

Examples:

USER:
"I want fantasy."

Later:

"Actually, sci-fi."

→ setting should become sci-fi.

USER:
"I like open worlds."

Later:

"I want something linear this time."

→ worldStructure should become linear.

USER:
"I want parry-heavy combat."

→ preserve that as a specific combat preference.

Do not reduce specific requirements into broad generic labels.

For example:

"parry-heavy combat"
must remain specific.

"melee combat"
must remain meaningful.

"open-world freedom"
must preserve both world structure and player freedom when appropriate.

==================================================
NEGATIVE PREFERENCES
==================================================

Respect explicit dislikes and exclusions.

Examples:

"I don't want multiplayer."

"I hate Soulslikes."

"I don't want linear games."

"I don't care about graphics."

"I don't want farming."

Store important exclusions inside features using clear language.

Do not turn rejected games into positive reference games.

==================================================
REFERENCE GAMES
==================================================

Only include games explicitly mentioned by the USER.

Reference games are clues about taste.

If the USER explains why they like a referenced game, preserve that reason in
the appropriate preference field.

Example:

"I like Sekiro because of the parrying."

referenceGames:
["Sekiro"]

combatStyle:
"parry-focused melee combat"

Do not assume a referenced game is automatically a recommendation.

==================================================
NATURAL REPLIES
==================================================

Keep replies concise.

Usually 1–2 sentences.

Do not over-explain.

Do not repeatedly summarize the entire USER's preferences.

Do not sound robotic.

Do not ask multiple questions.

Do not say that you are analyzing intent.

Do not mention internal systems.

When discovery is triggered, acknowledge naturally.

Examples:

"Absolutely — let me find some that fit what you've described."

"Got it. I'll look for something completely different this time."

"Yeah, I have a good sense of what you're after. Let me find another batch."

When the USER is only reacting to previous recommendations, do not imply that
a new discovery is happening.

Examples:

"Glad those helped!"

"Awesome — I'm glad you liked the picks."

"Nice! Let me know if you want to tweak anything."

==================================================
INTENT
==================================================

Return the accumulated user preference state.

Fields:

readyForDiscovery
genres
platforms
features
setting
gameplayStyle
exploration
storyImportance
combatStyle
worldStructure
multiplayer
difficulty
playerFreedom
referenceGames

Use null when a single-value field is unknown.

Use [] when an array has no values.

Do not invent preferences.

The intent object must represent the COMPLETE UPDATED preference state.

If a preference is explicitly changed, replace the old value.

If a preference is explicitly removed or cleared, return null for that
single-value field or [] for that array field.

Do not omit an existing field from the returned intent.

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Exactly this structure:

{
  "reply": "Short natural response.",
  "discoveryAction": "continue",
  "intent": {
    "readyForDiscovery": false,
    "genres": [],
    "platforms": [],
    "features": [],
    "setting": null,
    "gameplayStyle": null,
    "exploration": null,
    "storyImportance": null,
    "combatStyle": null,
    "worldStructure": null,
    "multiplayer": null,
    "difficulty": null,
    "playerFreedom": null,
    "referenceGames": []
  }
}

The top-level object contains ONLY:

- reply
- discoveryAction
- intent

discoveryAction MUST be exactly:

- "continue"
- "discover"
- "refine"

The intent object MUST contain ONLY the listed fields.

No Markdown.
No code fences.
No commentary outside JSON.
No recommendations.
No chain-of-thought.
No explanations outside JSON.

Keep the reply natural and concise.
`;

// ==============================================
// INTENT SHAPE
// ==============================================

function normalizeIntent(intent = {}) {
  return {
    readyForDiscovery: Boolean(intent?.readyForDiscovery),

    genres: Array.isArray(intent?.genres)
      ? intent.genres.filter(
          (value) => typeof value === "string" && value.trim(),
        )
      : [],

    platforms: Array.isArray(intent?.platforms)
      ? intent.platforms.filter(
          (value) => typeof value === "string" && value.trim(),
        )
      : [],

    features: Array.isArray(intent?.features)
      ? intent.features.filter(
          (value) => typeof value === "string" && value.trim(),
        )
      : [],

    setting:
      typeof intent?.setting === "string" && intent.setting.trim()
        ? intent.setting.trim()
        : null,

    gameplayStyle:
      typeof intent?.gameplayStyle === "string" && intent.gameplayStyle.trim()
        ? intent.gameplayStyle.trim()
        : null,

    exploration:
      typeof intent?.exploration === "string" && intent.exploration.trim()
        ? intent.exploration.trim()
        : null,

    storyImportance:
      typeof intent?.storyImportance === "string" &&
      intent.storyImportance.trim()
        ? intent.storyImportance.trim()
        : null,

    combatStyle:
      typeof intent?.combatStyle === "string" && intent.combatStyle.trim()
        ? intent.combatStyle.trim()
        : null,

    worldStructure:
      typeof intent?.worldStructure === "string" && intent.worldStructure.trim()
        ? intent.worldStructure.trim()
        : null,

    multiplayer:
      typeof intent?.multiplayer === "string" && intent.multiplayer.trim()
        ? intent.multiplayer.trim()
        : null,

    difficulty:
      typeof intent?.difficulty === "string" && intent.difficulty.trim()
        ? intent.difficulty.trim()
        : null,

    playerFreedom:
      typeof intent?.playerFreedom === "string" && intent.playerFreedom.trim()
        ? intent.playerFreedom.trim()
        : null,

    referenceGames: Array.isArray(intent?.referenceGames)
      ? intent.referenceGames.filter(
          (value) => typeof value === "string" && value.trim(),
        )
      : [],
  };
}

// ==============================================
// MERGE INTENT
// ==============================================

function mergeIntent(previousIntent = {}, currentIntent = {}) {
  const previous = normalizeIntent(previousIntent);
  const current = normalizeIntent(currentIntent);

  const hasField = (field) =>
    Object.prototype.hasOwnProperty.call(currentIntent, field);

  return {
    readyForDiscovery: hasField("readyForDiscovery")
      ? current.readyForDiscovery
      : previous.readyForDiscovery,

    genres: hasField("genres") ? current.genres : previous.genres,

    platforms: hasField("platforms") ? current.platforms : previous.platforms,

    features: hasField("features") ? current.features : previous.features,

    setting: hasField("setting") ? current.setting : previous.setting,

    gameplayStyle: hasField("gameplayStyle")
      ? current.gameplayStyle
      : previous.gameplayStyle,

    exploration: hasField("exploration")
      ? current.exploration
      : previous.exploration,

    storyImportance: hasField("storyImportance")
      ? current.storyImportance
      : previous.storyImportance,

    combatStyle: hasField("combatStyle")
      ? current.combatStyle
      : previous.combatStyle,

    worldStructure: hasField("worldStructure")
      ? current.worldStructure
      : previous.worldStructure,

    multiplayer: hasField("multiplayer")
      ? current.multiplayer
      : previous.multiplayer,

    difficulty: hasField("difficulty")
      ? current.difficulty
      : previous.difficulty,

    playerFreedom: hasField("playerFreedom")
      ? current.playerFreedom
      : previous.playerFreedom,

    referenceGames: hasField("referenceGames")
      ? current.referenceGames
      : previous.referenceGames,
  };
}

// ==============================================
// GEMINI REQUEST
// ==============================================

async function requestGemini(contents) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const model = FORTUNA_MODEL;

  const url =
    `${GEMINI_API_URL}/${model}:generateContent` +
    `?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    console.log("[FORTUNA] Gemini request timed out.");
    controller.abort();
  }, FORTUNA_REQUEST_TIMEOUT);

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
              text: FORTUNA_SYSTEM_INSTRUCTION,
            },
          ],
        },

        contents,

        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          responseMimeType: "application/json",
        },
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("[FORTUNA] Gemini API error:", responseText);

      throw new Error(
        `Gemini returned HTTP ${response.status}: ${responseText}`,
      );
    }

    let parsedResponse;

    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      throw new Error("Gemini returned an invalid API response.");
    }

    return parsedResponse;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        `FORTUNA request timed out after ${FORTUNA_REQUEST_TIMEOUT / 1000} seconds.`,
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ==============================================
// PARSE GEMINI JSON
// ==============================================

function parseGeminiResponse(responseText) {
  if (typeof responseText !== "string" || !responseText.trim()) {
    throw new Error("FORTUNA returned an empty response.");
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
    // Recovery below.
  }

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      // Final error below.
    }
  }

  throw new Error("FORTUNA returned invalid structured JSON.");
}

// ==============================================
// VALIDATE MODEL RESPONSE
// ==============================================

function validateModelResponse(response) {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    throw new Error("FORTUNA returned an invalid response.");
  }

  if (typeof response.reply !== "string" || !response.reply.trim()) {
    throw new Error("FORTUNA returned an invalid conversational reply.");
  }

  if (!["continue", "discover", "refine"].includes(response.discoveryAction)) {
    throw new Error("FORTUNA returned an invalid discovery action.");
  }

  if (
    !response.intent ||
    typeof response.intent !== "object" ||
    Array.isArray(response.intent)
  ) {
    throw new Error("FORTUNA returned an invalid intent.");
  }

  return true;
}

// ==============================================
// ASK FORTUNA
// ==============================================

export async function askFortuna(message, history = [], previousIntent = {}) {
  if (typeof message !== "string" || !message.trim()) {
    throw new Error("A valid message is required.");
  }

  if (!Array.isArray(history)) {
    throw new Error("FORTUNA conversation history must be an array.");
  }

  const currentMessage = message.trim();

  const normalizedPreviousIntent = normalizeIntent(previousIntent);

  // ============================================
  // NORMALIZE HISTORY
  // ============================================

  const safeHistory = history
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
        item.role === "assistant" || item.role === "model" ? "model" : "user",

      content: item.content.trim(),
    }))
    .filter((item) => item.content)
    .slice(-MAX_HISTORY_MESSAGES);

  // ============================================
  // PREVENT CURRENT MESSAGE DUPLICATION
  // ============================================

  const lastMessage = safeHistory[safeHistory.length - 1];

  const conversationContents =
    lastMessage?.role === "user" && lastMessage.content === currentMessage
      ? safeHistory
      : [
          ...safeHistory,
          {
            role: "user",
            content: currentMessage,
          },
        ];

  // ============================================
  // COMPACT INTENT CONTEXT
  // ============================================

  const intentContext = {
    role: "user",

    parts: [
      {
        text:
          `EXISTING_INTENT:\n${JSON.stringify(normalizedPreviousIntent)}\n\n` +
          `The EXISTING_INTENT is accumulated user preference state. ` +
          `Return the complete updated intent state. ` +
          `Preserve useful preferences unless the user explicitly changes ` +
          `or removes them. ` +
          `If the user changes a preference, replace the old value. ` +
          `If the user explicitly removes a preference, clear it using null ` +
          `for single-value fields or [] for array fields. ` +
          `You are the sole decision-maker for discoveryAction. ` +
          `Interpret short confirmations from the immediately preceding ` +
          `FORTUNA message and conversation context. ` +
          `A positive reaction to already-shown recommendations is NOT a ` +
          `new discovery request unless the user explicitly asks for more, ` +
          `similar, different, or new games.`,
      },
    ],
  };

  // ============================================
  // BUILD GEMINI CONTENTS
  // ============================================

  const geminiContents = [
    intentContext,

    ...conversationContents.map((item) => ({
      role: item.role,

      parts: [
        {
          text: item.content,
        },
      ],
    })),
  ];

  // ============================================
  // ASK GEMINI
  // ============================================

  const completion = await requestGemini(geminiContents);

  // ============================================
  // EXTRACT RESPONSE
  // ============================================

  const responseText = completion?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || "")
    .join("")
    .trim();

  if (!responseText) {
    throw new Error("FORTUNA returned an empty response.");
  }

  // ============================================
  // PARSE
  // ============================================

  const parsedResponse = parseGeminiResponse(responseText);

  // ============================================
  // VALIDATE
  // ============================================

  validateModelResponse(parsedResponse);

  // ============================================
  // MERGE INTENT
  // ============================================

  const mergedIntent = mergeIntent(
    normalizedPreviousIntent,
    parsedResponse.intent,
  );

  // ============================================
  // DISCOVERY SAFETY
  // ============================================

  let discoveryAction = parsedResponse.discoveryAction;

  if (
    discoveryAction === "discover" &&
    mergedIntent.readyForDiscovery !== true
  ) {
    discoveryAction = "continue";
  }

  // ============================================
  // RETURN
  // ============================================

  return {
    reply: parsedResponse.reply.trim(),

    discoveryAction,

    intent: mergedIntent,
  };
}
