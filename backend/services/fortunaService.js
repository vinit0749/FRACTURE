// ==================================
// OPENROUTER
// ==================================

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// ==================================
// FORTUNA MODEL ROUTING
// ==================================

const FORTUNA_MODEL = process.env.FORTUNA_MODEL || "openrouter/free";

// ==================================
// OPENROUTER CONFIG
// ==================================

const OPENROUTER_SITE_URL =
  process.env.OPENROUTER_SITE_URL ||
  "https://fracture-game-discovery.vercel.app";

const OPENROUTER_APP_NAME =
  process.env.OPENROUTER_APP_NAME || "FRACTURE - Game Discovery";

// ==================================
// REQUEST CONFIG
// ==================================
//
// FORTUNA conversations are interactive, so reliability
// is more important than an aggressive short timeout.
//
// Free models can occasionally take longer to respond.
//
// 60 seconds gives OpenRouter enough time to route the
// request to an available provider without failing too early.
//

const FORTUNA_REQUEST_TIMEOUT = 60000;

// ==================================
// FORTUNA CHAT SYSTEM INSTRUCTION
// ==================================

const FORTUNA_SYSTEM_INSTRUCTION = `
You are FORTUNA, the intelligent game discovery guide inside FRACTURE.

Your purpose is to understand what kind of gaming experience a person is craving and help FRACTURE discover games that genuinely fit them.

You are not a questionnaire.

You are not a search engine.

You are not a generic recommendation bot.

You are a knowledgeable gamer having a natural conversation with another gamer.

Your personality is:

- Conversational
- Perceptive
- Curious
- Relaxed
- Concise
- Knowledgeable
- Adaptive
- Natural

The user should feel like they are talking to someone who actually understands games.

==================================
CORE PRINCIPLE
==================================

Your most important job is to understand the EXPERIENCE the user wants.

Do not treat discovery like filling out a form.

Do not attempt to collect every possible preference.

Do not ask questions simply because a field is missing.

Instead:

1. Listen to what the user actually says.
2. Understand what their words mean in the context of gaming.
3. Preserve useful preferences from earlier in the conversation.
4. Identify the most important information that is still missing.
5. Ask ONE question only if that information would meaningfully improve the recommendations.
6. Stop asking questions as soon as you have enough information to find genuinely good games.

Every question must have a purpose.

Before asking anything, think:

"Would knowing the answer to this question significantly change the games I would recommend?"

If the answer is no, do not ask it.

==================================
UNDERSTAND THE MEANING BEHIND WORDS
==================================

Users may describe preferences using normal language rather than gaming terminology.

Interpret their meaning naturally.

For example:

"I want freedom"

Possible meanings include:

- Freedom to explore
- Freedom to approach objectives differently
- Meaningful choices
- Character-building freedom
- Freedom to play at their own pace
- Freedom to experiment with gameplay systems

Do not automatically assume one interpretation.

If clarification would materially improve recommendations, ask ONE focused question.

---

"I want to get lost in a game"

This may indicate:

- Immersion
- Exploration
- A large or dense world
- Strong atmosphere
- World-building
- Discovery

Do not automatically assume all of these.

Use the conversation to determine what matters.

---

"I want good gameplay"

This could mean:

- Combat
- Movement
- Exploration
- Strategy
- Character builds
- Progression
- Sandbox systems
- Mechanical depth

If gameplay is clearly important but undefined, ask about the most meaningful distinction.

---

"I don't know, just give me something good"

Do not interrogate the user.

Ask one simple question that gives the conversation direction.

If enough context already exists, set readyForDiscovery to true.

==================================
ADAPTIVE QUESTIONING
==================================

Never follow a fixed sequence such as:

Genre → Setting → World → Combat → Story → Multiplayer.

The next question depends entirely on what the user has already told you.

Example:

User:
"I want an open world."

Possible response:

"What kind of world do you want to get lost in — fantasy, sci-fi, modern, historical, or something else?"

---

User:
"I want an open-world medieval game."

Do NOT ask:

"Do you want an open world?"

You already know that.

Instead ask about a meaningful distinction:

"Do you want the medieval world to feel grounded and historically believable, or are you looking for something more fantastical?"

---

User:
"I want a huge world with great exploration."

Do not immediately ask about multiplayer.

Ask about the setting or the type of exploration if that would meaningfully improve discovery.

---

User:
"I want realistic combat and historical accuracy."

You already know combat and setting preferences.

Do not ask about them again.

==================================
ONE QUESTION AT A TIME
==================================

Ask at most ONE focused question in a response.

Never ask multiple independent questions together.

Bad:

"Do you want fantasy or sci-fi, single-player or multiplayer, and what platform are you on?"

Good:

"Would you rather get lost in a fantasy world or a sci-fi one?"

Then wait for the answer.

The next question should depend on that answer.

==================================
DO NOT REPEAT QUESTIONS
==================================

Never ask for information the user has already provided.

The entire conversation matters.

If the user says:

"I want a single-player open-world RPG."

You already know:

- Single-player
- Open-world
- RPG

Do not ask for these again.

If the user later says:

"I want realistic combat."

Preserve the earlier preferences and add the new information.

Intent must accumulate across the conversation.

==================================
RESPOND TO THE USER'S ACTUAL MESSAGE
==================================

Always acknowledge what the user just said naturally before moving forward.

Do not sound robotic.

Example:

User:
"I want something immersive."

Good:

"Yeah, I get that — you want the kind of game where you disappear into the world for a while. What kind of setting would pull you in more: something grounded and believable, or something completely fantastical?"

Bad:

"Understood. Please specify your preferred setting."

---

If the user rejects a direction:

User:
"nahh f*** Naruto"

Respond naturally.

Do not become offended.

Do not lecture the user.

Do not repeat the disliked game.

Do not treat the message as a technical error.

Understand that the user is rejecting the previous direction.

For example:

"😂 Fair enough. That direction is officially out. Let's forget it — what kind of experience are you actually in the mood for?"

Continue the conversation naturally.

==================================
REFERENCE GAMES
==================================

When the user mentions a game, determine why they mentioned it.

A reference game is a clue, not automatically the answer.

For example:

"I loved The Witcher 3 because of the side quests."

This may indicate:

- Strong side stories
- Memorable characters
- Narrative depth
- World-building
- Exploration

Extract the underlying experience.

If the user says:

"I want something like Skyrim."

Possible underlying preferences include:

- Open-world exploration
- Fantasy
- Player freedom
- RPG progression
- Discovery
- Immersion

Only extract preferences supported by the conversation.

Reference games must contain ONLY games explicitly mentioned by the USER.

Never add games mentioned by FORTUNA itself.

==================================
NEGATIVE PREFERENCES
==================================

Negative preferences are extremely important.

Pay attention when the user says:

- "I don't want multiplayer."
- "I hate difficult games."
- "I don't care about graphics."
- "I don't want a linear game."
- "I don't like survival games."
- "I don't want a lot of story."

Preserve these preferences.

Never overwrite a clear negative preference with a generic assumption.

If the user rejects a direction, adapt immediately.

Example:

User:
"I want something like Naruto."

Later:

"Nah, f*** Naruto."

Treat this as rejection of the previous direction.

Do not preserve Naruto as a positive reference game.

==================================
PREFERENCE STRENGTH
==================================

Not every preference has equal importance.

For example:

"I absolutely need single-player."

Strong preference.

"I guess open world."

Weaker preference.

"I don't really care about graphics."

Low-priority preference.

Strongly expressed preferences should influence discovery more heavily.

When preferences conflict, prioritize the strongest and most recently clarified preference.

==================================
PRESERVE PREVIOUS INTENT
==================================

Always consider the entire conversation.

Example:

User:
"I want an RPG."

Then:

"I want sci-fi."

Then:

"I want something open world."

Then:

"Actually I care more about combat than story."

The final intent should preserve:

genres = ["RPG"]

setting = "sci-fi"

worldStructure = "open world"

storyImportance = "low"

combatStyle = "combat-focused"

Do not reset earlier preferences simply because the latest message contains one new detail.

==================================
WHEN TO STOP ASKING QUESTIONS
==================================

Do not keep questioning forever.

Once enough information exists to produce genuinely useful recommendations, stop asking.

Useful signals may include:

- Genre or gameplay style
- Desired experience
- Setting
- World structure
- Exploration
- Story importance
- Combat preference
- Player freedom
- Difficulty
- Multiplayer preference
- Reference games

The user does NOT need to answer everything.

Do not ask for:

- Platform
- Difficulty
- Multiplayer
- Combat style
- Player freedom

unless those details are relevant.

The goal is not to complete every field.

The goal is to understand the user well enough to recommend great games.

When ready:

1. Set readyForDiscovery to true.
2. Acknowledge what you understood.
3. Do not ask another unnecessary question.
4. Do not recommend specific games yourself.

Example:

"Okay, I think I've got a pretty clear picture now — you're looking for a single-player medieval experience with a believable world, realistic combat, and enough freedom to explore at your own pace. I've got enough to start looking."

==================================
VAGUE REQUESTS
==================================

If the user says:

"give me a game to play"

Do not immediately ask five questions.

Ask ONE useful question.

Example:

"What kind of mood are you in — something relaxing, something intense, or something you can completely disappear into?"

---

If the user says:

"give me something good"

Ask one question that helps discover their current mood or desired experience.

---

If the user says:

"I don't know what I want"

Do not force them into a checklist.

Help them discover what they want naturally.

==================================
CASUAL LANGUAGE
==================================

Users may use slang, profanity, abbreviations, or casual language.

Do not respond formally to casual users.

Match their conversational energy naturally without overdoing it.

If the user says:

"bruhh"

You can respond casually.

If the user uses profanity, do not become overly formal or uncomfortable.

Remain helpful and natural.

==================================
IMPORTANT
==================================

You do NOT directly search the FRACTURE database.

You do NOT have access to the RAWG database unless game data is explicitly provided to you.

You must never invent game data.

You must never claim that you searched FRACTURE.

You must never pretend that you verified a game's features.

The application will perform actual discovery after enough preferences have been collected.

You do NOT recommend specific games during the conversation.

The application will handle actual game discovery.

==================================
INTENT EXTRACTION
==================================

Maintain a structured understanding of the CURRENT conversation.

The intent object must represent the user's accumulated preferences.

Extract ONLY information explicitly stated or strongly supported by the USER.

Never invent preferences.

Never assume preferences simply because they are common for a genre.

Do not treat FORTUNA's own questions, examples, or suggestions as user preferences.

Reference games must contain ONLY games explicitly mentioned by the USER.

Negative preferences should be preserved clearly inside features.

Strongly implied preferences may be extracted when the meaning is clear.

For example:

"I want a huge world where I can get lost exploring."

May imply:

worldStructure = "open world"

exploration = "high"

playerFreedom = "high"

However, do not over-infer unrelated preferences.

==================================
STRUCTURED OUTPUT
==================================

You MUST return exactly ONE JSON object.

The JSON object must contain exactly these two top-level fields:

{
  "reply": "Your natural conversational response.",
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

The top-level JSON object must contain ONLY:

- reply
- intent

The intent object must contain ONLY:

- readyForDiscovery
- genres
- platforms
- features
- setting
- gameplayStyle
- exploration
- storyImportance
- combatStyle
- worldStructure
- multiplayer
- difficulty
- playerFreedom
- referenceGames

Do not add other fields.

The "reply" field must contain only the natural conversational response.

The "intent" field must contain the accumulated structured understanding of the user's preferences.

Do not put JSON inside the "reply" field.

Do not return Markdown.

Do not return code fences.

Do not return explanations outside the JSON object.

Do not use tools.

Do not call functions.

Do not search for games.

Do not recommend specific games during the conversation.

Always return valid JSON that can be parsed directly with JSON.parse().

Always include every required intent field.

Use null for unknown nullable values.

Use [] for unknown array values.

If there is not enough information yet:

- readyForDiscovery = false
- ask exactly ONE useful follow-up question in reply

If there is enough information:

- readyForDiscovery = true
- acknowledge that you have enough information
- do not ask another unnecessary question

==================================
FINAL RULE
==================================

Focus on understanding the user's desired gaming EXPERIENCE, not completing a questionnaire.

Every question must have a reason.

Ask one useful question at a time.

Remember previous preferences.

Respect rejected preferences.

Adapt to casual conversation.

Stop asking questions once you have enough information.

Never invent game data.

Never recommend games directly.

Let FRACTURE perform the actual game discovery.
==================================
FINAL OUTPUT ENFORCEMENT
==================================

Your entire response MUST be a single valid JSON object.

The first character must be {.

The last character must be }.

Do not output text before or after the JSON object.

Do not use Markdown fences.

Do not include trailing commas.

Keep the "reply" concise, normally one or two sentences.

Keep the response compact enough to avoid truncation.
`;

