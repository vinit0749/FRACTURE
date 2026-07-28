import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Palette,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react";

import { FaGoogle, FaGithub } from "react-icons/fa";

import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../../context/AuthModalContext";

import SignOutModal from "./SignOutModal";

function SettingsMenu({ open }) {
  const navigate = useNavigate();

  const { theme, setTheme } = useTheme();

  const { user, logout, linkGithub, unlinkGithub } = useAuth();

  const { openAuthModal } = useAuthModal();

  const [page, setPage] = useState("settings");

  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const [githubConnecting, setGithubConnecting] = useState(false);
  const [githubDisconnecting, setGithubDisconnecting] = useState(false);
  const [githubError, setGithubError] = useState("");

  const googleConnected = user?.providerData?.some(
    (provider) => provider.providerId === "google.com",
  );

  const githubConnected = user?.providerData?.some(
    (provider) => provider.providerId === "github.com",
  );

  if (!open) return null;

  async function handleConnectGithub() {
    try {
      setGithubConnecting(true);
      setGithubError("");

      await linkGithub();
    } catch (err) {
      console.error("GitHub linking error:", err);

      if (err.code === "auth/popup-closed-by-user") {
        return;
      }

      if (err.code === "auth/credential-already-in-use") {
        setGithubError("This GitHub account is already connected.");
        return;
      }

      if (err.code === "auth/provider-already-linked") {
        setGithubError("GitHub is already connected.");
        return;
      }

      setGithubError("Could not connect GitHub. Please try again.");
    } finally {
      setGithubConnecting(false);
    }
  }

  async function handleDisconnectGithub() {
    try {
      setGithubDisconnecting(true);
      setGithubError("");

      await unlinkGithub();
    } catch (err) {
      console.error("GitHub unlinking error:", err);

      if (err.code === "auth/no-such-provider") {
        setGithubError("GitHub is not connected.");
        return;
      }

      setGithubError("Could not disconnect GitHub. Please try again.");
    } finally {
      setGithubDisconnecting(false);
    }
  }

  function handleSignIn() {
    setPage("settings");
    setGithubError("");
    openAuthModal("login");
  }

  function handleCreateAccount() {
    setPage("settings");
    setGithubError("");
    openAuthModal("signup");
  }

  async function handleConfirmSignOut() {
    try {
      await logout();
      setShowSignOutModal(false);
      setPage("settings");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }

  return (
    <>
      <div className="settings-menu" role="menu" aria-label="Settings menu">
        {/* ==================================================
            MAIN SETTINGS
        ================================================== */}

        {page === "settings" && (
          <>
            <div className="settings-menu-title">Settings</div>

            <button
              className="settings-menu-item"
              onClick={() => {
                setGithubError("");
                setPage("account");
              }}
              role="menuitem"
            >
              <User size={18} />

              <span>Account</span>

              <span className="settings-arrow">
                <ChevronRight size={16} />
              </span>
            </button>

            <button
              className="settings-menu-item"
              onClick={() => setPage("appearance")}
              role="menuitem"
            >
              <Palette size={18} />

              <span>Appearance</span>

              <span className="settings-arrow">
                <ChevronRight size={16} />
              </span>
            </button>
          </>
        )}

        {/* ==================================================
            APPEARANCE
        ================================================== */}

        {page === "appearance" && (
          <>
            <button
              className="settings-back-button"
              onClick={() => setPage("settings")}
              aria-label="Back to settings"
            >
              <ChevronLeft size={18} />
              Appearance
            </button>

            <div className="settings-current-theme">Current Theme: {theme}</div>

            <button
              className={`settings-theme-option ${
                theme === "midnight" ? "active" : ""
              }`}
              onClick={() => setTheme("midnight")}
              role="menuitemradio"
              aria-checked={theme === "midnight"}
            >
              Midnight
            </button>

            <button
              className={`settings-theme-option ${
                theme === "obsidian" ? "active" : ""
              }`}
              onClick={() => setTheme("obsidian")}
              role="menuitemradio"
              aria-checked={theme === "obsidian"}
            >
              Obsidian
            </button>

            <button
              className={`settings-theme-option ${
                theme === "crimson" ? "active" : ""
              }`}
              onClick={() => setTheme("crimson")}
              role="menuitemradio"
              aria-checked={theme === "crimson"}
            >
              Crimson
            </button>

            <button
              className={`settings-theme-option ${
                theme === "emerald" ? "active" : ""
              }`}
              onClick={() => setTheme("emerald")}
              role="menuitemradio"
              aria-checked={theme === "emerald"}
            >
              Emerald
            </button>

            <button
              className={`settings-theme-option ${
                theme === "violet" ? "active" : ""
              }`}
              onClick={() => setTheme("violet")}
              role="menuitemradio"
              aria-checked={theme === "violet"}
            >
              Violet
            </button>
          </>
        )}

        {/* ==================================================
            ACCOUNT
        ================================================== */}

        {page === "account" && (
          <>
            <button
              className="settings-back-button"
              onClick={() => {
                setGithubError("");
                setPage("settings");
              }}
              aria-label="Back to settings"
            >
              <ChevronLeft size={18} />
              Account
            </button>

            {user ? (
              <>
                {/* ==================================================
                    PROFILE
                ================================================== */}

                <div className="settings-section-label">Profile</div>

                <button
                  type="button"
                  className="settings-account-info"
                  onClick={() => navigate("/profile")}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "Profile"}
                      className="settings-account-avatar"
                    />
                  ) : (
                    <div className="settings-account-avatar settings-account-avatar-fallback">
                      <User size={20} />
                    </div>
                  )}

                  <div className="settings-account-details">
                    <div className="settings-account-name">
                      {user.displayName || "FRACTURE User"}
                    </div>

                    <div className="settings-account-email">{user.email}</div>
                  </div>

                  <span className="settings-arrow">
                    <ChevronRight size={16} />
                  </span>
                </button>

                {/* ==================================================
                    CONNECTED ACCOUNTS
                ================================================== */}

                <div className="settings-section-label settings-connected-label">
                  Connected Accounts
                </div>

                {/* GOOGLE */}

                <div className="settings-connected-account">
                  <div className="settings-connected-account-info">
                    <div className="settings-provider-icon settings-google-icon">
                      <FaGoogle />
                    </div>

                    <div className="settings-provider-details">
                      <div className="settings-provider-name">Google</div>

                      <div
                        className={`settings-provider-status ${
                          googleConnected ? "connected" : "not-connected"
                        }`}
                      >
                        {googleConnected ? "Connected" : "Not connected"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* GITHUB */}

                <div className="settings-connected-account">
                  <div className="settings-connected-account-info">
                    <div className="settings-provider-icon settings-github-icon">
                      <FaGithub />
                    </div>

                    <div className="settings-provider-details">
                      <div className="settings-provider-name">GitHub</div>

                      <div
                        className={`settings-provider-status ${
                          githubConnected ? "connected" : "not-connected"
                        }`}
                      >
                        {githubConnected ? "Connected" : "Not connected"}
                      </div>
                    </div>
                  </div>

                  <button
                    className="settings-provider-action"
                    onClick={
                      githubConnected
                        ? handleDisconnectGithub
                        : handleConnectGithub
                    }
                    disabled={githubConnecting || githubDisconnecting}
                  >
                    {githubConnecting
                      ? "Connecting..."
                      : githubDisconnecting
                        ? "Disconnecting..."
                        : githubConnected
                          ? "Disconnect"
                          : "Connect"}
                  </button>
                </div>

                {githubError && (
                  <div className="settings-account-error">{githubError}</div>
                )}

                {/* ==================================================
                    SIGN OUT
                ================================================== */}

                <button
                  type="button"
                  className="settings-menu-item settings-signout-button"
                  onClick={() => setShowSignOutModal(true)}
                  disabled={githubConnecting || githubDisconnecting}
                  role="menuitem"
                >
                  <LogOut size={18} />

                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                {/* ==================================================
                    SIGN IN
                ================================================== */}

                <button
                  type="button"
                  className="settings-menu-item"
                  onClick={handleSignIn}
                  role="menuitem"
                >
                  <LogIn size={18} />

                  <span>Sign In</span>
                </button>

                {/* ==================================================
                    CREATE ACCOUNT
                ================================================== */}

                <button
                  type="button"
                  className="settings-menu-item"
                  onClick={handleCreateAccount}
                  role="menuitem"
                >
                  <UserPlus size={18} />

                  <span>Create Account</span>
                </button>
              </>
            )}
          </>
        )}
      </div>

      <SignOutModal
        open={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleConfirmSignOut}
      />
    </>
  );
}

export default SettingsMenu;
