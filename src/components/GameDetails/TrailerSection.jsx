import { useState } from "react";

function TrailerSection({ trailer, game }) {
  const [play, setPlay] = useState(false);

  return (
    <section className="trailer-section">
      <div className="section-label">TRAILER</div>

      {!trailer ? (
        <div className="no-trailer">
          <div className="no-trailer-icon">🎬</div>

          <h3>Trailer unavailable</h3>

          <p>The publisher has not provided a trailer for this game.</p>
        </div>
      ) : play ? (
        <video
          className="game-trailer"
          controls
          autoPlay
          poster={game.background_image}
        >
          <source src={trailer.data.max} type="video/mp4" />
        </video>
      ) : (
        <div className="trailer-wrapper" onClick={() => setPlay(true)}>
          <img
            className="trailer-thumb"
            src={game.background_image}
            alt={game.name}
          />

          <div className="trailer-play">▶ Play Trailer</div>
        </div>
      )}
    </section>
  );
}

export default TrailerSection;
