import { useEffect, useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function AuthModal({ open, mode = "login", onClose }) {
  const { login, signup, loginWithGoogle, loginWithGithub } = useAuth();

  const [authMode, setAuthMode] = useState(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  useEffect(() => {
    if (open) {
      setAuthMode(mode);
      resetForm();
    }
  }, [mode, open]);

  if (!open) return null;

  function switchMode(nextMode) {
    setAuthMode(nextMode);
    resetForm();
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (authMode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      if (authMode === "signup") {
        await signup(email, password);
      } else {
        await login(email, password);
      }

      resetForm();
      onClose();
    } catch (err) {
      console.error("Authentication error:", err);

      switch (err.code) {
        case "auth/email-already-in-use":
          setError("An account already exists with this email.");
          break;

        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        case "auth/weak-password":
          setError("Password must be at least 6 characters.");
          break;

        case "auth/invalid-credential":
          setError("Invalid email or password.");
          break;

        case "auth/user-not-found":
          setError("No account was found with this email.");
          break;

        case "auth/wrong-password":
          setError("Incorrect password.");
          break;

        default:
          setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");

    try {
      setLoading(true);
      await loginWithGoogle();
      onClose();
    } catch (err) {
      console.error("Google authentication error:", err);

      if (err.code !== "auth/popup-closed-by-user") {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGithubLogin() {
    setError("");

    try {
      setLoading(true);
      await loginWithGithub();
      onClose();
    } catch (err) {
      console.error("GitHub authentication error:", err);

      if (err.code !== "auth/popup-closed-by-user") {
        setError("GitHub sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="auth-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          className="auth-modal-close"
          onClick={onClose}
          disabled={loading}
          aria-label="Close authentication dialog"
        >
          <X size={20} />
        </button>

        <div className="auth-modal-header">
          <h2 id="auth-modal-title">
            {authMode === "signup" ? "Create Account" : "Welcome Back"}
          </h2>

          <p>
            {authMode === "signup"
              ? "Create your FRACTURE account."
              : "Sign in to your FRACTURE account."}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>

            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>

            <div className="auth-password-wrapper">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete={
                  authMode === "signup" ? "new-password" : "current-password"
                }
                required
                disabled={loading}
              />

              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {authMode === "signup" && (
            <div className="auth-field">
              <label htmlFor="auth-confirm-password">Confirm Password</label>

              <div className="auth-password-wrapper">
                <input
                  id="auth-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit-button"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : authMode === "signup"
                ? "Create Account"
                : "Sign In"}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <div className="auth-oauth-buttons">
          <button
            type="button"
            className="auth-oauth-button"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            Continue with Google
          </button>

          <button
            type="button"
            className="auth-oauth-button"
            onClick={handleGithubLogin}
            disabled={loading}
          >
            Continue with GitHub
          </button>
        </div>

        <div className="auth-switch">
          {authMode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                disabled={loading}
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                disabled={loading}
              >
                Create Account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
