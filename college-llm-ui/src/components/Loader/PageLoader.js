import React, { useEffect, useRef, useState } from "react";
import BrandLogo from "../BrandLogo";

/**
 * Full-screen loading page, modelled on the PageLoader in Ark_Engine_Web-main:
 * a fixed overlay that fades in over the whole app, holding a ring spinner and
 * a "Loading…" caption, then fades back out once the next screen is ready.
 *
 * Ark drives it off Next's router — a link click raises it and the pathname
 * settling lowers it. Routing here is a pushState state change, which lands in
 * the same tick, so `minDuration` keeps the overlay up long enough to read as a
 * transition instead of a flicker. `timeout` is the same safety valve Ark uses:
 * the loader always clears itself, even if a screen never signals it is ready.
 */
const PageLoader = ({
  active,
  language = "en",
  minDuration = 620,
  timeout = 4000,
  label,
}) => {
  const [visible, setVisible] = useState(active);
  const shownAtRef = useRef(0);
  const hideTimerRef = useRef(null);
  const failsafeRef = useRef(null);

  useEffect(() => {
    const clearTimers = () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (failsafeRef.current) clearTimeout(failsafeRef.current);
    };

    if (active) {
      clearTimers();
      shownAtRef.current = Date.now();
      setVisible(true);
      failsafeRef.current = setTimeout(() => setVisible(false), timeout);
    } else if (visible) {
      // Serve out the rest of the minimum before dropping the curtain.
      const remaining = Math.max(0, minDuration - (Date.now() - shownAtRef.current));
      hideTimerRef.current = setTimeout(() => setVisible(false), remaining);
    }

    return clearTimers;
    // `visible` is deliberately out of the deps: reacting to it would restart
    // the countdown every time the overlay changes state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, minDuration, timeout]);

  const caption =
    label || (language === "ta" ? "ஏற்றுகிறது…" : "Loading…");

  return (
    <div
      className={`page-loader${visible ? " page-loader-active" : ""}`}
      aria-hidden={!visible}
      role="status"
    >
      <div className="tngov-tricolor-strip page-loader-strip" />

      <div className="engine-wrap">
        <BrandLogo height={52} fallbackSize={24} />
        <div className="spinner" />
        <p className="engine-text">{caption}</p>
      </div>

      <style>{`
        .page-loader {
          position: fixed;
          inset: 0;
          z-index: 100000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #faf8ff;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 0.35s ease, visibility 0.35s ease;
        }

        .page-loader-active {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }

        .page-loader-strip {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
        }

        .engine-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid #e2e8f0;
          border-top-color: #0284c7;
          animation: page-loader-spin 0.7s linear infinite;
        }

        .engine-text {
          margin: 0;
          font-size: 0.8rem;
          font-weight: 500;
          color: #64748b;
          letter-spacing: 0.04em;
        }

        @keyframes page-loader-spin {
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .spinner { animation-duration: 2.4s; }
        }
      `}</style>
    </div>
  );
};

export default PageLoader;
