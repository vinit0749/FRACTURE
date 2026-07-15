const WISHLIST_KEY = "wishlist";
const LIBRARY_KEY = "library";

/* ===============================
   WISHLIST
================================ */

export function getWishlist() {
  return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
}

export function saveWishlist(games) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(games));
}

export function isWishlisted(id) {
  return getWishlist().some((game) => game.id === id);
}

export function toggleWishlist(game) {
  const wishlist = getWishlist();

  const exists = wishlist.some((item) => item.id === game.id);

  if (exists) {
    const updated = wishlist.filter((item) => item.id !== game.id);

    saveWishlist(updated);

    return false;
  }

  wishlist.push(game);

  saveWishlist(wishlist);

  return true;
}

/* ===============================
   LIBRARY / COLLECTION
================================ */

const DEFAULT_STATUS = "backlog";

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

export function saveLibrary(games) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(games));
}

export function isInLibrary(id) {
  return getLibrary().some((game) => game.id === id);
}

export function toggleLibrary(game) {
  const library = getLibrary();

  const exists = library.some((item) => item.id === game.id);

  if (exists) {
    const updated = library.filter((item) => item.id !== game.id);

    saveLibrary(updated);

    return false;
  }

  library.push({
    ...game,

    addedAt: Date.now(),

    status: DEFAULT_STATUS,
  });

  saveLibrary(library);

  return true;
}

/* ===============================
   UPDATE COLLECTION STATUS
================================ */

export function updateLibraryStatus(id, status) {
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

  saveLibrary(updatedLibrary);

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
