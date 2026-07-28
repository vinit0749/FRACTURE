import express from "express";
import User from "../models/User.js";
import upload from "../middleware/upload.js";
import authenticateToken from "../middleware/auth.js";
import cloudinary from "../config/cloudinary.js";
import {
  usernameCheckLimiter,
  userWriteLimiter,
  profileUpdateLimiter,
  profileUploadLimiter,
} from "../middleware/rateLimit.js";

const router = express.Router();

const MAX_COLLECTION_SIZE = 500;
const MAX_GAME_NAME_LENGTH = 200;

// ================================
// Cloudinary Helpers
// ================================

async function deleteCloudinaryProfilePhoto(publicId) {
  if (!publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted old Cloudinary profile picture: ${publicId}`);
  } catch (error) {
    console.error(
      `Failed to delete Cloudinary profile picture: ${publicId}`,
      error,
    );
  }
}

// ================================
// Get or create user
// ================================

router.post("/sync", authenticateToken, userWriteLimiter, async (req, res) => {
  try {
    const { displayName, photoURL, username } = req.body;
    const firebaseUid = req.user.uid;
    const email = req.user.email;

    if (!firebaseUid || !email) {
      return res.status(400).json({
        message: "Invalid authentication data.",
      });
    }

    let user = await User.findOne({ firebaseUid });

    if (!user) {
      user = await User.create({
        firebaseUid,
        email,
        displayName: displayName || "",
        photoURL: photoURL || "",
        photoPublicId: "",
        username: username ? username.toLowerCase().trim() : "",
        wishlist: [],
        library: [],
      });
    } else {
      user.email = email;
      user.displayName = displayName || "";

      if (username && !user.username) {
        user.username = username.toLowerCase().trim();
      }

      if (user.useProviderPhoto && !user.photoURL) {
        user.photoURL = photoURL || "";
      }

      await user.save();
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("User sync error:", error);

    return res.status(500).json({
      message: "Failed to sync user.",
    });
  }
});

// ================================
// Update user profile
// ================================

router.put(
  "/:firebaseUid/profile",
  authenticateToken,
  profileUpdateLimiter,
  profileUploadLimiter,
  upload.single("photo"),
  async (req, res) => {
    try {
      const { firebaseUid } = req.params;

      if (req.user.uid !== firebaseUid) {
        return res.status(403).json({
          message: "Forbidden. You can only update your own profile.",
        });
      }

      const { displayName, username, removePhoto } = req.body;

      const user = await User.findOne({ firebaseUid });

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      if (typeof displayName === "string") {
        user.displayName = displayName.trim();
      }

      if (typeof username === "string") {
        const trimmedUsername = username.toLowerCase().trim();

        if (trimmedUsername && !/^[a-z0-9_]+$/.test(trimmedUsername)) {
          return res.status(400).json({
            message:
              "Username can only contain lowercase letters, numbers, and underscores.",
          });
        }

        if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
          return res.status(400).json({
            message: "Username must be between 3 and 30 characters.",
          });
        }

        if (trimmedUsername !== user.username) {
          const existingUser = await User.findOne({
            username: trimmedUsername,
            firebaseUid: { $ne: firebaseUid },
          });

          if (existingUser) {
            return res.status(409).json({
              message: "This username is already taken.",
            });
          }

          user.username = trimmedUsername;
        }
      }

      // ==================================
      // Remove custom Cloudinary photo
      // ==================================

      if (removePhoto === "true") {
        const oldPhotoPublicId = user.photoPublicId;

        user.photoURL = "";
        user.photoPublicId = "";
        user.useProviderPhoto = false;

        await user.save();

        await deleteCloudinaryProfilePhoto(oldPhotoPublicId);
      }

      // ==================================
      // Replace with new Cloudinary photo
      // ==================================
      else if (req.file) {
        const oldPhotoPublicId = user.photoPublicId;
        const newPhotoURL = req.file.path;
        const newPhotoPublicId = req.file.filename;

        user.photoURL = newPhotoURL;
        user.photoPublicId = newPhotoPublicId;
        user.useProviderPhoto = false;

        await user.save();

        // Delete the old image only after the new image
        // has been successfully saved to MongoDB.
        if (oldPhotoPublicId && oldPhotoPublicId !== newPhotoPublicId) {
          await deleteCloudinaryProfilePhoto(oldPhotoPublicId);
        }
      } else {
        await user.save();
      }

      return res.status(200).json({
        message: "Profile updated successfully.",
        user: {
          firebaseUid: user.firebaseUid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          username: user.username,
        },
      });
    } catch (error) {
      console.error("Profile update error:", error);

      return res.status(500).json({
        message: "Failed to update profile.",
      });
    }
  },
);

// ================================
// Check username availability
// ================================

router.get(
  "/check-username",
  authenticateToken,
  usernameCheckLimiter,
  async (req, res) => {
    try {
      const { username } = req.query;
      const uid = req.user.uid;

      if (!username || !/^[a-z0-9_]+$/.test(username.toLowerCase())) {
        return res.status(400).json({
          available: false,
          message: "Invalid username format.",
        });
      }

      const normalizedUsername = username.toLowerCase().trim();

      const existingUser = await User.findOne({
        username: normalizedUsername,
        firebaseUid: { $ne: uid },
      });

      return res.status(200).json({
        available: !existingUser,
        message: existingUser
          ? "This username is already taken."
          : "Username is available.",
      });
    } catch (error) {
      console.error("Username check error:", error);

      return res.status(500).json({
        available: false,
        message: "Failed to check username availability.",
      });
    }
  },
);

// ================================
// Get user data
// ================================

router.get("/:firebaseUid", authenticateToken, async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    if (req.user.uid !== firebaseUid) {
      return res.status(403).json({
        message: "Forbidden. You can only access your own data.",
      });
    }

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      wishlist: user.wishlist,
      library: user.library,
    });
  } catch (error) {
    console.error("Get user data error:", error);

    return res.status(500).json({
      message: "Failed to get user data.",
    });
  }
});

// ================================
// Update wishlist
// ================================

router.put(
  "/:firebaseUid/wishlist",
  authenticateToken,
  userWriteLimiter,
  async (req, res) => {
    try {
      const { firebaseUid } = req.params;

      if (req.user.uid !== firebaseUid) {
        return res.status(403).json({
          message: "Forbidden. You can only update your own wishlist.",
        });
      }

      const { wishlist } = req.body;

      if (!Array.isArray(wishlist)) {
        return res.status(400).json({
          message: "Wishlist must be an array.",
        });
      }

      if (wishlist.length > MAX_COLLECTION_SIZE) {
        return res.status(400).json({
          message: `Wishlist cannot contain more than ${MAX_COLLECTION_SIZE} games.`,
        });
      }

      for (const game of wishlist) {
        if (
          !game ||
          typeof game !== "object" ||
          !Number.isInteger(game.id) ||
          typeof game.name !== "string" ||
          game.name.length > MAX_GAME_NAME_LENGTH
        ) {
          return res.status(400).json({
            message: "Invalid game data in wishlist.",
          });
        }
      }

      const user = await User.findOneAndUpdate(
        { firebaseUid },
        {
          $set: {
            wishlist,
          },
        },
        {
          returnDocument: "after",
          runValidators: true,
        },
      );

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      return res.status(200).json({
        wishlist: user.wishlist,
      });
    } catch (error) {
      console.error("Update wishlist error:", error);

      return res.status(500).json({
        message: "Failed to update wishlist.",
      });
    }
  },
);

// ================================
// Update library
// ================================

router.put(
  "/:firebaseUid/library",
  authenticateToken,
  userWriteLimiter,
  async (req, res) => {
    try {
      const { firebaseUid } = req.params;

      if (req.user.uid !== firebaseUid) {
        return res.status(403).json({
          message: "Forbidden. You can only update your own library.",
        });
      }

      const { library } = req.body;

      if (!Array.isArray(library)) {
        return res.status(400).json({
          message: "Library must be an array.",
        });
      }

      if (library.length > MAX_COLLECTION_SIZE) {
        return res.status(400).json({
          message: `Library cannot contain more than ${MAX_COLLECTION_SIZE} games.`,
        });
      }

      for (const game of library) {
        if (
          !game ||
          typeof game !== "object" ||
          !Number.isInteger(game.id) ||
          typeof game.name !== "string" ||
          game.name.length > MAX_GAME_NAME_LENGTH
        ) {
          return res.status(400).json({
            message: "Invalid game data in library.",
          });
        }
      }

      const user = await User.findOneAndUpdate(
        { firebaseUid },
        {
          $set: {
            library,
          },
        },
        {
          returnDocument: "after",
          runValidators: true,
        },
      );

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      return res.status(200).json({
        library: user.library,
      });
    } catch (error) {
      console.error("Update library error:", error);

      return res.status(500).json({
        message: "Failed to update library.",
      });
    }
  },
);

export default router;
