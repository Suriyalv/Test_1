// Branch palette for the concept map.
//
// The nodes and the connecting curves are painted with these literal colours
// rather than Tailwind classes: the connectors are SVG strokes, and keeping the
// node fill on the same values guarantees a branch and its curve always match.

export const BRANCHES = {
  blue: {
    label: "Blue",
    stroke: "#2563eb",
    tint: "#eff6ff",
    border: "#bfdbfe",
    text: "#1e3a8a",
    strong: "#1d4ed8",
    soft: "#dbeafe",
  },
  violet: {
    label: "Violet",
    stroke: "#7c3aed",
    tint: "#f5f3ff",
    border: "#ddd6fe",
    text: "#4c1d95",
    strong: "#6d28d9",
    soft: "#ede9fe",
  },
  emerald: {
    label: "Emerald",
    stroke: "#059669",
    tint: "#ecfdf5",
    border: "#a7f3d0",
    text: "#064e3b",
    strong: "#047857",
    soft: "#d1fae5",
  },
  amber: {
    label: "Amber",
    stroke: "#d97706",
    tint: "#fffbeb",
    border: "#fde68a",
    text: "#78350f",
    strong: "#b45309",
    soft: "#fef3c7",
  },
  rose: {
    label: "Rose",
    stroke: "#e11d48",
    tint: "#fff1f2",
    border: "#fecdd3",
    text: "#881337",
    strong: "#be123c",
    soft: "#ffe4e6",
  },
  cyan: {
    label: "Cyan",
    stroke: "#0891b2",
    tint: "#ecfeff",
    border: "#a5f3fc",
    text: "#164e63",
    strong: "#0e7490",
    soft: "#cffafe",
  },
  indigo: {
    label: "Indigo",
    stroke: "#4f46e5",
    tint: "#eef2ff",
    border: "#c7d2fe",
    text: "#312e81",
    strong: "#4338ca",
    soft: "#e0e7ff",
  },
  teal: {
    label: "Teal",
    stroke: "#0d9488",
    tint: "#f0fdfa",
    border: "#99f6e4",
    text: "#134e4a",
    strong: "#0f766e",
    soft: "#ccfbf1",
  },
};

export const BRANCH_KEYS = Object.keys(BRANCHES);

export const getBranch = (name) => BRANCHES[name] || BRANCHES.blue;

// The central topic is deliberately outside the branch palette — it is the one
// dark node on the canvas, so the eye lands on it first.
export const ROOT_THEME = {
  stroke: "#0284c7",
  fill: "#0284c7",
  text: "#ffffff",
};
