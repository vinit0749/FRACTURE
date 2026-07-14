import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import GameDetailsPage from "./pages/GameDetailsPage";
import WishlistPage from "./pages/WishlistPage";
import LibraryPage from "./pages/LibraryPage";
import TopRatedPage from "./pages/TopRatedPage";
import NewReleasesPage from "./pages/NewReleasesPage";

import RandomOverlay from "./components/Common/RandomOverlay";
import { useRandomGameContext } from "./context/RandomGameContext";

function App() {
  const { showRandomOverlay, randomStatus } = useRandomGameContext();

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage key={window.location.search + window.location.pathname} />
          }
        />

        <Route path="/top-rated" element={<TopRatedPage />} />

        <Route path="/new-releases" element={<NewReleasesPage />} />

        <Route
          path="/game/:id"
          element={<GameDetailsPage key={window.location.pathname} />}
        />

        <Route path="/wishlist" element={<WishlistPage />} />

        <Route path="/library" element={<LibraryPage />} />
      </Routes>

      <RandomOverlay visible={showRandomOverlay} status={randomStatus} />
    </>
  );
}

export default App;
