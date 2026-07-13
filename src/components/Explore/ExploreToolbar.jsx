import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";

function ExploreToolbar({ genres = [], platforms = [] }) {
  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  return (
    <div className="explore-toolbar">
      <div className="explore-search">
        <input
          id="filter-search-input"
          type="text"
          placeholder="Search games..."
        />

        <button
          id="filter-search-button"
          className="search-button"
          aria-label="Search"
        >
          <Search size={20} />
        </button>
      </div>

      <div className="explore-controls">
        {/* SORT */}
        <div
          className={`custom-dropdown ${
            activeDropdown === "sort" ? "active" : ""
          }`}
        >
          <button
            className="dropdown-btn"
            onClick={() => toggleDropdown("sort")}
          >
            <span id="sort-label">Popular</span>
            <ChevronDown size={18} />
          </button>

          <div className="dropdown-menu">
            <div className="dropdown-option" data-value="-added">
              Popular
            </div>

            <div className="dropdown-option" data-value="-rating">
              Top Rated
            </div>

            <div className="dropdown-option" data-value="-released">
              Newest
            </div>

            <div className="dropdown-option" data-value="name">
              Name (A-Z)
            </div>
          </div>
        </div>

        {/* GENRES */}
        <div
          className={`custom-dropdown ${
            activeDropdown === "genre" ? "active" : ""
          }`}
        >
          <button
            className="dropdown-btn"
            onClick={() => toggleDropdown("genre")}
          >
            <span id="genre-label">All Genres</span>
            <ChevronDown size={18} />
          </button>

          <div className="dropdown-menu">
            {genres.map((genre) => (
              <div
                key={genre.id}
                className="dropdown-option"
                data-value={genre.slug}
              >
                {genre.name}
              </div>
            ))}
          </div>
        </div>

        {/* PLATFORMS */}
        <div
          className={`custom-dropdown ${
            activeDropdown === "platform" ? "active" : ""
          }`}
        >
          <button
            className="dropdown-btn"
            onClick={() => toggleDropdown("platform")}
          >
            <span id="platform-label">All Platforms</span>
            <ChevronDown size={18} />
          </button>

          <div className="dropdown-menu">
            {platforms.map((platform) => (
              <div
                key={platform.id}
                className="dropdown-option"
                data-value={platform.id}
              >
                {platform.name}
              </div>
            ))}
          </div>
        </div>

        <button id="reset-filters" className="reset-btn">
          Reset
        </button>
      </div>
    </div>
  );
}

export default ExploreToolbar;
