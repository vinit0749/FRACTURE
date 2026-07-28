import { useEffect, useRef, useState } from "react";
import { X, Camera, Trash2, Loader2, User } from "lucide-react";
import ImageCropModal from "./ImageCropModal";
import { checkUsernameAvailabilityApi } from "../../utils/cloudStorage";

function EditProfileModal({ open, user, onClose, onSave }) {
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [isCurrentUsername, setIsCurrentUsername] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [pendingImageSrc, setPendingImageSrc] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const previewUrlRef = useRef("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open && user) {
      setDisplayName(user.displayName || "");
      setPhotoURL(user.photoURL || "");
      setSelectedFile(null);
      setUsername(user.username || "");
      setUsernameAvailable(null);
      setIsCurrentUsername(false);
      setError("");
      setLoading(false);
      setSaving(false);
      setShowCropModal(false);
      setPendingImageSrc("");
      setPreviewUrl("");
      previewUrlRef.current = "";
    }
  }, [open, user]);

  useEffect(() => {
    const trimmed = username.trim().toLowerCase();

    if (!trimmed || trimmed.length < 3) {
      setUsernameAvailable(null);
      setIsCurrentUsername(false);
      setUsernameChecking(false);

      return;
    }

    if (!/^[a-z0-9_]+$/.test(trimmed)) {
      setUsernameAvailable(false);
      setIsCurrentUsername(false);
      setUsernameChecking(false);

      return;
    }

    if (trimmed === (user.username || "").toLowerCase()) {
      setUsernameAvailable(null);
      setIsCurrentUsername(true);
      setUsernameChecking(false);

      return;
    }

    setIsCurrentUsername(false);
    setUsernameChecking(true);
    setUsernameAvailable(null);

    const timer = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailabilityApi(trimmed, user.uid);
        setUsernameAvailable(result.available);
      } catch (err) {
        console.error("Username check failed:", err);
        setUsernameAvailable(null);
      } finally {
        setUsernameChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, user.uid, user.username]);

  if (!open || !user) return null;

  async function handleFileChange(e) {
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

    const reader = new FileReader();

    reader.onload = () => {
      setPendingImageSrc(reader.result);
      setShowCropModal(true);
    };

    reader.onerror = () => {
      setError("Failed to load image.");
    };

    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const trimmedName = displayName.trim();

    if (!trimmedName) {
      setError("Please enter a display name.");
      return;
    }

    const trimmedUsername = username.trim().toLowerCase();

    if (trimmedUsername && !/^[a-z0-9_]+$/.test(trimmedUsername)) {
      setError("Username can only contain letters, numbers, and underscores.");
      return;
    }

    if (
      trimmedUsername &&
      (trimmedUsername.length < 3 || trimmedUsername.length > 30)
    ) {
      setError("Username must be between 3 and 30 characters.");
      return;
    }

    if (trimmedUsername && usernameAvailable === false) {
      setError("This username is already taken.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const removePhoto = !selectedFile && !photoURL;

      await onSave({
        displayName: trimmedName,
        photoFile: selectedFile,
        removePhoto,
        username: trimmedUsername || undefined,
      });

      onClose();
    } catch (err) {
      console.error("Profile update failed:", err);

      const message =
        err?.message || "Could not update your profile. Please try again.";

      if (message.toLowerCase().includes("username")) {
        setError(message);
        setUsernameAvailable(false);
      } else {
        setError(message);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleRemovePhoto() {
    setSelectedFile(null);
    setPhotoURL("");
    setPreviewUrl("");
    previewUrlRef.current = "";

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleAvatarClick() {
    if (loading || saving) return;

    fileInputRef.current?.click();
  }

  function handleCropConfirm(croppedFile) {
    const blobUrl = URL.createObjectURL(croppedFile);

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    previewUrlRef.current = blobUrl;
    setSelectedFile(croppedFile);
    setPreviewUrl(blobUrl);
    setPhotoURL(blobUrl);
    setShowCropModal(false);
    setPendingImageSrc("");
  }

  function handleCropCancel() {
    setSelectedFile(null);
    setPreviewUrl("");
    setShowCropModal(false);
    setPendingImageSrc("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const showRemove = selectedFile || photoURL;
  const avatarSrc = previewUrl || photoURL;

  return (
    <div
      className="edit-profile-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading && !saving) {
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
        <button
          type="button"
          className="edit-profile-modal-close"
          onClick={onClose}
          disabled={saving}
          aria-label="Close edit profile"
        >
          <X size={20} />
        </button>

        <div className="edit-profile-modal-header">
          <button
            type="button"
            className="edit-profile-modal-avatar-button"
            onClick={handleAvatarClick}
            disabled={saving}
            aria-label="Change profile picture"
            title="Click to change profile picture"
          >
            <div className="edit-profile-modal-avatar">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Profile preview"
                  onError={() => setPhotoURL("")}
                />
              ) : (
                <span className="edit-profile-avatar-fallback">
                  <User size={32} />
                </span>
              )}

              <div className="edit-profile-avatar-overlay">
                <Camera size={18} />
              </div>
            </div>
          </button>

          <div>
            <h2 id="edit-profile-modal-title">Edit Profile</h2>

            <p>Update your FRACTURE profile information.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="edit-profile-field">
            <label htmlFor="edit-profile-name">Display Name</label>

            <input
              id="edit-profile-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              maxLength={40}
              disabled={saving}
              autoComplete="name"
            />
          </div>

          <div className="edit-profile-field">
            <label htmlFor="edit-profile-username">Username</label>

            <div className="edit-profile-username-wrapper">
              <span className="edit-profile-username-prefix">@</span>

              <input
                id="edit-profile-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter a username"
                maxLength={30}
                disabled={saving}
                autoComplete="off"
                className="edit-profile-username-input"
              />
            </div>

            {username.trim() && (
              <div
                className={`edit-profile-username-status ${
                  isCurrentUsername
                    ? "current"
                    : usernameAvailable === true
                      ? "available"
                      : usernameAvailable === false
                        ? "taken"
                        : ""
                }`}
              >
                {usernameChecking ? (
                  <>
                    <Loader2
                      size={14}
                      className="edit-profile-username-spinner"
                    />
                    <span>Checking availability...</span>
                  </>
                ) : isCurrentUsername ? (
                  <span>That's your current username.</span>
                ) : usernameAvailable === true ? (
                  <span>Username is available.</span>
                ) : usernameAvailable === false ? (
                  <span>This username is already taken.</span>
                ) : null}
              </div>
            )}

            <span className="edit-profile-field-hint">
              3-30 characters. Lowercase letters, numbers, and underscores only.
            </span>
          </div>

          <div className="edit-profile-field">
            <label>Profile Picture</label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={saving}
              hidden
            />

            {selectedFile && (
              <div className="edit-profile-crop-preview">
                <img src={previewUrl} alt="Cropped preview" />
              </div>
            )}

            {showRemove && (
              <button
                type="button"
                className="edit-profile-remove-link"
                onClick={handleRemovePhoto}
                disabled={saving}
              >
                <Trash2 size={14} />
                <span>Remove picture</span>
              </button>
            )}
          </div>

          {error && (
            <div className="edit-profile-error" role="alert">
              {error}
            </div>
          )}

          <div className="edit-profile-actions">
            <button
              type="button"
              className="edit-profile-cancel-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="edit-profile-save-button"
              disabled={
                saving ||
                (username.trim().length >= 3 && usernameAvailable === false)
              }
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="edit-profile-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Camera size={17} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {showCropModal && (
        <ImageCropModal
          imageSrc={pendingImageSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          saving={saving}
        />
      )}
    </div>
  );
}

export default EditProfileModal;
