import { Search, Heart, Bookmark } from "lucide-react";

function Header() {
  return (
    <header className="site-header">
      <div className="container header-container">
        <div className="logo">
          <a href="#" className="logo-link">
            <h1>FRACTURE</h1>
          </a>

          <p>Discover your next favorite game.</p>
        </div>

        <div className="header-actions">
          <nav className="nav-links">
            <a href="#" className="nav-link active">
              Explore
            </a>

            <a href="#" className="nav-link">
              Top Rated
            </a>

            <a href="#" className="nav-link">
              New Releases
            </a>
          </nav>

          <div className="search-section">
            <input
              type="text"
              id="search-input"
              placeholder="Search games or genres..."
            />

            <button className="search-button" aria-label="Search">
              <Search size={20} />
            </button>
          </div>

          <div className="header-icons">
            <button
              className="header-icon wishlist-header-icon"
              title="Wishlist"
            >
              <Heart size={20} />
            </button>

            <button className="header-icon library-header-icon" title="Library">
              <Bookmark size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
