import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import gamesRouter from "./routes/games.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// ================================
// Middleware
// ================================

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

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
