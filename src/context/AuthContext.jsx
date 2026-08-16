import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GithubAuthProvider,
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  unlink,
  updateProfile,
} from "firebase/auth";

import auth from "../firebase/auth";

import {
  syncCloudUser,
  getCloudUserData,
  saveCloudUserProfile,
  deleteCloudUserAccount,
} from "../utils/cloudStorage";

const AuthContext = createContext(null);

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          // ================================
          // SYNC USER WITH MONGODB
          // ================================

          const syncedUser = await syncCloudUser(currentUser);

          if (syncedUser) {
            setUser((prev) => ({
              ...prev,
              displayName: syncedUser.displayName ?? prev.displayName,
              photoURL: syncedUser.photoURL,
              username: syncedUser.username ?? prev.username,
            }));
          }

          console.log("User synced with MongoDB successfully.");

          // ================================
          // LOAD CLOUD DATA
          // ================================

          const cloudData = await getCloudUserData(currentUser.uid);

          // ================================
          // RESTORE WISHLIST
          // ================================

          localStorage.setItem(
            "wishlist",
            JSON.stringify(cloudData.wishlist || []),
          );

          // ================================
          // RESTORE LIBRARY
          // ================================

          localStorage.setItem(
            "library",
            JSON.stringify(cloudData.library || []),
          );

          // ================================
          // REFRESH UI
          // ================================

          window.dispatchEvent(new Event("wishlistUpdated"));

          window.dispatchEvent(new Event("libraryUpdated"));

          console.log("Wishlist and Library loaded from MongoDB successfully.");
        } catch (error) {
          console.error(
            "Failed to sync or load user data from MongoDB:",
            error,
          );
        }
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ================================
  // AUTHENTICATION
  // ================================

  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
  };

  const loginWithGithub = () => {
    return signInWithPopup(auth, githubProvider);
  };

  // ================================
  // UPDATE PROFILE
  // ================================

  const updateUserProfile = async ({
    displayName,
    photoFile,
    removePhoto,
    username,
  }) => {
    if (!auth.currentUser) {
      throw new Error("You must be signed in to update your profile.");
    }

    const currentUser = auth.currentUser;

    const updatedDisplayName =
      displayName?.trim() || currentUser.displayName || "";

    await updateProfile(currentUser, {
      displayName: updatedDisplayName,
    });

    const updatedUser = await saveCloudUserProfile(
      currentUser.uid,
      updatedDisplayName,
      photoFile,
      removePhoto,
      username,
    );

    setUser({
      ...currentUser,
      displayName: updatedDisplayName,
      photoURL: updatedUser?.user?.photoURL ?? "",
      username: updatedUser?.user?.username ?? currentUser.username,
    });

    console.log("Profile updated successfully.");
  };

  // ================================
  // GITHUB LINKING
  // ================================

  const linkGithub = async () => {
    if (!auth.currentUser) {
      throw new Error("You must be signed in to connect GitHub.");
    }

    const result = await linkWithPopup(auth.currentUser, githubProvider);

    const firebaseUser = result.user;

    // Re-sync the updated Firebase user with MongoDB.
    // This preserves FRACTURE-specific profile data such as
    // username and custom Cloudinary profile pictures.
    const syncedUser = await syncCloudUser(firebaseUser);

    setUser((prev) => ({
      ...firebaseUser,
      displayName: syncedUser?.displayName ?? prev?.displayName ?? "",
      photoURL: syncedUser?.photoURL ?? prev?.photoURL ?? "",
      username: syncedUser?.username ?? prev?.username ?? "",
    }));

    return result;
  };

  const unlinkGithub = async () => {
    if (!auth.currentUser) {
      throw new Error("You must be signed in to disconnect GitHub.");
    }

    const firebaseUser = await unlink(auth.currentUser, "github.com");

    // Re-sync after unlinking so the MongoDB profile data
    // remains in React state immediately.
    const syncedUser = await syncCloudUser(firebaseUser);

    setUser((prev) => ({
      ...firebaseUser,
      displayName: syncedUser?.displayName ?? prev?.displayName ?? "",
      photoURL: syncedUser?.photoURL ?? prev?.photoURL ?? "",
      username: syncedUser?.username ?? prev?.username ?? "",
    }));

    return firebaseUser;
  };

  // ================================
  // LOGOUT
  // ================================

  const logout = async () => {
    try {
      // ================================
      // CLEAR LOCAL USER DATA
      // ================================

      localStorage.removeItem("wishlist");

      localStorage.removeItem("library");

      // ================================
      // REFRESH UI
      // ================================

      window.dispatchEvent(new Event("wishlistUpdated"));

      window.dispatchEvent(new Event("libraryUpdated"));

      console.log("Local Wishlist and Library cleared.");

      // ================================
      // SIGN OUT FROM FIREBASE
      // ================================

      await signOut(auth);

      console.log("User signed out successfully.");
    } catch (error) {
      console.error("Logout failed:", error);

      throw error;
    }
  };

  // ================================
  // DELETE ACCOUNT
  // ================================

  const deleteAccount = async ({ password, providerId }) => {
    if (!auth.currentUser) {
      throw new Error("You must be signed in to delete your account.");
    }

    const currentUser = auth.currentUser;

    try {
      // ================================
      // RE-AUTHENTICATE USER
      // ================================

      if (providerId === "password") {
        if (!password) {
          throw new Error("Please enter your password to continue.");
        }

        const credential = EmailAuthProvider.credential(
          currentUser.email,
          password,
        );

        await reauthenticateWithCredential(currentUser, credential);
      } else if (providerId === "google.com") {
        await reauthenticateWithPopup(currentUser, googleProvider);
      } else if (providerId === "github.com") {
        await reauthenticateWithPopup(currentUser, githubProvider);
      } else {
        throw new Error(
          "Unable to determine your sign-in method. Please try again.",
        );
      }

      console.log("User re-authenticated successfully.");

      // ================================
      // DELETE ACCOUNT FROM BACKEND
      // ================================

      await deleteCloudUserAccount();

      // ================================
      // CLEAR LOCAL USER DATA
      // ================================

      localStorage.removeItem("wishlist");

      localStorage.removeItem("library");

      // ================================
      // REFRESH UI
      // ================================

      window.dispatchEvent(new Event("wishlistUpdated"));

      window.dispatchEvent(new Event("libraryUpdated"));

      // ================================
      // SIGN OUT FROM FIREBASE
      // ================================

      await signOut(auth);

      console.log("Account deleted successfully.");
    } catch (error) {
      console.error("Account deletion failed:", error);

      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    signup,
    login,
    loginWithGoogle,
    loginWithGithub,
    linkGithub,
    unlinkGithub,
    updateUserProfile,
    logout,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
