import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    background_image: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },

    metacritic: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    released: {
      type: String,
      default: "",
      maxlength: 50,
    },

    genres: {
      type: [
        {
          id: Number,
          name: {
            type: String,
            maxlength: 100,
          },
          slug: {
            type: String,
            maxlength: 100,
          },
        },
      ],
      default: [],
    },

    parent_platforms: {
      type: [
        {
          platform: {
            id: Number,
            name: {
              type: String,
              maxlength: 100,
            },
            slug: {
              type: String,
              maxlength: 100,
            },
          },
        },
      ],
      default: [],
    },

    platforms: {
      type: [
        {
          platform: {
            id: Number,
            name: {
              type: String,
              maxlength: 100,
            },
            slug: {
              type: String,
              maxlength: 100,
            },
          },
        },
      ],
      default: [],
    },

    addedAt: {
      type: Number,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["backlog", "playing", "completed"],
      default: "backlog",
    },
  },
  {
    _id: false,
  },
);

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 320,
    },

    displayName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    photoURL: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    // Cloudinary public_id for custom profile pictures.
    // Empty when the user is using a provider photo.
    photoPublicId: {
      type: String,
      default: "",
      maxlength: 500,
    },

    username: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
      minlength: 3,
      maxlength: 30,
      match: [
        /^[a-z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ],
    },

    useProviderPhoto: {
      type: Boolean,
      default: true,
    },

    wishlist: {
      type: [gameSchema],
      default: [],
      validate: {
        validator: (games) => games.length <= 500,
        message: "Wishlist cannot contain more than 500 games.",
      },
    },

    library: {
      type: [gameSchema],
      default: [],
      validate: {
        validator: (games) => games.length <= 500,
        message: "Library cannot contain more than 500 games.",
      },
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