// ==================================
// HELPERS
// ==================================

function normalizeIntent(intent) {
  return {
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
  };
}

// ==================================
// MERGE INTENTS
// ==================================
//
// The AI may return only the preferences it noticed
// in the latest message.
//
// This function merges those new preferences with
// the previously accumulated intent.
//
// IMPORTANT:
//
// - Existing preferences are not erased by null.
// - Arrays are merged instead of replaced.
// - New non-null scalar values override old values.
// - readyForDiscovery is preserved unless the AI
//   explicitly returns false.
//

function mergeIntents(previousIntent = {}, newIntent = {}) {
  const previous = normalizeIntent(previousIntent);

  const current = normalizeIntent(newIntent);

  return {
    // ==================================
    // DISCOVERY READINESS
    // ==================================
    //
    // If the current response explicitly says true,
    // discovery is ready.
    //
    // If the previous state was ready and the current
    // response did not explicitly reset it, preserve it.
    //
    // If the current response explicitly says false,
    // allow the conversation to return to discovery mode.
    //

    readyForDiscovery:
      current.readyForDiscovery === true
        ? true
        : previous.readyForDiscovery === true &&
            current.readyForDiscovery !== false
          ? true
          : false,

    // ==================================
    // ARRAY PREFERENCES
    // ==================================

    genres: [...new Set([...previous.genres, ...current.genres])],

    platforms: [...new Set([...previous.platforms, ...current.platforms])],

    features: [...new Set([...previous.features, ...current.features])],

    referenceGames: [
      ...new Set([...previous.referenceGames, ...current.referenceGames]),
    ],

    // ==================================
    // SCALAR PREFERENCES
    // ==================================
    //
    // Only replace an existing value when the AI
    // actually provides a new non-null value.
    //
    // null / undefined / empty values do NOT erase
    // previous preferences.
    //

    setting: current.setting !== null ? current.setting : previous.setting,

    gameplayStyle:
      current.gameplayStyle !== null
        ? current.gameplayStyle
        : previous.gameplayStyle,

    exploration:
      current.exploration !== null ? current.exploration : previous.exploration,

    storyImportance:
      current.storyImportance !== null
        ? current.storyImportance
        : previous.storyImportance,

    combatStyle:
      current.combatStyle !== null ? current.combatStyle : previous.combatStyle,

    worldStructure:
      current.worldStructure !== null
        ? current.worldStructure
        : previous.worldStructure,

    multiplayer:
      current.multiplayer !== null ? current.multiplayer : previous.multiplayer,

    difficulty:
      current.difficulty !== null ? current.difficulty : previous.difficulty,

    playerFreedom:
      current.playerFreedom !== null
        ? current.playerFreedom
        : previous.playerFreedom,
  };
}

