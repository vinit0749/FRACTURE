import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import useGameAutocomplete from "../../hooks/useGameAutocomplete";

function ExploreToolbar({
  genres = [],
  platforms = [],
  searchInput,
  updateSearchInput,
  performSearch,
  sort,
  setSort,
  genre,
  setGenre,
  platform,
  setPlatform,
  page,
  setPage,
  resetFilters,
  section,
}) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const toolbarRef = useRef(null);

  useGameAutocomplete(searchInput);

  const visiblePlatforms = platforms
    .filter((p) =>
      [
        "PC (Microsoft Windows)",
        "Mac",
        "Linux",
        "PlayStation 5",
        "PlayStation 4",
        "PlayStation 3",
        "PlayStation 2",
        "PlayStation",
        "PlayStation Vita",
        "PlayStation Portable",
        "Xbox Series X|S",
        "Xbox One",
        "Xbox 360",
        "Xbox",
        "Nintendo Switch 2",
        "Nintendo Switch",
        "Wii U",
        "Wii",
        "Nintendo 3DS",
        "Nintendo DS",
        "Nintendo 64",
        "Game Boy Advance",
        "Game Boy Color",
        "Game Boy",
        "Android",
        "iOS",
      ].includes(p.name),
    )
    .map((p) => ({
      ...p,
      displayName: p.name === "PC (Microsoft Windows)" ? "PC" : p.name,
    }));

  const toggleDropdown = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const handleDropdownKeyDown = (event, dropdown) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setActiveDropdown(null);
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleDropdown(dropdown);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    }

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  /*
   * The first filter is only shown on the normal Explore section.
   *
   * Dedicated pages such as:
   * - Top Rated
   * - Trending
   * - New Releases
   *
   * already define their own collection.
   */
  const showCollectionFilter = section === "popular";

  return (
    <div className="explore-toolbar" ref={toolbarRef}>
      <div className="explore-search">
        <input
          id="filter-search-input"
          type="text"
          placeholder="Search games..."
          value={searchInput}
          onChange={(e) => updateSearchInput(e.target.value, "filter")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              performSearch("filter");
            }
          }}
        />

        <button
          id="filter-search-button"
          className="search-button"
          aria-label="Search"
          onClick={() => performSearch("filter")}
        >
          <Search size={20} />
        </button>
      </div>

      <div className="explore-controls">
        {/* ============================================
            1. COLLECTION FILTER
            ============================================ */}

        {showCollectionFilter && (
          <div
            className={`custom-dropdown ${
              activeDropdown === "collection" ? "active" : ""
            }`}
          >
            <button
              className="dropdown-btn"
              onClick={() => toggleDropdown("collection")}
              aria-haspopup="listbox"
              aria-expanded={activeDropdown === "collection"}
              aria-label="Game collection"
              onKeyDown={(event) => handleDropdownKeyDown(event, "collection")}
            >
              <span id="collection-label">
                {sort === "-added"
                  ? "Popular"
                  : sort === "-rating"
                    ? "Top Rated"
                    : sort === "-released"
                      ? "New Releases"
                      : sort === "trending"
                        ? "Trending"
                        : "All Games"}
              </span>

              <ChevronDown size={18} />
            </button>

            <div className="dropdown-menu">
              <div
                className={`dropdown-option ${
                  sort === "all" ? "selected" : ""
                }`}
                onClick={() => {
                  setSort("all");
                  setPage(1);
                  setActiveDropdown(null);
                }}
              >
                All Games
              </div>

              <div
                className={`dropdown-option ${
                  sort === "-added" ? "selected" : ""
                }`}
                onClick={() => {
                  setSort("-added");
                  setPage(1);
                  setActiveDropdown(null);
                }}
              >
                Popular
              </div>

              <div
                className={`dropdown-option ${
                  sort === "trending" ? "selected" : ""
                }`}
                onClick={() => {
                  setSort("trending");
                  setPage(1);
                  setActiveDropdown(null);
                }}
              >
                Trending
              </div>

              <div
                className={`dropdown-option ${
                  sort === "-released" ? "selected" : ""
                }`}
                onClick={() => {
                  setSort("-released");
                  setPage(1);
                  setActiveDropdown(null);
                }}
              >
                New Releases
              </div>
            </div>
          </div>
        )}

        {/* ============================================
            2. GENRES
            ============================================ */}

        <div
          className={`custom-dropdown ${
            activeDropdown === "genre" ? "active" : ""
          }`}
        >
          <button
            className="dropdown-btn"
            onClick={() => toggleDropdown("genre")}
            aria-haspopup="listbox"
            aria-expanded={activeDropdown === "genre"}
            aria-label="Filter by genre"
            onKeyDown={(event) => handleDropdownKeyDown(event, "genre")}
          >
            <span id="genre-label">
              {genre
                ? genres.find((g) => String(g.id) === String(genre))?.name ||
                  "All Genres"
                : "All Genres"}
            </span>

            <ChevronDown size={18} />
          </button>

          <div className="dropdown-menu">
            <div
              className={`dropdown-option ${genre === "" ? "selected" : ""}`}
              onClick={() => {
                setGenre("");
                setPage(1);
                setActiveDropdown(null);
              }}
            >
              All Genres
            </div>

            {genres.map((g) => (
              <div
                key={g.id}
                className={`dropdown-option ${
                  String(genre) === String(g.id) ? "selected" : ""
                }`}
                onClick={() => {
                  setGenre(String(g.id));
                  setPage(1);
                  setActiveDropdown(null);
                }}
              >
                {g.name}
              </div>
            ))}
          </div>
        </div>

        {/* ============================================
            3. PLATFORMS
            ============================================ */}

        <div
          className={`custom-dropdown ${
            activeDropdown === "platform" ? "active" : ""
          }`}
        >
          <button
            className="dropdown-btn"
            onClick={() => toggleDropdown("platform")}
            aria-haspopup="listbox"
            aria-expanded={activeDropdown === "platform"}
            aria-label="Filter by platform"
            onKeyDown={(event) => handleDropdownKeyDown(event, "platform")}
          >
            <span id="platform-label">
              {platform
                ? platforms.find((p) => String(p.id) === String(platform))
                    ?.name || "All Platforms"
                : "All Platforms"}
            </span>

            <ChevronDown size={18} />
          </button>

          <div className="dropdown-menu">
            <div
              className={`dropdown-option ${platform === "" ? "selected" : ""}`}
              onClick={() => {
                setPlatform("");
                setPage(1);
                setActiveDropdown(null);
              }}
            >
              All Platforms
            </div>

            {visiblePlatforms.map((p) => (
              <div
                key={p.id}
                className={`dropdown-option ${
                  String(platform) === String(p.id) ? "selected" : ""
                }`}
                onClick={() => {
                  setPlatform(String(p.id));
                  setPage(1);
                  setActiveDropdown(null);
                }}
              >
                {p.displayName}
              </div>
            ))}
          </div>
        </div>

        {/* RESET IS A BUTTON, NOT A FILTER */}
        <button id="reset-filters" className="reset-btn" onClick={resetFilters}>
          Reset
        </button>
      </div>
    </div>
  );
}

export default ExploreToolbar;
