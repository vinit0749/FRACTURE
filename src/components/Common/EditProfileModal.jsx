import { useEffect, useRef, useState } from "react";
import { X, Upload, ImagePlus, User } from "lucide-react";

function EditProfileModal({ open, user, onClose, onSave }) {
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open && user) {
      setDisplayName(user.displayName || "");
      setPhotoURL(user.photoURL || "");
      setSelectedFile(null);
      setError("");
    }
  }, [open, user]);

  if (!open || !user) return null;

  function handleFileChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile picture must be smaller than 5 MB.");
      return;
    }

    setError("");
    setSelectedFile(file);

    // Create a temporary local preview.
    // This does NOT upload anything to Firebase.
    const previewURL = URL.createObjectURL(file);

    setPhotoURL(previewURL);
  }

  function handleRemovePhoto() {
    setSelectedFile(null);
    setPhotoURL("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const trimmedName = displayName.trim();

    if (!trimmedName) {
      setError("Please enter a display name.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const removePhoto = !selectedFile && !photoURL;

      await onSave({
        displayName: trimmedName,
        photoFile: selectedFile,
        removePhoto,
      });

      onClose();
    } catch (err) {
      console.error("Profile update failed:", err);

      setError(
        err?.message || "Could not update your profile. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="edit-profile-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        className="edit-profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-modal-title"
      >
        {/* CLOSE */}

        <button
          type="button"
          className="edit-profile-modal-close"
          onClick={onClose}
          disabled={loading}
          aria-label="Close edit profile"
        >
          <X size={20} />
        </button>

        {/* HEADER */}

        <div className="edit-profile-modal-header">
          <div className="edit-profile-modal-avatar">
            {photoURL ? (
              <img
                src={photoURL}
                alt="Profile preview"
                onError={() => setPhotoURL("")}
              />
            ) : (
              <span className="edit-profile-avatar-fallback">
                <User size={32} />
              </span>
            )}
          </div>

          <div>
            <h2 id="edit-profile-modal-title">Edit Profile</h2>

            <p>Update your FRACTURE profile information.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* DISPLAY NAME */}

          <div className="edit-profile-field">
            <label htmlFor="edit-profile-name">Display Name</label>

            <input
              id="edit-profile-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              maxLength={40}
              disabled={loading}
              autoComplete="name"
            />
          </div>

          {/* PROFILE PICTURE */}

          <div className="edit-profile-field">
            <label>Profile Picture</label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={loading}
              hidden
            />

            <button
              type="button"
              className="edit-profile-upload-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <Upload size={18} />

              {selectedFile
                ? "Choose Another Picture"
                : "Upload Profile Picture"}
            </button>

            <span className="edit-profile-field-hint">
              JPG, PNG, WEBP or GIF. Maximum 5 MB.
            </span>

            {(selectedFile || photoURL) && (
              <button
                type="button"
                className="edit-profile-remove-button"
                onClick={handleRemovePhoto}
                disabled={loading}
              >
                Remove Profile Picture
              </button>
            )}
          </div>

          {/* ERROR */}

          {error && (
            <div className="edit-profile-error" role="alert">
              {error}
            </div>
          )}

          {/* ACTIONS */}

          <div className="edit-profile-actions">
            <button
              type="button"
              className="edit-profile-cancel-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="edit-profile-save-button"
              disabled={loading}
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <ImagePlus size={17} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;
