import { Link } from "react-router-dom";

function SearchAutocomplete({
  suggestions = [],
  visible,
  activeIndex,
  loading,
  error,
  onSelect,
}) {
  if (!visible) {
    return null;
  }

  if (loading) {
    return (
      <div className="autocomplete-wrapper" role="status" aria-live="polite">
        <div className="autocomplete-dropdown">
          <div className="autocomplete-item">Loading suggestions…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="autocomplete-wrapper" role="status" aria-live="polite">
        <div className="autocomplete-dropdown">
          <div className="autocomplete-item">{error}</div>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="autocomplete-wrapper" role="listbox">
      <div className="autocomplete-dropdown">
        {suggestions.map((game, index) => (
          <Link
            key={game.id}
            to={`/game/${game.id}`}
            className={`autocomplete-item ${
              index === activeIndex ? "active" : ""
            }`}
            onClick={onSelect}
            role="option"
            aria-selected={index === activeIndex}
          >
            <img
              src={game.background_image || "/placeholder-game.jpg"}
              alt={game.name}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />

            <div className="autocomplete-info">
              <h4>{game.name}</h4>

              <div className="autocomplete-meta">
                {game.genres?.slice(0, 2).map((genre) => (
                  <span key={genre.id}>{genre.name}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default SearchAutocomplete;
