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
   LIBRARY
================================ */

export function getLibrary() {
  return JSON.parse(localStorage.getItem(LIBRARY_KEY)) || [];
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

  library.push(game);
  saveLibrary(library);

  return true;
}
