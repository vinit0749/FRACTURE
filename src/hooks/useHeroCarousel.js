import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SLIDE_DURATION = 7000;
const PROGRESS_INTERVAL = 40;

export default function useHeroCarousel(heroImages = []) {
  const images = useMemo(() => {
    if (!Array.isArray(heroImages)) return [];

    return heroImages.filter(Boolean);
  }, [heroImages]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const slideTimer = useRef(null);
  const progressTimer = useRef(null);

  /* -------------------------- */
  /* preload images             */
  /* -------------------------- */

  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  /* -------------------------- */
  /* helpers                    */
  /* -------------------------- */

  const clearTimers = useCallback(() => {
    clearInterval(slideTimer.current);
    clearInterval(progressTimer.current);
  }, []);

  const restartTimers = useCallback(() => {
    clearTimers();

    setProgress(0);

    if (images.length <= 1) return;

    slideTimer.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, SLIDE_DURATION);

    progressTimer.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 100 / (SLIDE_DURATION / PROGRESS_INTERVAL);

        return next >= 100 ? 100 : next;
      });
    }, PROGRESS_INTERVAL);
  }, [images, clearTimers]);

  /* -------------------------- */
  /* reset when images change   */
  /* -------------------------- */

  useEffect(() => {
    setCurrentIndex(0);
  }, [images]);

  /* -------------------------- */
  /* restart every slide        */
  /* -------------------------- */

  useEffect(() => {
    restartTimers();

    return clearTimers;
  }, [currentIndex, restartTimers, clearTimers]);

  /* -------------------------- */
  /* navigation                 */
  /* -------------------------- */

  const next = useCallback(() => {
    if (images.length <= 1) return;

    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images]);

  const previous = useCallback(() => {
    if (images.length <= 1) return;

    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images]);

  const goTo = useCallback(
    (index) => {
      if (index < 0 || index >= images.length) return;

      setCurrentIndex(index);
    },
    [images],
  );

  /* -------------------------- */
  /* keyboard                   */
  /* -------------------------- */

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "ArrowRight") {
        next();
      }

      if (e.key === "ArrowLeft") {
        previous();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [next, previous]);

  /* -------------------------- */
  /* restart after manual nav   */
  /* -------------------------- */

  const handleNext = () => {
    next();
    restartTimers();
  };

  const handlePrevious = () => {
    previous();
    restartTimers();
  };

  const handleGoTo = (index) => {
    goTo(index);
    restartTimers();
  };

  return {
    currentImage: images[currentIndex] || null,
    currentIndex,
    totalImages: images.length,
    progress,

    next: handleNext,
    previous: handlePrevious,
    goTo: handleGoTo,
  };
}
