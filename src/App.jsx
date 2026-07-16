import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

import HomePage from "./pages/HomePage";
import GameDetailsPage from "./pages/GameDetailsPage";
import WishlistPage from "./pages/WishlistPage";
import LibraryPage from "./pages/LibraryPage";
import TopRatedPage from "./pages/TopRatedPage";
import NewReleasesPage from "./pages/NewReleasesPage";
import TrendingPage from "./pages/TrendingPage";

import RandomOverlay from "./components/Common/RandomOverlay";
import { useRandomGameContext } from "./context/RandomGameContext";
import ToastContainer from "./components/Common/ToastContainer";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }, [pathname]);

  return null;
}

function App() {
  const { showRandomOverlay, randomStatus } = useRandomGameContext();

  return (
    <>
      <ScrollToTop />

      <Routes>
        <Route
          path="/"
          element={
            <HomePage key={window.location.search + window.location.pathname} />
          }
        />

        <Route path="/trending" element={<TrendingPage />} />

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
      <ToastContainer />
    </>
  );
}

export default App;
