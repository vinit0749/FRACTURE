import { useState } from "react";
import Lightbox from "./Lightbox";

function ScreenshotGallery({ screenshots, game }) {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!screenshots?.length) {
    return (
      <section className="screenshots-section">
        <div className="section-label">SCREENSHOTS</div>

        <p>No screenshots available.</p>
      </section>
    );
  }

  return (
    <>
      <section className="screenshots-section">
        <div className="section-label">SCREENSHOTS</div>

        <div className="screenshots-grid">
          {screenshots.slice(0, 6).map((shot) => (
            <img
              key={shot.id}
              className="screenshot"
              src={shot.image}
              alt={`${game.name} Screenshot`}
              loading="lazy"
              onClick={() => setSelectedImage(shot.image)}
            />
          ))}
        </div>
      </section>

      <Lightbox image={selectedImage} close={() => setSelectedImage(null)} />
    </>
  );
}

export default ScreenshotGallery;
