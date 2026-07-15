import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { RandomGameProvider } from "./context/RandomGameContext";
import { ToastProvider } from "./context/ToastContext";

import "./styles/global.css";
import "./styles/random-overlay.css";
import "./styles/toast.css";
import "./styles/autocomplete.css";
import "./styles/game.css";
import "./styles/explore.css";
import "./styles/wishlist.css";
import "./styles/library.css";
import "./index.css";

import App from "./App";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ToastProvider>
      <RandomGameProvider>
        <App />
      </RandomGameProvider>
    </ToastProvider>
  </BrowserRouter>,
);
