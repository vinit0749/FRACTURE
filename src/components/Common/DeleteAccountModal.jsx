import { useState } from "react";
import { Eye, EyeOff, Trash2, X } from "lucide-react";

function DeleteAccountModal({ open, user, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const providerId = user?.providerData?.[0]?.providerId;

  const isPasswordUser = providerId === "password";
  const isGoogleUser = providerId === "google.com";
  const isGithubUser = providerId === "github.com";

  async function handleConfirm() {
    setError("");

    if (isPasswordUser && !password) {
      setError("Please enter your password to continue.");
      return;
    }

    try {
      setLoading(true);

      await onConfirm({
        password: isPasswordUser ? password : null,
        providerId,
      });
    } catch (error) {
      console.error("Delete account confirmation failed:", error);

      setError(
        error?.message || "Unable to verify your identity. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;

    setPassword("");
    setShowPassword(false);
    setError("");

    onClose();
  }

  return (
    <div
      className="delete-account-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) {
          handleClose();
        }
      }}
    >
      <div
        className="delete-account-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-modal-title"
      >
        <button
          type="button"
          className="delete-account-modal-close"
          onClick={handleClose}
          disabled={loading}
          aria-label="Close delete account confirmation"
        >
          <X size={20} />
        </button>

        <div className="delete-account-modal-icon">
          <Trash2 size={24} />
        </div>

        <div className="delete-account-modal-content">
          <h2 id="delete-account-modal-title">Delete Account?</h2>

          <p>
            This will permanently delete your FRACTURE account and all
            associated data. This action cannot be undone.
          </p>

          {isPasswordUser && (
            <div className="delete-account-password-field">
              <label htmlFor="delete-account-password">
                Confirm your password
              </label>

              <div className="delete-account-password-input-wrapper">
                <input
                  id="delete-account-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your current password"
                  disabled={loading}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="delete-account-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {isGoogleUser && (
            <p className="delete-account-provider-message">
              You'll be asked to sign in with Google again to verify your
              identity.
            </p>
          )}

          {isGithubUser && (
            <p className="delete-account-provider-message">
              You'll be asked to sign in with GitHub again to verify your
              identity.
            </p>
          )}

          {error && (
            <p className="delete-account-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="delete-account-modal-actions">
          <button
            type="button"
            className="delete-account-cancel-button"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            className="delete-account-confirm-button"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Verifying..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteAccountModal;
