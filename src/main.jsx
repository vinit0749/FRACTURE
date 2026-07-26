import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { RandomGameProvider } from "./context/RandomGameContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";

import "./styles/global.css";
import "./styles/header.css";
import "./styles/home-skeleton.css";
import "./styles/cards.css";
import "./styles/skeleton.css";
import "./styles/card-skeleton.css";
import "./styles/footer.css";

import "./styles/hero.css";
import "./styles/explore.css";
import "./styles/random-overlay.css";
import "./styles/toast.css";
import "./styles/autocomplete.css";
import "./styles/game.css";

import "./styles/gamepage-skeleton.css";

import "./styles/carousel.css";
import "./styles/wishlist.css";
import "./styles/library.css";
import "./styles/protected.css";
import "./styles/settings.css";
import "./styles/profile.css";
import "./styles/auth.css";
import "./styles/signout.css";
import "./styles/edit-profile.css";

import "./index.css";

import App from "./App";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
      <ToastProvider>
        <RandomGameProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </RandomGameProvider>
      </ToastProvider>
    </ThemeProvider>
  </BrowserRouter>,
);
