import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import gamesRouter from "./routes/games.js";
import usersRouter from "./routes/users.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// ================================
// Middleware
// ================================

app.use(
  cors({
    origin: allowedOrigins,
  }),
);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

app.use(express.json());

// ================================
// Routes
// ================================

app.use("/api/games", gamesRouter);
app.use("/api/users", usersRouter);

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
