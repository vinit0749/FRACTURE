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

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

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
        connectSrc: ["'self'"],
        frameSrc: ["'self'"],
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
    origin: allowedOrigins,
  }),
);

app.use(express.json({ limit: "100kb" }));

// ================================
// Routes
// ================================

app.use("/api/games", gamesRouter);
app.use("/api/users", usersRouter);
app.use("/api/fortuna", fortunaRouter);

// ================================
// Health Check
// ================================

app.get("/", (req, res) => {
  res.json({
    name: "FRACTURE Backend",
    status: "online",
  });
});

// ================================
// MongoDB Connection
// ================================

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully.");

    app.listen(PORT, () => {
      console.log(`FRACTURE backend running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  });
