import fractureLogo from "../../assets/fracture-logo.png";
import { Search, Heart, Bookmark, Dices, Settings } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

import { useRandomGameContext } from "../../context/RandomGameContext";
import useGameAutocomplete from "../../hooks/useGameAutocomplete";
import SearchAutocomplete from "../Common/SearchAutocomplete";
import SettingsMenu from "../Common/SettingsMenu";

function Header({ searchInput, updateSearchInput }) {
  const location = useLocation();
  const navigate = useNavigate();

  const searchRef = useRef(null);
  const settingsRef = useRef(null);

  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const { getRandomGame } = useRandomGameContext();

  const {
    suggestions,
    loading: suggestionsLoading,
    error: suggestionsError,
  } = useGameAutocomplete(searchInput);

  function search() {
    const query = searchInput.trim();

    if (!query) return;

    navigate(`/?search=${encodeURIComponent(query)}`);

    setShowAutocomplete(false);
    setActiveIndex(-1);
  }

  function handleKeyboardNavigation(e) {
    if (!showAutocomplete || suggestions.length === 0) {
      return;
    }

    // Arrow Down
    if (e.key === "ArrowDown") {
      e.preventDefault();

      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    }

    // Arrow Up
    else if (e.key === "ArrowUp") {
      e.preventDefault();

      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    }

    // Enter select suggestion
    else if (e.key === "Enter") {
      e.preventDefault();

      if (activeIndex >= 0) {
        const selectedGame = suggestions[activeIndex];

        navigate(`/game/${selectedGame.id}`);

        setShowAutocomplete(false);
        setActiveIndex(-1);
      } else {
        search();
      }
    }

    // Escape close
    else if (e.key === "Escape") {
      setShowAutocomplete(false);
      setActiveIndex(-1);
    }
  }

  // Close menus when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowAutocomplete(false);
        setActiveIndex(-1);
      }

      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setShowAutocomplete(false);
        setActiveIndex(-1);
        setShowSettings(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="site-header">
      <div className="container header-container">
        <div className="logo">
          <Link
            to="/"
            className="logo-link"
            onClick={() => {
              window.dispatchEvent(new Event("resetHome"));
            }}
          >
            <img src={fractureLogo} alt="FRACTURE" className="logo-image" />
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
              to="/trending"
              className={`nav-link ${
                location.pathname === "/trending" ? "active" : ""
              }`}
            >
              Trending
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

          <div className="search-section" ref={searchRef}>
            <input
              id="search-input"
              type="text"
              placeholder="Search games or genres..."
              value={searchInput}
              onFocus={() => {
                if (searchInput.trim().length >= 2) {
                  setShowAutocomplete(true);
                }
              }}
              onChange={(e) => {
                updateSearchInput(e.target.value, "header");

                setActiveIndex(-1);

                if (e.target.value.trim().length >= 2) {
                  setShowAutocomplete(true);
                } else {
                  setShowAutocomplete(false);
                }
              }}
              onKeyDown={handleKeyboardNavigation}
            />

            <button
              className="search-button"
              aria-label="Search"
              onClick={search}
            >
              <Search size={20} />
            </button>

            <SearchAutocomplete
              suggestions={suggestions}
              visible={showAutocomplete}
              activeIndex={activeIndex}
              loading={suggestionsLoading}
              error={suggestionsError}
              onSelect={() => {
                setShowAutocomplete(false);
                setActiveIndex(-1);
              }}
            />
          </div>

          <div className="header-icons">
            <button
              className="header-icon random-header-icon"
              aria-label="Surprise Me"
              onClick={getRandomGame}
            >
              <Dices size={22} />

              <span className="tooltip">Surprise Me</span>
            </button>

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
            <div className="settings-wrapper" ref={settingsRef}>
              <button
                className="header-icon settings-header-icon"
                aria-label="Settings"
                onClick={() => setShowSettings((prev) => !prev)}
              >
                <Settings size={20} />
              </button>

              <SettingsMenu open={showSettings} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
