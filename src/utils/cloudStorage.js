import {
  syncUser,
  getUserData,
  updateUserWishlist,
  updateUserLibrary,
  updateUserProfile,
} from "../api/fracture";

/* ===============================
   SYNC USER
================================ */

export async function syncCloudUser(user) {
  if (!user) {
    return null;
  }

  return syncUser({
    firebaseUid: user.uid,
    email: user.email,
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
  });
}

/* ===============================
   GET USER DATA
================================ */

export async function getCloudUserData(firebaseUid) {
  if (!firebaseUid) {
    return {
      wishlist: [],
      library: [],
    };
  }

  return getUserData(firebaseUid);
}

/* ===============================
   UPDATE WISHLIST
================================ */

export async function saveCloudWishlist(firebaseUid, wishlist) {
  if (!firebaseUid) {
    return null;
  }

  return updateUserWishlist(firebaseUid, wishlist);
}

/* ===============================
   UPDATE LIBRARY
================================ */

export async function saveCloudLibrary(firebaseUid, library) {
  if (!firebaseUid) {
    return null;
  }

  return updateUserLibrary(firebaseUid, library);
}

/* ===============================
   UPDATE PROFILE
================================ */

export async function saveCloudUserProfile(
  firebaseUid,
  displayName,
  photoFile,
  removePhoto,
) {
  if (!firebaseUid) {
    return null;
  }

  return updateUserProfile(firebaseUid, displayName, photoFile, removePhoto);
}
