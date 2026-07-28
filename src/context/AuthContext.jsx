import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  GithubAuthProvider,
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
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

    // Update React state with the refreshed Firebase user
    setUser(result.user);

    return result;
  };

  const unlinkGithub = async () => {
    if (!auth.currentUser) {
      throw new Error("You must be signed in to disconnect GitHub.");
    }

    const updatedUser = await unlink(auth.currentUser, "github.com");

    // Update React state with the refreshed Firebase user
    setUser(updatedUser);

    return updatedUser;
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
