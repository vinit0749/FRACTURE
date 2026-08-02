import mongoose from "mongoose";

// ==============================================
// FORTUNA CONVERSATION MODEL
// ==============================================
//
// Stores one complete FORTUNA discovery conversation.
//
// A conversation contains:
// - User / FORTUNA messages
// - Discovery result blocks
// - Accumulated discovery intent
//
// Discovery blocks are stored directly inside the
// timeline so an old conversation can be restored
// exactly as it appeared in the FORTUNA UI.
// ==============================================

// ==============================================
// TIMELINE SCHEMAS
// ==============================================

// ----------------------------------------------
// Chat message
// ----------------------------------------------

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "model"],
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
  },
  {
    _id: false,
  },
);

// ----------------------------------------------
// Discovery recommendation
// ----------------------------------------------

const recommendationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    reason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
  },
  {
    _id: false,
  },
);

// ----------------------------------------------
// Discovery game
// ----------------------------------------------
//
// We intentionally keep this flexible because
// RAWG game objects can contain many fields and
// FORTUNA currently passes the RAWG game object
// directly to GameCard.
// ----------------------------------------------

const discoveryGameSchema = new mongoose.Schema(
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
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    parent_platforms: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    platforms: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    fortunaReason: {
      type: String,
      default: "",
      maxlength: 2000,
    },
  },
  {
    _id: false,
    strict: false,
  },
);

// ----------------------------------------------
// Discovery block
// ----------------------------------------------

const discoverySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["discovery"],
      required: true,
    },

    id: {
      type: String,
      required: true,
    },

    recommendations: {
      type: [recommendationSchema],
      default: [],
    },

    games: {
      type: [discoveryGameSchema],
      default: [],
    },

    intent: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    _id: false,
    strict: false,
  },
);

// ==============================================
// TIMELINE ITEM
// ==============================================
//
// A timeline item is either:
//
// 1. A normal chat message
// 2. A discovery result block
// ==============================================

const timelineItemSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "model"],
    },

    content: {
      type: String,
      trim: true,
      maxlength: 10000,
    },

    type: {
      type: String,
      enum: ["discovery"],
    },

    id: {
      type: String,
    },

    recommendations: {
      type: [recommendationSchema],
      default: undefined,
    },

    games: {
      type: [discoveryGameSchema],
      default: undefined,
    },

    intent: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    _id: false,
    strict: false,
  },
);

// ==============================================
// FORTUNA CONVERSATION
// ==============================================

const fortunaConversationSchema = new mongoose.Schema(
  {
    // ==========================================
    // OWNER
    // ==========================================

    firebaseUid: {
      type: String,
      required: true,
      index: true,
    },

    // ==========================================
    // CONVERSATION TITLE
    // ==========================================
    //
    // Generated from the first meaningful user
    // message or assigned by the frontend later.
    // ==========================================

    title: {
      type: String,
      default: "New Discovery",
      trim: true,
      maxlength: 200,
    },

    // ==========================================
    // CONVERSATION TIMELINE
    // ==========================================

    timeline: {
      type: [timelineItemSchema],
      default: [],
    },

    // ==========================================
    // ACCUMULATED DISCOVERY INTENT
    // ==========================================

    intent: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

// ==============================================
// INDEXES
// ==============================================
//
// History listing is normally ordered by the
// most recently updated conversation.
//
// Each user only accesses their own conversations.
// ==============================================

fortunaConversationSchema.index({
  firebaseUid: 1,
  updatedAt: -1,
});

const FortunaConversation = mongoose.model(
  "FortunaConversation",
  fortunaConversationSchema,
);

export default FortunaConversation;
