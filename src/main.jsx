import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./styles/global.css";
import "./styles/explore.css";
import "./styles/footer.css";
import "./styles/wishlist.css";
import "./styles/library.css";
import "./index.css";

import App from "./App";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
