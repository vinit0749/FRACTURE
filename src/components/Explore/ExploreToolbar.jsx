import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import useGameAutocomplete from "../../hooks/useGameAutocomplete";
import SearchAutocomplete from "../Common/SearchAutocomplete";

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

  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const { suggestions } = useGameAutocomplete(searchInput);

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
        {/* SORT ONLY ON HOME PAGE */}
        {section === "explore" && (
          <div
            className={`custom-dropdown ${
              activeDropdown === "sort" ? "active" : ""
            }`}
          >
            <button
              className="dropdown-btn"
              onClick={() => toggleDropdown("sort")}
              aria-haspopup="listbox"
              aria-expanded={activeDropdown === "sort"}
              aria-label="Sort options"
              onKeyDown={(event) => handleDropdownKeyDown(event, "sort")}
            >
              <span id="sort-label">
                {sort === "-added"
                  ? "Popular"
                  : sort === "-rating"
                    ? "Top Rated"
                    : sort === "-released"
                      ? "Newest"
                      : "Name (A-Z)"}
              </span>

              <ChevronDown size={18} />
            </button>

            <div className="dropdown-menu">
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
                  sort === "-rating" ? "selected" : ""
                }`}
                onClick={() => {
                  setSort("-rating");
                  setPage(1);
                  setActiveDropdown(null);
                }}
              >
                Top Rated
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
                Newest
              </div>

              <div
                className={`dropdown-option ${
                  sort === "name" ? "selected" : ""
                }`}
                onClick={() => {
                  setSort("name");
                  setPage(1);
                  setActiveDropdown(null);
                }}
              >
                Name (A-Z)
              </div>
            </div>
          </div>
        )}

        {/* GENRES */}
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
                ? genres.find((g) => g.slug === genre)?.name
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
                  genre === g.slug ? "selected" : ""
                }`}
                onClick={() => {
                  setGenre(g.slug);
                  setPage(1);
                  setActiveDropdown(null);
                }}
              >
                {g.name}
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
            aria-haspopup="listbox"
            aria-expanded={activeDropdown === "platform"}
            aria-label="Filter by platform"
            onKeyDown={(event) => handleDropdownKeyDown(event, "platform")}
          >
            <span id="platform-label">
              {platform
                ? platforms.find((p) => p.id === Number(platform))?.name
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

            {platforms.map((p) => (
              <div
                key={p.id}
                className={`dropdown-option ${
                  platform === String(p.id) ? "selected" : ""
                }`}
                onClick={() => {
                  setPlatform(String(p.id));
                  setPage(1);
                  setActiveDropdown(null);
                }}
              >
                {p.name}
              </div>
            ))}
          </div>
        </div>

        <button id="reset-filters" className="reset-btn" onClick={resetFilters}>
          Reset
        </button>
      </div>
    </div>
  );
}

export default ExploreToolbar;
