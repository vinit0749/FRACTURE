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
    },

    background_image: {
      type: String,
      default: "",
    },

    rating: {
      type: Number,
      default: 0,
    },

    metacritic: {
      type: Number,
      default: null,
    },

    released: {
      type: String,
      default: "",
    },

    genres: {
      type: Array,
      default: [],
    },

    parent_platforms: {
      type: Array,
      default: [],
    },

    platforms: {
      type: Array,
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
    },

    displayName: {
      type: String,
      default: "",
      trim: true,
    },

    photoURL: {
      type: String,
      default: "",
    },

    useProviderPhoto: {
      type: Boolean,
      default: true,
    },

    wishlist: {
      type: [gameSchema],
      default: [],
    },

    library: {
      type: [gameSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
