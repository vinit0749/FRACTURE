import { useEffect, useState } from "react";

import {
  fetchGames,
  fetchGameDetails,
  fetchGameScreenshots,
} from "../api/fracture";

/* ============================================================
   HERO CACHE
   ============================================================ */

let heroCache = null;
let heroPromise = null;

/* ============================================================
   CONSTANTS
   ============================================================ */

const MONTH = 1000 * 60 * 60 * 24 * 30;

const HERO_HISTORY_KEY = "fracture_hero_history";
const MAX_HERO_HISTORY = 10;

const MIN_RANDOM_PAGE = 1;
const MAX_RANDOM_PAGE = 20;

const MAX_HERO_ATTEMPTS = 5;

/* ============================================================
   HERO METADATA
   ============================================================ */

function getHeroMetadata(game, category) {
  const rating = game.rating || 0;

  switch (category) {
    case "HIGHLY_RATED":
      return {
        heroType: "CRITIC'S CHOICE",
        badge: "CRITIC'S CHOICE",
        reason:
          "An exceptional experience with outstanding reception from players.",
        category: "TOP RATED",
        score: rating,
      };

    case "POPULAR":
      return {
        heroType: "PLAYER FAVORITE",
        badge: "PLAYER FAVORITE",
        reason: "A beloved game with a huge following among players.",
        category: "POPULAR",
        score: rating,
      };

    case "UNDERRATED":
      return {
        heroType: "HIDDEN GEM",
        badge: "HIDDEN GEM",
        reason: "A highly rated experience that deserves more attention.",
        category: "DISCOVERY",
        score: rating,
      };

    case "NEW":
      return {
        heroType: "NEW RELEASE",
        badge: "LATEST ADVENTURE",
        reason: "A recent release making an impression with players.",
        category: "NEW",
        score: rating,
      };

    case "TRENDING":
      return {
        heroType: "TRENDING NOW",
        badge: "TRENDING NOW",
        reason:
          "A popular experience currently attracting plenty of attention.",
        category: "TRENDING",
        score: rating,
      };

    default:
      return {
        heroType: "FEATURED DISCOVERY",
        badge: "FEATURED DISCOVERY",
        reason: "A standout gaming experience waiting to be discovered.",
        category: "FEATURED",
        score: rating,
      };
  }
}

/* ============================================================
   BASIC QUALITY FILTER
   ============================================================ */

function isValidGame(game) {
  if (!game) return false;

  if (!game.background_image) return false;

  if (typeof game.rating !== "number") return false;

  if (game.rating < 3.8) return false;

  if (!game.released) return false;

  return true;
}

function isFallbackGame(game) {
  if (!game) return false;

  if (!game.background_image) return false;

  if (typeof game.rating !== "number") return false;

  if (game.rating < 3.5) return false;

  return true;
}

/* ============================================================
   DATE HELPERS
   ============================================================ */

function getMonthsOld(game) {
  if (!game?.released) return Infinity;

  const releaseDate = new Date(game.released);

  if (Number.isNaN(releaseDate.getTime())) {
    return Infinity;
  }

  return (Date.now() - releaseDate.getTime()) / MONTH;
}

/* ============================================================
   HERO HISTORY
   ============================================================ */

