const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// ================================
// Get user data
// ================================

export async function checkUsernameAvailability(username) {
  const response = await fetch(
    `${API_BASE_URL}/users/check-username/${encodeURIComponent(username)}`,
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
  const response = await fetch(`${API_BASE_URL}/users/${firebaseUid}`);

  if (!response.ok) {
    throw new Error("Failed to fetch user data.");
  }

  return response.json();
}

// ================================
// Update wishlist
// ================================

export async function updateUserWishlist(firebaseUid, wishlist) {
  const response = await fetch(
    `${API_BASE_URL}/users/${firebaseUid}/wishlist`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

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
  const response = await fetch(`${API_BASE_URL}/users/${firebaseUid}/library`, {
    method: "PUT",

    headers: {
      "Content-Type": "application/json",
    },

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

  const response = await fetch(`${API_BASE_URL}/users/${firebaseUid}/profile`, {
    method: "PUT",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(errorData.message || "Failed to update user profile.");
  }

  return response.json();
}
