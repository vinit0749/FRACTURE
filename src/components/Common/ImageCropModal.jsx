import { useState, useRef } from "react";
import ReactCrop, { makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Camera, X, Loader2 } from "lucide-react";

function ImageCropModal({ imageSrc, onConfirm, onCancel, saving }) {
  const [crop, setCrop] = useState(null);
  const [generating, setGenerating] = useState(false);
  const imgRef = useRef(null);

  function onImageLoad(e) {
    const { naturalWidth, naturalHeight } = e.currentTarget;

    const initialCrop = makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      1,
      naturalWidth,
      naturalHeight,
    );

    setCrop(initialCrop);
  }

  async function handleConfirm() {
    const image = imgRef.current;

    if (!image || !crop) {
      return;
    }

    setGenerating(true);

    try {
      // crop is stored as a percentage crop.
      // Convert percentage coordinates directly to natural image pixels.
      const cropX = (crop.x / 100) * image.naturalWidth;
      const cropY = (crop.y / 100) * image.naturalHeight;
      const cropWidth = (crop.width / 100) * image.naturalWidth;
      const cropHeight = (crop.height / 100) * image.naturalHeight;

      if (
        cropWidth <= 0 ||
        cropHeight <= 0 ||
        !Number.isFinite(cropX) ||
        !Number.isFinite(cropY) ||
        !Number.isFinite(cropWidth) ||
        !Number.isFinite(cropHeight)
      ) {
        throw new Error("Invalid crop dimensions.");
      }

      const canvas = document.createElement("canvas");

      canvas.width = Math.round(cropWidth);
      canvas.height = Math.round(cropHeight);

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not create canvas context.");
      }

      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error("Failed to generate cropped image."));
            }
          },
          "image/jpeg",
          0.92,
        );
      });

      const file = new File([blob], "cropped-profile-picture.jpg", {
        type: "image/jpeg",
        lastModified: Date.now(),
      });

      onConfirm(file);
    } catch (err) {
      console.error("Image cropping failed:", err);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="image-crop-modal-backdrop" onMouseDown={onCancel}>
      <div
        className="image-crop-modal"
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="image-crop-modal-header">
          <h3>Adjust Profile Picture</h3>
          <p>Crop your image to a square</p>
        </div>

        <div className="image-crop-content">
          <ReactCrop
            crop={crop}
            onChange={(pixelCrop, percentCrop) => {
              setCrop(percentCrop);
            }}
            onComplete={(pixelCrop, percentCrop) => {
              setCrop(percentCrop);
            }}
            aspect={1}
            circularCrop={false}
            keepSelection
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>

        <div className="image-crop-actions">
          <button
            type="button"
            className="image-crop-cancel"
            onClick={onCancel}
            disabled={saving || generating}
          >
            <X size={16} />
            <span>Cancel</span>
          </button>

          <button
            type="button"
            className="image-crop-confirm"
            onClick={handleConfirm}
            disabled={!crop || saving || generating}
          >
            {generating ? (
              <>
                <Loader2 size={16} className="image-crop-spinner" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Camera size={16} />
                <span>Confirm Crop</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropModal;
