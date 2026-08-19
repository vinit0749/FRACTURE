const rawApiUrl = (
  import.meta.env.VITE_API_BASE_URL !== undefined &&
  import.meta.env.VITE_API_BASE_URL !== ""
    ? import.meta.env.VITE_API_BASE_URL
    : import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "/api"
)
  .trim()
  .replace(/\/+$/, "");

const API_BASE_URL =
  !rawApiUrl || rawApiUrl === "/api"
    ? "/api"
    : rawApiUrl.endsWith("/api")
    ? rawApiUrl
    : `${rawApiUrl}/api`;

import { getAuth } from "firebase/auth";

import app from "../firebase/config";

const auth = getAuth(app);

async function getAuthHeaders() {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    return { "Content-Type": "application/json" };
  }

  const idToken = await currentUser.getIdToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`,
  };
}

async function getAuthHeadersForFormData() {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    return {};
  }

  const idToken = await currentUser.getIdToken();

  return { Authorization: `Bearer ${idToken}` };
}

// ================================
// Check username availability
// ================================

export async function checkUsernameAvailability(username) {
  const params = new URLSearchParams({ username });

  const headers = await getAuthHeaders();

  const response = await fetch(
    `${API_BASE_URL}/users/check-username?${params.toString()}`,
    { headers },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(errorData.message || "Failed to check username availability.");
  }

  return response.json();
}

// ================================
// Get user data
// ================================

export async function getUserData(firebaseUid) {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/users/${firebaseUid}`, { headers });

  if (!response.ok) {
    throw new Error("Failed to fetch user data.");
  }

  return response.json();
}

// ================================
// Update wishlist
// ================================

export async function updateUserWishlist(firebaseUid, wishlist) {
  const headers = await getAuthHeaders();

  const response = await fetch(
    `${API_BASE_URL}/users/${firebaseUid}/wishlist`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({
        wishlist,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to update wishlist.");
  }

  return response.json();
}

// ================================
// Update library
// ================================

export async function updateUserLibrary(firebaseUid, library) {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/users/${firebaseUid}/library`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      library,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to update library.");
  }

  return response.json();
}

// ================================
// Update user profile
// ================================

export async function updateUserProfile(
  firebaseUid,
  displayName,
  photoFile,
  removePhoto,
  username,
) {
  const formData = new FormData();

  formData.append("displayName", displayName);

  if (typeof username === "string") {
    formData.append("username", username);
  }

  if (typeof removePhoto === "boolean") {
    formData.append("removePhoto", String(removePhoto));
  }

  if (photoFile) {
    formData.append("photo", photoFile);
  }

  const headers = await getAuthHeadersForFormData();

  const response = await fetch(`${API_BASE_URL}/users/${firebaseUid}/profile`, {
    method: "PUT",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(errorData.message || "Failed to update user profile.");
  }

  return response.json();
}