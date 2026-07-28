import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import HomePage from "./pages/HomePage";
import GameDetailsPage from "./pages/GameDetailsPage";
import ProfilePage from "./pages/ProfilePage";
import WishlistPage from "./pages/WishlistPage";
import LibraryPage from "./pages/LibraryPage";
import TopRatedPage from "./pages/TopRatedPage";
import NewReleasesPage from "./pages/NewReleasesPage";
import TrendingPage from "./pages/TrendingPage";
import FortunaPage from "./pages/FortunaPage";

import ProtectedRoute from "./components/Auth/ProtectedRoute";
import AuthModal from "./components/Auth/AuthModal";

import RandomOverlay from "./components/Common/RandomOverlay";
import { useRandomGameContext } from "./context/RandomGameContext";
import ToastContainer from "./components/Common/ToastContainer";

import { AuthModalProvider, useAuthModal } from "./context/AuthModalContext";

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

function AppContent() {
  const { showRandomOverlay, randomStatus } = useRandomGameContext();

  const { authModalOpen, authMode, closeAuthModal } = useAuthModal();

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

        <Route path="/fortuna" element={<FortunaPage />} />

        <Route path="/trending" element={<TrendingPage />} />

        <Route path="/top-rated" element={<TopRatedPage />} />

        <Route path="/new-releases" element={<NewReleasesPage />} />

        <Route
          path="/game/:id"
          element={<GameDetailsPage key={window.location.pathname} />}
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <WishlistPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <LibraryPage />
            </ProtectedRoute>
          }
        />
      </Routes>

      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={closeAuthModal}
      />

      <RandomOverlay visible={showRandomOverlay} status={randomStatus} />

      <ToastContainer />
    </>
  );
}

function App() {
  return (
    <AuthModalProvider>
      <AppContent />
    </AuthModalProvider>
  );
}

export default App;
