import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getUserData,
  updateUserWishlist,
  updateUserLibrary,
} from "../api/users";

function useUserData() {
  const { user } = useAuth();

  const [wishlist, setWishlist] = useState([]);
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);

  // ================================
  // Load user data from MongoDB
  // ================================

  const loadUserData = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      setLibrary([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data = await getUserData(user.uid);

      setWishlist(data.wishlist || []);
      setLibrary(data.library || []);
    } catch (error) {
      console.error("Failed to load user data:", error);

      setWishlist([]);
      setLibrary([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // ================================
  // Save wishlist to MongoDB
  // ================================

  const saveWishlist = async (updatedWishlist) => {
    if (!user) return;

    try {
      setWishlist(updatedWishlist);

      await updateUserWishlist(user.uid, updatedWishlist);
    } catch (error) {
      console.error("Failed to save wishlist:", error);
    }
  };

  // ================================
  // Save library to MongoDB
  // ================================

  const saveLibrary = async (updatedLibrary) => {
    if (!user) return;

    try {
      setLibrary(updatedLibrary);

      await updateUserLibrary(user.uid, updatedLibrary);
    } catch (error) {
      console.error("Failed to save library:", error);
    }
  };

  return {
    wishlist,
    library,
    loading,
    saveWishlist,
    saveLibrary,
    reloadUserData: loadUserData,
  };
}

export default useUserData;
