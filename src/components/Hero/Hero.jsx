import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function formatDate(date) {
  if (!date) return "Unknown";

  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getMetacriticColor(score) {
  if (!score) return "#999";
  if (score >= 75) return "#6dc849";
  if (score >= 50) return "#fdca52";
  return "#fc4b37";
}

function Hero({ hero, screenshots = [] }) {
  const imageRef = useRef(null);

  const navigate = useNavigate();

  const [currentImage, setCurrentImage] = useState(null);

  const isLoading = !hero || !currentImage;

  // Load base hero image
  useEffect(() => {
    if (!hero) return;

    setCurrentImage(hero.background_image);
  }, [hero]);

  // Screenshot rotation
  useEffect(() => {
    if (!screenshots.length) return;

    if (screenshots.length === 1) {
      setCurrentImage(screenshots[0]);
      return;
    }

    let screenshotIndex = 0;
    let timeoutId = null;

    const intervalId = setInterval(() => {
      const img = imageRef.current;

      if (!img) return;

      // Fade out current image
      img.classList.remove("fade-in");
      img.classList.add("fade-out");

      timeoutId = setTimeout(() => {
        screenshotIndex = (screenshotIndex + 1) % screenshots.length;

        const nextImage = screenshots[screenshotIndex];

        // Preload next screenshot
        const preload = new Image();

        preload.src = nextImage;

        preload.onload = () => {
          setCurrentImage(nextImage);

          // Force browser refresh animation state
          void img.offsetWidth;

          img.classList.remove("fade-out");

          requestAnimationFrame(() => {
            img.classList.add("fade-in");
          });
        };
      }, 500);
    }, 5000);

    return () => {
      clearInterval(intervalId);

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [screenshots]);

  return (
    <section className="hero" id="hero">
      <div className="hero-backdrop">
        <div
          id="hero-blur"
          className="hero-blur"
          style={{
            backgroundImage: currentImage ? `url(${currentImage})` : "none",
          }}
        />

        <img
          ref={imageRef}
          id="hero-image"
          className={`hero-image ${isLoading ? "" : "fade-in"}`}
          src={
            currentImage ||
            "https://placehold.co/1600x900/111827/FFFFFF?text=Loading"
          }
          alt={hero?.name || "Featured Game"}
        />

        <div className="hero-gradient"></div>
      </div>

      <div className="hero-content">
        <span className="hero-tag">FRACTURE'S PICK</span>

        <h2 id="hero-title">
          {hero?.name || "Discovering your next adventure..."}
        </h2>

        <p id="hero-description">
          {hero?.description_raw
            ? hero.description_raw.split(". ").slice(0, 2).join(". ") + "."
            : "Discover one of the highest-rated games on Fracture."}
        </p>

        <div className="hero-stats">
          <span id="hero-rating">
            {hero ? `⭐ ${hero.rating.toFixed(1)}` : "⭐ --"}
          </span>

          <span
            id="hero-metacritic"
            style={{
              color: getMetacriticColor(hero?.metacritic),
            }}
          >
            Metacritic {hero?.metacritic ?? "N/A"}
          </span>

          <span id="hero-release">Released {formatDate(hero?.released)}</span>
        </div>

        <div className="hero-genres">
          {hero?.genres?.map((g) => g.name).join(" • ") || "Unknown"}
        </div>

        <button
          className="hero-btn"
          id="hero-details-btn"
          onClick={() => {
            if (hero?.id) {
              navigate(`/game/${hero.id}`);
            }
          }}
        >
          View Details
        </button>
      </div>
    </section>
  );
}

export default Hero;
