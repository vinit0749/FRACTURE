import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

import cloudinary from "../config/cloudinary.js";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "fracture/profile-pictures",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [
      {
        width: 500,
        height: 500,
        crop: "fill",
        gravity: "face",
      },
    ],
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (req, file, callback) => {
    const extension = file.originalname.split(".").pop()?.toLowerCase();

    const isMimeTypeAllowed = ALLOWED_MIME_TYPES.has(file.mimetype);
    const isExtensionAllowed = ALLOWED_EXTENSIONS.has(extension);

    if (!isMimeTypeAllowed || !isExtensionAllowed) {
      return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
    }

    callback(null, true);
  },
});

export default upload;
