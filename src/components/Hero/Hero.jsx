import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import useHeroCarousel from "../../hooks/useHeroCarousel";

function formatDate(date) {
  if (!date) return "Unknown";

  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getMetacriticColor(score) {
  if (!score) return "#94a3b8";

  if (score >= 75) return "#6dc849";

  if (score >= 50) return "#fdca52";

  return "#fc4b37";
}

function Hero({ hero, heroImages = [], heroMeta }) {
  const navigate = useNavigate();

  const {
    currentImage,
    currentIndex,
    totalImages,
    progress,
    next,
    previous,
    goTo,
  } = useHeroCarousel(heroImages);

  if (!hero || !currentImage) {
    return null;
  }

  return (
    <section className="hero">
      <div className="hero-backdrop">
        <div
          className="hero-blur"
          style={{
            backgroundImage: `url(${currentImage})`,
          }}
        />

        <img
          key={currentImage}
          src={currentImage}
          alt={hero.name}
          className="hero-image"
        />

        <div className="hero-gradient" />
      </div>

      {totalImages > 1 && (
        <>
          <button className="hero-arrow hero-arrow-left" onClick={previous}>
            <ChevronLeft size={26} />
          </button>

          <button className="hero-arrow hero-arrow-right" onClick={next}>
            <ChevronRight size={26} />
          </button>
        </>
      )}

      <div className="hero-content">
        <span className="hero-tag">
          ✦ {heroMeta?.badge || "FEATURED DISCOVERY"}
        </span>

        <h1>{hero.name}</h1>

        <p>
          {heroMeta?.reason ||
            hero.description_raw?.split(". ").slice(0, 2).join(". ")}
        </p>

        <div className="hero-meta">
          <div className="meta-card">
            <strong>{hero.rating?.toFixed(1) || "N/A"}</strong>

            <span>Rating</span>
          </div>

          {hero.metacritic && (
            <div className="meta-card">
              <strong
                style={{
                  color: getMetacriticColor(hero.metacritic),
                }}
              >
                {hero.metacritic}
              </strong>

              <span>Metacritic</span>
            </div>
          )}

          <div className="meta-card">
            <strong>{formatDate(hero.released)}</strong>

            <span>Release</span>
          </div>
        </div>

        <div className="hero-genres">
          {hero.genres?.slice(0, 4).map((genre) => (
            <span key={genre.id}>{genre.name}</span>
          ))}
        </div>

        <button
          className="hero-btn"
          onClick={() => navigate(`/game/${hero.id}`)}
        >
          View Details
        </button>
      </div>

      {totalImages > 1 && (
        <div className="hero-progress">
          {Array.from({
            length: totalImages,
          }).map((_, index) => (
            <button
              key={index}
              className="hero-progress-item"
              onClick={() => goTo(index)}
            >
              <span
                className="hero-progress-fill"
                style={{
                  width:
                    index < currentIndex
                      ? "100%"
                      : index === currentIndex
                        ? `${progress}%`
                        : "0%",
                }}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default Hero;