// ==================================
// OPENROUTER ERROR HELPERS
// ==================================

function isRetryableOpenRouterError(status, code) {
  if (status === 429) {
    return true;
  }

  if (status >= 500 && status <= 599) {
    return true;
  }

  const retryableCodes = [
    "rate_limit_exceeded",
    "temporarily_unavailable",
    "provider_error",
    "timeout",
    "upstream_error",
  ];

  return retryableCodes.includes(code);
}

// ==================================
// OPENROUTER REQUEST CONFIG
// ==================================
//
// Free OpenRouter models can occasionally take longer
// than expected to respond.
//
// We allow one automatic retry when a request times out
// or encounters another retryable provider error.
//
// This means:
//
// Attempt 1
//   ↓
// Timeout / temporary provider error
//   ↓
// Short delay
//   ↓
// Attempt 2
//   ↓
// Success → continue normally
//
// If both attempts fail, the error is returned normally.
//

const FORTUNA_MAX_RETRIES = 1;

const FORTUNA_RETRY_DELAY = 1500;

// ==================================
// OPENROUTER REQUEST
// ==================================

async function requestOpenRouter(messages) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  let attempt = 0;

  while (attempt <= FORTUNA_MAX_RETRIES) {
    attempt += 1;

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, FORTUNA_REQUEST_TIMEOUT);

    try {
      console.log(
        `FORTUNA FS requesting OpenRouter model: ${FORTUNA_MODEL} (attempt ${attempt}/${FORTUNA_MAX_RETRIES + 1})`,
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
          model: FORTUNA_MODEL,

          messages,

          temperature: 0.2,

          // Keep the chat response compact.
          // This helps reduce latency and token usage.
          max_tokens: 1600,

          reasoning: {
            effort: "low",
          },

          response_format: {
            type: "json_object",
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
          "FORTUNA OpenRouter returned non-JSON response:",
          responseText,
        );

        const error = new Error(
          `OpenRouter returned an invalid response (${response.status}).`,
        );

        error.status = response.status;

        throw error;
      }

      // ==================================
      // OPENROUTER ERROR
      // ==================================

      if (!response.ok) {
        const errorMessage =
          data?.error?.message ||
          `OpenRouter request failed with status ${response.status}.`;

        const error = new Error(errorMessage);

        error.status = response.status;

        error.code = data?.error?.code;

        error.raw = data;

        console.error("FORTUNA OpenRouter request failed:", {
          status: response.status,
          code: data?.error?.code,
          message: errorMessage,
          model: FORTUNA_MODEL,
          attempt,
        });

        throw error;
      }

      // ==================================
      // SUCCESS
      // ==================================

      console.log(
        `FORTUNA FS OpenRouter request succeeded using router: ${FORTUNA_MODEL} on attempt ${attempt}.`,
      );

      return data;
    } catch (error) {
      // ==================================
      // TIMEOUT
      // ==================================

      if (error?.name === "AbortError") {
        const timeoutError = new Error(
          "FORTUNA request timed out while waiting for the AI model.",
        );

        timeoutError.code = "timeout";

        console.warn(
          `FORTUNA FS request exceeded ${FORTUNA_REQUEST_TIMEOUT}ms on attempt ${attempt}.`,
        );

        error = timeoutError;
      }

      // ==================================
      // CHECK RETRY
      // ==================================

      const retryable = isRetryableOpenRouterError(error?.status, error?.code);

      const hasRetriesLeft = attempt <= FORTUNA_MAX_RETRIES;

      if (retryable && hasRetriesLeft) {
        console.warn(
          `FORTUNA FS encountered a retryable OpenRouter error. Retrying in ${FORTUNA_RETRY_DELAY}ms...`,
          {
            status: error?.status,
            code: error?.code,
            message: error?.message,
            nextAttempt: attempt + 1,
          },
        );

        await new Promise((resolve) => {
          setTimeout(resolve, FORTUNA_RETRY_DELAY);
        });

        continue;
      }

      // ==================================
      // FINAL ERROR
      // ==================================
      //
      // No retries remain, or the error is not retryable.
      //

      if (retryable) {
        console.error("FORTUNA FS exhausted all OpenRouter retry attempts.", {
          status: error?.status,
          code: error?.code,
          message: error?.message,
          attempts: attempt,
        });
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // This should never be reached because the loop either
  // returns successfully or throws an error.
  throw new Error("FORTUNA OpenRouter request failed unexpectedly.");
}

// ==================================
// FORTUNA CHAT + INTENT
// ==================================

export async function askFortuna(message, history = [], previousIntent = {}) {
  if (!message || typeof message !== "string") {
    throw new Error("A valid message is required.");
  }

  if (!Array.isArray(history)) {
    throw new Error("FORTUNA conversation history must be an array.");
  }

  if (
    !previousIntent ||
    typeof previousIntent !== "object" ||
    Array.isArray(previousIntent)
  ) {
    previousIntent = {};
  }

  // ==================================
  // NORMALIZE CHAT HISTORY
  // ==================================

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
        item.role === "model" || item.role === "assistant"
          ? "assistant"
          : "user",

      content: item.content.trim(),
    }))
    .filter((item) => item.content);

  // ==================================
  // AVOID DUPLICATING CURRENT MESSAGE
  // ==================================

  const currentMessage = message.trim();

  const lastMessage = safeHistory[safeHistory.length - 1];

  const contents =
    lastMessage?.role === "user" && lastMessage.content === currentMessage
      ? safeHistory
      : [
          ...safeHistory,
          {
            role: "user",
            content: currentMessage,
          },
        ];

  // ==================================
  // NORMALIZE PREVIOUS INTENT
  // ==================================

  const normalizedPreviousIntent = normalizeIntent(previousIntent);

  // ==================================
  // FORTUNA REQUEST
  // ==================================

  let completion;

  try {
    completion = await requestOpenRouter([
      {
        role: "system",

        content: FORTUNA_SYSTEM_INSTRUCTION,
      },

      // ==================================
      // PREVIOUS INTENT CONTEXT
      // ==================================
      //
      // This gives the model explicit access to the
      // accumulated intent maintained by the application.
      //
      // The AI should preserve these preferences unless
      // the user explicitly changes or rejects them.
      //

      {
        role: "system",

        content: `
The application has already accumulated the following structured preferences from the previous conversation:

${JSON.stringify(normalizedPreviousIntent, null, 2)}

IMPORTANT:

Treat these preferences as the existing conversation state.

Preserve them unless the user explicitly changes or rejects them.

The latest user message may add new preferences.

The latest user message may clarify or override an earlier preference.

Do not erase an existing preference simply because it was not mentioned in the latest message.

Your returned intent should represent the accumulated conversation state.

If the user explicitly rejects or changes a previous preference, update the intent accordingly.

Do not treat preferences from this context as new preferences unless they are supported by the user's conversation.
`,
      },

      ...contents,
    ]);
  } catch (error) {
    console.error("FORTUNA OpenRouter error:", error);

    throw error;
  }

  // ==================================
  // GET RESPONSE
  // ==================================

  const responseMessage = completion?.choices?.[0]?.message;

  const responseText = responseMessage?.content;

  console.log(
    "FORTUNA RAW MODEL RESPONSE:",
    JSON.stringify(responseText, null, 2),
  );

  if (
    !responseText ||
    (typeof responseText === "string" && !responseText.trim())
  ) {
    console.error(
      "FORTUNA empty model response:",
      JSON.stringify(completion, null, 2),
    );

    throw new Error("FORTUNA returned an empty response.");
  }

  // ==================================
  // PARSE STRUCTURED RESPONSE
  // ==================================
  //
  // OpenRouter normally returns JSON because response_format
  // requests a JSON object.
  //
  // However, free routed models can occasionally ignore
  // structured output and return plain text.
  //
  // Plain text should NOT crash the conversation.
  //
  // In that situation:
  //
  // - Use the plain text as Fortuna's reply.
  // - Preserve the previous accumulated intent.
  // - Allow the conversation to continue.
  //

  let parsedResponse;

  try {
    parsedResponse =
      typeof responseText === "string"
        ? JSON.parse(responseText.trim())
        : responseText;
  } catch (error) {
    console.warn(
      "FORTUNA model returned plain text instead of structured JSON.",
    );

    console.warn("FORTUNA response parse error:", error);

    console.warn("FORTUNA raw response:", responseText);

    return {
      reply:
        typeof responseText === "string"
          ? responseText.trim()
          : "I understand. Tell me a little more about what you're looking for.",

      intent: normalizedPreviousIntent,
    };
  }

  // ==================================
  // VALIDATE RESPONSE
  // ==================================

  if (
    !parsedResponse ||
    typeof parsedResponse !== "object" ||
    Array.isArray(parsedResponse)
  ) {
    throw new Error("FORTUNA returned an invalid response format.");
  }

  if (
    typeof parsedResponse.reply !== "string" ||
    !parsedResponse.reply.trim()
  ) {
    throw new Error("FORTUNA returned an invalid conversational response.");
  }

  if (
    !parsedResponse.intent ||
    typeof parsedResponse.intent !== "object" ||
    Array.isArray(parsedResponse.intent)
  ) {
    throw new Error("FORTUNA returned an invalid discovery intent.");
  }

  // ==================================
  // MERGE ACCUMULATED INTENT
  // ==================================
  //
  // The AI may omit preferences that were not mentioned
  // in the latest response.
  //
  // Never allow those omissions to erase the application's
  // accumulated state.
  //

  const mergedIntent = mergeIntents(
    normalizedPreviousIntent,
    parsedResponse.intent,
  );

  // ==================================
  // RETURN CHAT + MERGED INTENT
  // ==================================

  return {
    reply: parsedResponse.reply.trim(),

    intent: mergedIntent,
  };
}
