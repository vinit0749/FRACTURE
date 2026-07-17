import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

function SettingsMenu({ open }) {
  const { theme, setTheme } = useTheme();

  const [page, setPage] = useState("settings");

  if (!open) return null;

  return (
    <div className="settings-menu">
      {page === "settings" && (
        <>
          <div className="settings-menu-title">Settings</div>

          <div className="settings-current-theme">Current Theme: {theme}</div>

          <button
            className="settings-menu-item"
            onClick={() => setPage("appearance")}
          >
            <span>🎨</span>

            <span>Appearance</span>

            <span className="settings-arrow">›</span>
          </button>
        </>
      )}

      {page === "appearance" && (
        <>
          <button
            className="settings-back-button"
            onClick={() => setPage("settings")}
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
          >
            Midnight
          </button>

          <button
            className={`settings-theme-option ${
              theme === "obsidian" ? "active" : ""
            }`}
            onClick={() => setTheme("obsidian")}
          >
            Obsidian
          </button>

          <button
            className={`settings-theme-option ${
              theme === "crimson" ? "active" : ""
            }`}
            onClick={() => setTheme("crimson")}
          >
            Crimson
          </button>

          <button
            className={`settings-theme-option ${
              theme === "emerald" ? "active" : ""
            }`}
            onClick={() => setTheme("emerald")}
          >
            Emerald
          </button>

          <button
            className={`settings-theme-option ${
              theme === "violet" ? "active" : ""
            }`}
            onClick={() => setTheme("violet")}
          >
            Violet
          </button>
        </>
      )}
    </div>
  );
}

export default SettingsMenu;