function getHeroHistory() {
  try {
    const stored = sessionStorage.getItem(HERO_HISTORY_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHeroHistory(id) {
  if (!id) return;

  try {
    const history = getHeroHistory().filter((historyId) => historyId !== id);

    history.unshift(id);

    sessionStorage.setItem(
      HERO_HISTORY_KEY,
      JSON.stringify(history.slice(0, MAX_HERO_HISTORY)),
    );
  } catch {
    // Storage failure should never break Hero.
  }
}

/* ============================================================
   RANDOM HELPERS
   ============================================================ */

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function getRandomPages(count) {
  const pages = new Set();

  while (pages.size < Math.min(count, MAX_RANDOM_PAGE)) {
    pages.add(randomInteger(MIN_RANDOM_PAGE, MAX_RANDOM_PAGE));
  }

  return [...pages];
}

/* ============================================================
   CATEGORY FILTERS
   ============================================================ */

function isHighlyRated(game) {
  const rating = game.rating || 0;
  const count = game.ratings_count || 0;

  return isValidGame(game) && rating >= 4.3 && count >= 100;
}

function isPopular(game) {
  const rating = game.rating || 0;
  const count = game.ratings_count || 0;

  return isValidGame(game) && rating >= 4.0 && count >= 1000;
}

function isUnderrated(game) {
  const rating = game.rating || 0;
  const count = game.ratings_count || 0;

  return (
    isValidGame(game) &&
    rating >= 4.05 &&
    rating <= 4.55 &&
    count >= 50 &&
    count < 3000
  );
}

function isNewRelease(game) {
  const rating = game.rating || 0;
  const count = game.ratings_count || 0;
  const monthsOld = getMonthsOld(game);

  return (
    isValidGame(game) &&
    monthsOld >= 0 &&
    monthsOld <= 12 &&
    rating >= 3.9 &&
    count >= 50
  );
}

function isTrending(game) {
  const rating = game.rating || 0;
  const count = game.ratings_count || 0;
  const monthsOld = getMonthsOld(game);

  return isValidGame(game) && rating >= 4.0 && count >= 250 && monthsOld <= 36;
}

/* ============================================================
   CATEGORY SCORING
   ============================================================ */

function scoreHighlyRated(game) {
  const rating = game.rating || 0;
  const count = game.ratings_count || 0;

  return rating * 100 + Math.log10(count + 1) * 20 + Math.random() * 40;
}

function scorePopular(game) {
  const rating = game.rating || 0;
  const count = game.ratings_count || 0;

  return rating * 65 + Math.log10(count + 1) * 45 + Math.random() * 50;
}

function scoreUnderrated(game) {
  const rating = game.rating || 0;
  const count = game.ratings_count || 0;

  return rating * 105 - Math.log10(count + 1) * 10 + Math.random() * 50;
}

function scoreNewRelease(game) {
  const rating = game.rating || 0;
  const count = game.ratings_count || 0;
  const monthsOld = getMonthsOld(game);

  let freshnessBonus = 0;

  if (monthsOld <= 3) {
    freshnessBonus = 35;
  } else if (monthsOld <= 6) {
    freshnessBonus = 25;
  } else if (monthsOld <= 12) {
    freshnessBonus = 12;
  }

  return (
    rating * 90 +
    Math.log10(count + 1) * 20 +
    freshnessBonus +
    Math.random() * 50
  );
}

function scoreTrending(game) {
  const rating = game.rating || 0;
  const count = game.ratings_count || 0;
  const monthsOld = getMonthsOld(game);

  let recencyBonus = 0;

  if (monthsOld <= 3) {
    recencyBonus = 30;
  } else if (monthsOld <= 6) {
    recencyBonus = 20;
  } else if (monthsOld <= 12) {
    recencyBonus = 10;
  }

  return (
    rating * 70 + Math.log10(count + 1) * 40 + recencyBonus + Math.random() * 50
  );
}

/* ============================================================
   RANK CATEGORY
   ============================================================ */

function rankCategory(games, filter, scorer, limit = 10) {
  return games
    .filter(filter)
    .map((game) => ({
      game,
      score: scorer(game),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.game);
}

/* ============================================================
   RANDOM CANDIDATE
   ============================================================ */

function chooseFromPool(pool) {
  if (!pool.length) {
    return null;
  }

  const shuffled = shuffle(pool);

  const selectionPool = shuffled.slice(
    0,
    Math.max(1, Math.ceil(shuffled.length / 2)),
  );

  return selectionPool[randomInteger(0, selectionPool.length - 1)];
}

/* ============================================================
   SELECT HERO
   ============================================================ */

function selectHeroCandidate(games) {
  const uniqueGames = [
    ...new Map(games.filter(Boolean).map((game) => [game.id, game])).values(),
  ];

  if (!uniqueGames.length) {
    return null;
  }

  const history = getHeroHistory();

  let availableGames = uniqueGames.filter((game) => !history.includes(game.id));

  if (availableGames.length < 5) {
    availableGames = uniqueGames;
  }

  const validGames = availableGames.filter(isValidGame);

  if (validGames.length > 0) {
    const pools = {
      HIGHLY_RATED: rankCategory(validGames, isHighlyRated, scoreHighlyRated),
      POPULAR: rankCategory(validGames, isPopular, scorePopular),
      UNDERRATED: rankCategory(validGames, isUnderrated, scoreUnderrated),
      NEW: rankCategory(validGames, isNewRelease, scoreNewRelease),
      TRENDING: rankCategory(validGames, isTrending, scoreTrending),
    };

    const categoryWeights = {
      HIGHLY_RATED: 24,
      POPULAR: 21,
      UNDERRATED: 23,
      NEW: 16,
      TRENDING: 16,
    };

    const availableCategories = Object.keys(pools).filter(
      (category) => pools[category].length > 0,
    );

    if (!availableCategories.length) {
      const fallback = chooseFromPool(validGames.slice(0, 10));

      if (fallback) {
        return {
          game: fallback,
          category: "HIGHLY_RATED",
        };
      }
    }

    if (availableCategories.length > 0) {
      const totalWeight = availableCategories.reduce(
        (total, category) => total + categoryWeights[category],
        0,
      );

      let random = Math.random() * totalWeight;

      let selectedCategory = availableCategories[0];

      for (const category of availableCategories) {
        random -= categoryWeights[category];

        if (random <= 0) {
          selectedCategory = category;
          break;
        }
      }

      const game = chooseFromPool(pools[selectedCategory]);

      if (game) {
        return {
          game,
          category: selectedCategory,
        };
      }
    }

    const fallback = chooseFromPool(validGames);

    if (fallback) {
      return {
        game: fallback,
        category: "FEATURED",
      };
    }
  }

  const fallbackGames = availableGames.filter(isFallbackGame);

  if (fallbackGames.length > 0) {
    const game = chooseFromPool(fallbackGames);

    if (game) {
      return {
        game,
        category: "FEATURED",
      };
    }
  }

  return null;
}

/* ============================================================
   FIND HERO CANDIDATE
   ============================================================ */

async function findHeroCandidate() {
  const pages = getRandomPages(MAX_HERO_ATTEMPTS);

  let lastError = null;

  for (let attempt = 0; attempt < pages.length; attempt++) {
    const page = pages[attempt];

    try {
      const data = await fetchGames(
        `&ordering=-rating&page_size=40&page=${page}`,
      );

      const games = Array.isArray(data?.results) ? data.results : [];

      const selected = selectHeroCandidate(games);

      if (selected) {
        return selected;
      }
    } catch (error) {
      lastError = error;

      console.warn(
        `FRACTURE Hero: page ${page} failed, trying another page.`,
        error,
      );
    }
  }

  if (lastError) {
    console.warn("FRACTURE Hero: all candidate pages failed.", lastError);
  }

  return null;
}

/* ============================================================
   HERO HOOK
   ============================================================ */

export default function useHero() {
  const [featuredGame, setFeaturedGame] = useState(
    heroCache?.featuredGame || null,
  );

  const [heroImages, setHeroImages] = useState(heroCache?.heroImages || []);

  const [heroMeta, setHeroMeta] = useState(heroCache?.heroMeta || null);

  const [loading, setLoading] = useState(!heroCache);

  const [error, setError] = useState("");

  /* ==========================================================
     LOAD CACHED HERO
     ========================================================== */

  useEffect(() => {
    if (heroCache) {
      setFeaturedGame(heroCache.featuredGame);
      setHeroImages(heroCache.heroImages);
      setHeroMeta(heroCache.heroMeta);
      setError("");
      setLoading(false);

      return;
    }

    loadFeaturedGame().then((data) => {
      if (!data) {
        setLoading(false);
        return;
      }

      setFeaturedGame(data.featuredGame);
      setHeroImages(data.heroImages);
      setHeroMeta(data.heroMeta);

      setError("");
      setLoading(false);
    });
  }, []);

  /* ==========================================================
     LOAD FEATURED GAME
     ========================================================== */

  async function loadFeaturedGame() {
    if (heroPromise) {
      return heroPromise;
    }

    heroPromise = (async () => {
      try {
        const selected = await findHeroCandidate();

        if (!selected) {
          throw new Error(
            "Hero API returned no usable games after multiple attempts.",
          );
        }

        const details = await fetchGameDetails(selected.game.id);

        if (!isFallbackGame(details)) {
          throw new Error("Selected Hero game has no usable artwork.");
        }

        /* ====================================================
           SCREENSHOTS
           ==================================================== */

        let screenshots = [];

        try {
          const screenshotData = await fetchGameScreenshots(details.id);

          screenshots = [
            ...new Set(
              (screenshotData.results || [])
                .map((shot) => shot.image)
                .filter(Boolean),
            ),
          ];
        } catch (screenshotError) {
          /*
            Screenshots are enhancement only.
            The Hero remains valid without them.
          */

          console.warn(
            "FRACTURE Hero screenshots unavailable:",
            screenshotError,
          );
        }

        /* ====================================================
           HERO IMAGES
           ==================================================== */

        const images = [details.background_image, ...screenshots].filter(
          Boolean,
        );

        /* ====================================================
           SAVE HISTORY
           ==================================================== */

        saveHeroHistory(details.id);

        /* ====================================================
           CACHE
           ==================================================== */

        heroCache = {
          featuredGame: details,
          heroImages: [...new Set(images)],
          heroMeta: getHeroMetadata(details, selected.category),
        };

        return heroCache;
      } catch (error) {
        console.error("Hero loading failed:", error);

        setError("We couldn't load the hero experience. Please try again.");

        return null;
      } finally {
        heroPromise = null;
      }
    })();

    return heroPromise;
  }

  /* ==========================================================
     RETRY / NEW HERO
     ========================================================== */

  function retry() {
    setError("");
    setLoading(true);

    heroCache = null;

    loadFeaturedGame().then((data) => {
      if (!data) {
        setLoading(false);
        return;
      }

      setFeaturedGame(data.featuredGame);
      setHeroImages(data.heroImages);
      setHeroMeta(data.heroMeta);

      setError("");
      setLoading(false);
    });
  }

  /* ==========================================================
     RETURN
     ========================================================== */

  return {
    featuredGame,
    heroImages,
    heroMeta,
    loading,
    error,
    retry,
  };
}
