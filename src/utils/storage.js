import { saveCloudWishlist, saveCloudLibrary } from "./cloudStorage";

/* ===============================
   STORAGE KEYS
================================ */

const WISHLIST_KEY = "wishlist";
const LIBRARY_KEY = "library";

const DEFAULT_STATUS = "backlog";

/* ===============================
   WISHLIST
================================ */

export function getWishlist() {
  return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
}

export async function saveWishlist(games, user = null) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(games));

  if (user?.uid) {
    try {
      await saveCloudWishlist(user.uid, games);
    } catch (error) {
      console.error("Failed to sync wishlist with MongoDB:", error);
    }
  }
}

export function isWishlisted(id) {
  return getWishlist().some((game) => game.id === id);
}

export async function toggleWishlist(game, user = null) {
  const wishlist = getWishlist();

  const exists = wishlist.some((item) => item.id === game.id);

  let updatedWishlist;

  if (exists) {
    updatedWishlist = wishlist.filter((item) => item.id !== game.id);
  } else {
    updatedWishlist = [...wishlist, game];
  }

  await saveWishlist(updatedWishlist, user);

  return !exists;
}

/* ===============================
   LIBRARY / COLLECTION
================================ */

function normalizeStatus(status) {
  const value = status?.toLowerCase();

  if (value === "playing" || value === "completed" || value === "backlog") {
    return value;
  }

  return DEFAULT_STATUS;
}

function migrateLibraryData(games) {
  return games.map((game) => ({
    ...game,

    addedAt: game.addedAt || Date.now(),

    status: normalizeStatus(game.status),
  }));
}

export function getLibrary() {
  const library = JSON.parse(localStorage.getItem(LIBRARY_KEY)) || [];

  const migratedLibrary = migrateLibraryData(library);

  localStorage.setItem(LIBRARY_KEY, JSON.stringify(migratedLibrary));

  return migratedLibrary;
}

export async function saveLibrary(games, user = null) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(games));

  if (user?.uid) {
    try {
      await saveCloudLibrary(user.uid, games);
    } catch (error) {
      console.error("Failed to sync library with MongoDB:", error);
    }
  }
}

export function isInLibrary(id) {
  return getLibrary().some((game) => game.id === id);
}

export async function toggleLibrary(game, user = null) {
  const library = getLibrary();

  const exists = library.some((item) => item.id === game.id);

  let updatedLibrary;

  if (exists) {
    updatedLibrary = library.filter((item) => item.id !== game.id);
  } else {
    updatedLibrary = [
      ...library,
      {
        ...game,
        addedAt: Date.now(),
        status: DEFAULT_STATUS,
      },
    ];
  }

  await saveLibrary(updatedLibrary, user);

  return !exists;
}

/* ===============================
   UPDATE COLLECTION STATUS
================================ */

export async function updateLibraryStatus(id, status, user = null) {
  const library = getLibrary();

  const updatedLibrary = library.map((game) => {
    if (game.id !== id) {
      return game;
    }

    return {
      ...game,
      status: normalizeStatus(status),
    };
  });

  await saveLibrary(updatedLibrary, user);

  return updatedLibrary;
}

/* ===============================
   STATUS COUNTS
================================ */

export function getLibraryStatusCount() {
  const library = getLibrary();

  return {
    total: library.length,

    playing: library.filter((game) => game.status === "playing").length,

    completed: library.filter((game) => game.status === "completed").length,

    backlog: library.filter((game) => game.status === "backlog").length,
  };
}
