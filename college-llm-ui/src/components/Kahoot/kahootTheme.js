import { Triangle, Diamond, Circle, Square } from "lucide-react";

// The four classic Kahoot answer tiles: a fixed colour + shape pairing so
// students recognise "the red triangle" or "the blue diamond" at a glance,
// independent of the option text itself.
export const KAHOOT_TILES = [
  { icon: Triangle, bg: "bg-red-500", hoverBg: "hover:bg-red-600", ring: "ring-red-300", label: "Triangle" },
  { icon: Diamond, bg: "bg-blue-500", hoverBg: "hover:bg-blue-600", ring: "ring-blue-300", label: "Diamond" },
  { icon: Circle, bg: "bg-amber-400", hoverBg: "hover:bg-amber-500", ring: "ring-amber-300", label: "Circle" },
  { icon: Square, bg: "bg-emerald-500", hoverBg: "hover:bg-emerald-600", ring: "ring-emerald-300", label: "Square" },
];

// Kahoot-style scoring: correct answers earn up to 1000 points, scaled down
// the longer the student takes to answer (fast + correct = full marks).
export const scoreForAnswer = (isCorrect, timeTakenSec, timeLimitSec) => {
  if (!isCorrect) return 0;
  const speedRatio = Math.max(0, 1 - timeTakenSec / Math.max(timeLimitSec, 1));
  return Math.round(500 + 500 * speedRatio);
};
