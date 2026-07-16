const BLOCKED_TAGS = ["sexual content", "nudity", "adult", "nsfw", "hentai"];

export function isSafeGame(game) {
  const tags = game.tags || [];

  return !tags.some((tag) => BLOCKED_TAGS.includes(tag.name.toLowerCase()));
}
