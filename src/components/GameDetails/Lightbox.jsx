import { useEffect } from "react";

function Lightbox({ image, close }) {
  useEffect(() => {
    if (!image) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [image, close]);

  if (!image) return null;

  return (
    <div
      className="lightbox"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <button
        className="lightbox-close"
        onClick={close}
        aria-label="Close image preview"
      >
        &times;
      </button>

      <img
        id="lightbox-image"
        src={image}
        alt=""
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default Lightbox;
