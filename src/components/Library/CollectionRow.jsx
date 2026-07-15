import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import GameCard from "../Explore/GameCard";

function CollectionRow({ title, games, onLibraryChange, onViewAll }) {
  const rowRef = useRef(null);

  if (!games.length) return null;

  function scrollLeft() {
    rowRef.current?.scrollBy({
      left: -500,
      behavior: "smooth",
    });
  }

  function scrollRight() {
    rowRef.current?.scrollBy({
      left: 500,
      behavior: "smooth",
    });
  }

  return (
    <section className="collection-row">
      <div className="collection-row-header">
        <h2>{title}</h2>

        <button
          type="button"
          className="collection-view-all"
          onClick={onViewAll}
        >
          View All
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="collection-carousel">
        <button
          className="carousel-arrow carousel-arrow-left"
          onClick={scrollLeft}
          aria-label="Scroll left"
        >
          <ChevronLeft size={22} />
        </button>

        <div className="collection-row-games" ref={rowRef}>
          {games.slice(0, 6).map((game) => (
            <div key={game.id} className="collection-card-wrapper">
              <GameCard
                game={game}
                onLibraryChange={onLibraryChange}
                showLibraryStatus
              />
            </div>
          ))}
        </div>

        <button
          className="carousel-arrow carousel-arrow-right"
          onClick={scrollRight}
          aria-label="Scroll right"
        >
          <ChevronRight size={22} />
        </button>
      </div>
    </section>
  );
}

export default CollectionRow;
