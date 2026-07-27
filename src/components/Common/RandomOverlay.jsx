import { useEffect, useState } from "react";
import { Dices } from "lucide-react";

function RandomOverlay({ visible, status }) {
  const [shouldRender, setShouldRender] = useState(visible);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      setClosing(false);
    } else if (shouldRender) {
      setClosing(true);

      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [visible, shouldRender]);

  if (!shouldRender) return null;

  return (
      <div className={`random-overlay ${closing ? "random-overlay-hide" : ""}`}>
        <div className="random-content">
          <div className="dice-animation">
            <Dices size={56} />
          </div>

        <h2>
          {status === "found"
            ? "Adventure Found"
            : "Finding your next adventure..."}
        </h2>

        <div className="random-loader">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}

export default RandomOverlay;
