import { Link } from "react-router-dom";

function SearchAutocomplete({
  suggestions = [],
  visible,
  activeIndex,
  onSelect,
}) {
  if (!visible || suggestions.length === 0) {
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
