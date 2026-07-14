function Lightbox({ image, close }) {
  if (!image) return null;

  return (
    <div className="lightbox" onClick={close}>
      <button className="lightbox-close" onClick={close}>
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
