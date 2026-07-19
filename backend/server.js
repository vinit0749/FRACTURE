import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import gamesRouter from "./routes/games.js";

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
app.use("/api/games", gamesRouter);

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
// Start Server
// ================================

app.listen(PORT, () => {
  console.log(`FRACTURE backend running on port ${PORT}`);
});
