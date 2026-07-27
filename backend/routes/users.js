import express from "express";
import User from "../models/User.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// ================================
// Get or create user
// ================================

router.post("/sync", async (req, res) => {
  try {
    const { firebaseUid, email, displayName, photoURL, username } = req.body;

    if (!firebaseUid || !email) {
      return res.status(400).json({
        message: "firebaseUid and email are required.",
      });
    }

    let user = await User.findOne({ firebaseUid });

    if (!user) {
      user = await User.create({
        firebaseUid,
        email,
        displayName: displayName || "",
        photoURL: photoURL || "",
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
  upload.single("photo"),
  async (req, res) => {
    try {
      const { firebaseUid } = req.params;
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

      if (removePhoto === "true") {
        user.photoURL = "";
        user.useProviderPhoto = false;
      } else if (req.file) {
        user.photoURL = req.file.path;
        user.useProviderPhoto = false;
      }

      await user.save();

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

router.get("/check-username", async (req, res) => {
  try {
    const { username, uid } = req.query;

    if (!username || !/^[a-z0-9_]+$/.test(username.toLowerCase())) {
      return res.status(400).json({
        available: false,
        message: "Invalid username format.",
      });
    }

    const normalizedUsername = username.toLowerCase().trim();

    const existingUser = await User.findOne({
      username: normalizedUsername,
      ...(uid ? { firebaseUid: { $ne: uid } } : {}),
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
});

// ================================
// Get user data
// ================================

router.get("/:firebaseUid", async (req, res) => {
  try {
    const { firebaseUid } = req.params;

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

router.put("/:firebaseUid/wishlist", async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { wishlist } = req.body;

    if (!Array.isArray(wishlist)) {
      return res.status(400).json({
        message: "Wishlist must be an array.",
      });
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
});

// ================================
// Update library
// ================================

router.put("/:firebaseUid/library", async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { library } = req.body;

    if (!Array.isArray(library)) {
      return res.status(400).json({
        message: "Library must be an array.",
      });
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
});

export default router;
