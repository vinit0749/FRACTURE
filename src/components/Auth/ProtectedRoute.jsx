import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import { Lock } from "lucide-react";

import "../../styles/protected.css";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Wait until Firebase finishes checking auth state
  if (loading) {
    return null;
  }

  // Show protected access message instead of redirecting
  if (!user) {
    return (
      <main className="protected-page">
        <div className="protected-page-content">
          <div className="protected-page-icon">
            <Lock size={40} />
          </div>

          <h1>Sign In Required</h1>

          <p>Please sign in to access your wishlist and game collection.</p>

          <Link to="/" className="hero-btn">
            Back to Explore
          </Link>
        </div>
      </main>
    );
  }

  return children;
}

export default ProtectedRoute;
