import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import gamesRouter from "./routes/games.js";
import usersRouter from "./routes/users.js";
import fortunaRouter from "./routes/fortunaRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

const configuredOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
];

const allowedOrigins = new Set(
  (configuredOrigins.length ? configuredOrigins : defaultOrigins).map(
    (origin) => origin.toLowerCase(),
  ),
);

// ================================
// Security Headers (Helmet)
// ================================

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "https:"],
        frameSrc: [
          "'self'",
          "https://www.youtube.com",
          "https://www.youtube-nocookie.com",
        ],
        formAction: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
  }),
);

// ================================
// CORS
// ================================

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = origin.trim().replace(/\/+$/, "").toLowerCase();

      if (allowedOrigins.has(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      if (process.env.VERCEL || process.env.VERCEL_URL) {
        if (
          normalizedOrigin.endsWith(".vercel.app") ||
          (process.env.VERCEL_URL &&
            normalizedOrigin.includes(process.env.VERCEL_URL.toLowerCase()))
        ) {
          callback(null, true);
          return;
        }
      }

      callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  }),
);

app.use(express.json({ limit: "2mb" }));

// ================================
// MongoDB Connection Middleware for Vercel Serverless
// ================================

app.use(async (req, res, next) => {
  if (process.env.MONGODB_URI && mongoose.connection.readyState === 0) {
    try {
      await connectDB(1, 1000);
    } catch (err) {
      console.error("MongoDB connection middleware warning:", err.message);
    }
  }
  next();
});

// ================================
// Routes
// ================================

app.use("/api/games", gamesRouter);
app.use("/api/users", usersRouter);
app.use("/api/fortuna", fortunaRouter);

// ================================
// Health Check
// ================================

app.get(["/", "/api"], (req, res) => {
  res.json({
    name: "FRACTURE Backend",
    status: "online",
  });
});

// ================================
// MongoDB Connection
// ================================

async function connectDB(retries = 5, delay = 3000) {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI is not defined.");
    return;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("MongoDB connected successfully.");
      return;
    } catch (error) {
      console.error(
        `MongoDB connection attempt ${attempt}/${retries} failed:`,
        error.message,
      );

      if (attempt === retries) {
        console.error("All MongoDB connection attempts failed.");
        if (!process.env.VERCEL) {
          process.exit(1);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}

export { app };

if (!process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`FRACTURE backend running on port ${PORT}`);
    });
  });
} else {
  connectDB();
}
