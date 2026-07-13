import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import GameDetailsPage from "./pages/GameDetailsPage";
import WishlistPage from "./pages/WishlistPage";
import LibraryPage from "./pages/LibraryPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/game/:id" element={<GameDetailsPage />} />

      <Route path="/wishlist" element={<WishlistPage />} />

      <Route path="/library" element={<LibraryPage />} />
    </Routes>
  );
}

export default App;
