import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function Carousel({
  title,
  items,
  renderItem,
  onViewAll,
  scrollAmount = 500,
  itemWidth = 230,
}) {
  const carouselRef = useRef(null);

  if (!items || items.length === 0) {
    return null;
  }

  function scrollLeft() {
    carouselRef.current?.scrollBy({
      left: -scrollAmount,
      behavior: "smooth",
    });
  }

  function scrollRight() {
    carouselRef.current?.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    });
  }

  return (
    <section className="carousel-section">
      {(title || onViewAll) && (
        <div className="carousel-header">
          {title && <h2>{title}</h2>}

          {onViewAll && (
            <button
              type="button"
              className="carousel-view-all"
              onClick={onViewAll}
            >
              View All
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      )}

      <div className="carousel-container">
        <button
          type="button"
          className="carousel-arrow carousel-arrow-left"
          onClick={scrollLeft}
          aria-label="Scroll left"
        >
          <ChevronLeft size={22} />
        </button>

        <div className="carousel-track" ref={carouselRef}>
          {items.map((item) => (
            <div
              key={item.id}
              className="carousel-item"
              style={{ flex: `0 0 ${itemWidth}px` }}
            >
              {renderItem(item)}
            </div>
          ))}
        </div>

        <button
          type="button"
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

export default Carousel;
