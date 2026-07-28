import { useState } from "react";
import { VideoOff, Play } from "lucide-react";

function TrailerSection({ trailer, game }) {
  const [play, setPlay] = useState(false);

  return (
    <section className="trailer-section">
      <div className="section-label">TRAILER</div>

      {!trailer ? (
        <div className="no-trailer">
          <div className="no-trailer-icon">
            <VideoOff size={40} />
          </div>

          <h3>Trailer unavailable</h3>

          <p>No official trailer could be found for this game.</p>
        </div>
      ) : play ? (
        <div className="trailer-video-wrapper">
          <iframe
            className="game-trailer"
            src={`https://www.youtube.com/embed/${trailer.videoId}?autoplay=1`}
            title={trailer.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        <div
          className="trailer-wrapper"
          onClick={() => setPlay(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              setPlay(true);
            }
          }}
        >
          <img
            className="trailer-thumb"
            src={trailer.thumbnail || game.background_image}
            alt={trailer.title || `${game.name} trailer`}
          />

          <div className="trailer-play">
            <Play size={18} /> Play Trailer
          </div>
        </div>
      )}
    </section>
  );
}

export default TrailerSection;
