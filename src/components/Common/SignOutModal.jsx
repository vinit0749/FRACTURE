import { useState } from "react";
import { LogOut, X } from "lucide-react";

function SignOutModal({ open, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleConfirm() {
    try {
      setLoading(true);
      await onConfirm();
    } catch (error) {
      console.error("Sign out confirmation failed:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="signout-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        className="signout-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signout-modal-title"
      >
        <button
          type="button"
          className="signout-modal-close"
          onClick={onClose}
          disabled={loading}
          aria-label="Close sign out confirmation"
        >
          <X size={20} />
        </button>

        <div className="signout-modal-icon">
          <LogOut size={24} />
        </div>

        <div className="signout-modal-content">
          <h2 id="signout-modal-title">Sign Out?</h2>

          <p>Are you sure you want to sign out of your FRACTURE account?</p>
        </div>

        <div className="signout-modal-actions">
          <button
            type="button"
            className="signout-cancel-button"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            className="signout-confirm-button"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Signing Out..." : "Sign Out"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignOutModal;
