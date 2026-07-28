const BLOCKED_TAGS = ["sexual content", "nudity", "adult", "nsfw", "hentai"];

const BLOCKED_GAME_SLUGS = ["knightly-passions-01a-version-adult-game-18"];

export function isSafeGame(game) {
  // Manually block known adult games
  if (BLOCKED_GAME_SLUGS.includes(game?.slug)) {
    return false;
  }

  // Block games with unsafe RAWG tags
  const tags = game?.tags || [];

  return !tags.some((tag) => BLOCKED_TAGS.includes(tag?.name?.toLowerCase()));
}
