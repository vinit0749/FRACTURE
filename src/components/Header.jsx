import { Search, Heart, Bookmark } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Header({ searchInput, updateSearchInput }) {
  const location = useLocation();
  const navigate = useNavigate();

  function search() {
    const query = searchInput.trim();

    if (!query) return;

    navigate(`/?search=${encodeURIComponent(query)}`);
  }

  return (
    <header className="site-header">
      <div className="container header-container">
        <div className="logo">
          <Link to="/" className="logo-link">
            <h1>FRACTURE</h1>
          </Link>

          <p>Discover your next favorite game.</p>
        </div>

        <div className="header-actions">
          <nav className="nav-links">
            <Link
              to="/"
              className={`nav-link ${
                location.pathname === "/" ? "active" : ""
              }`}
            >
              Explore
            </Link>

            <Link
              to="/top-rated"
              className={`nav-link ${
                location.pathname === "/top-rated" ? "active" : ""
              }`}
            >
              Top Rated
            </Link>

            <Link
              to="/new-releases"
              className={`nav-link ${
                location.pathname === "/new-releases" ? "active" : ""
              }`}
            >
              New Releases
            </Link>
          </nav>

          <div className="search-section">
            <input
              id="search-input"
              type="text"
              placeholder="Search games or genres..."
              value={searchInput}
              onChange={(e) => updateSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  search();
                }
              }}
            />

            <button
              className="search-button"
              aria-label="Search"
              onClick={search}
            >
              <Search size={20} />
            </button>
          </div>

          <div className="header-icons">
            <Link
              to="/wishlist"
              className={`header-icon wishlist-header-icon ${
                location.pathname === "/wishlist" ? "active" : ""
              }`}
            >
              <Heart size={20} />
            </Link>

            <Link
              to="/library"
              className={`header-icon library-header-icon ${
                location.pathname === "/library" ? "active" : ""
              }`}
            >
              <Bookmark size={20} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
