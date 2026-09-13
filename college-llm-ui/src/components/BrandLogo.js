import React, { useState } from "react";
import { Sparkles } from "lucide-react";

/**
 * The platform's logo.
 *
 * The artwork is served from `public/` rather than imported, so a missing file
 * is a runtime 404 instead of a build error — and the mark below stands in until
 * the real file is dropped at `college-llm-ui/public/ark-logo.png`.
 */
export const LOGO_SRC = `${process.env.PUBLIC_URL}/ark-logo.png`;

/**
 * Where the wordmark actually sits inside the file, as fractions of the canvas.
 *
 * ark-logo.png is a 1050x600 canvas holding a 793x267 wordmark, so more than
 * half of its height is transparent padding. Rendering the file directly means
 * the visible mark comes out at ~44% of whatever height is asked for. These
 * numbers let the component crop the padding away, so `height` below is the
 * height of the wordmark itself rather than of the empty canvas around it.
 *
 * Swapping in a differently-padded logo file means re-measuring these.
 */
const CANVAS_RATIO = 1050 / 600;
const CONTENT = {
  x: 148 / 1050,
  y: 163 / 600,
  w: 793 / 1050,
  h: 267 / 600,
};

const BrandLogo = ({ height = 32, className = "", fallbackSize = 18 }) => {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-600 text-white shadow-sm ${className}`}
        style={{ height, width: height }}
      >
        <Sparkles size={fallbackSize} />
      </div>
    );
  }

  // Blow the image up so its wordmark measures `height`, then slide the
  // transparent margins out of the window.
  const imageHeight = height / CONTENT.h;
  const imageWidth = imageHeight * CANVAS_RATIO;
  const boxWidth = CONTENT.w * imageWidth;

  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden ${className}`}
      style={{ height, width: boxWidth }}
    >
      <img
        src={LOGO_SRC}
        alt="ArkEngine Technologies"
        onError={() => setBroken(true)}
        draggable="false"
        style={{
          position: "absolute",
          height: imageHeight,
          width: imageWidth,
          left: -CONTENT.x * imageWidth,
          top: -CONTENT.y * imageHeight,
          maxWidth: "none",
        }}
      />
    </span>
  );
};

export default BrandLogo;
