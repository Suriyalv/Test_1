// Modern vibrant curriculum palette for the concept mind map constellation.
// Distinct branch colours empower students to visually anchor topics and remember connections.

export const BRANCHES = {
  blue: {
    label: "Blue",
    stroke: "#2563EB", // royal blue
    tint: "#EFF6FF",   // blue-50
    border: "#BFDBFE", // blue-200
    text: "#1E3A8A",   // blue-900
    strong: "#1D4ED8", // blue-700
    soft: "#DBEAFE",   // blue-100
    glow: "rgba(37, 99, 235, 0.35)",
  },
  violet: {
    label: "Violet",
    stroke: "#8B5CF6", // purple
    tint: "#F5F3FF",   // violet-50
    border: "#DDD6FE", // violet-200
    text: "#4C1D95",   // violet-900
    strong: "#7C3AED", // violet-700
    soft: "#EDE9FE",   // violet-100
    glow: "rgba(139, 92, 246, 0.35)",
  },
  emerald: {
    label: "Emerald",
    stroke: "#10B981", // emerald
    tint: "#ECFDF5",   // emerald-50
    border: "#A7F3D0", // emerald-200
    text: "#064E3B",   // emerald-900
    strong: "#059669", // emerald-700
    soft: "#D1FAE5",   // emerald-100
    glow: "rgba(16, 185, 129, 0.35)",
  },
  amber: {
    label: "Amber",
    stroke: "#F59E0B", // amber
    tint: "#FFFBEB",   // amber-50
    border: "#FDE68A", // amber-200
    text: "#78350F",   // amber-900
    strong: "#D97706", // amber-700
    soft: "#FEF3C7",   // amber-100
    glow: "rgba(245, 158, 11, 0.35)",
  },
  rose: {
    label: "Rose",
    stroke: "#F43F5E", // rose
    tint: "#FFF1F2",   // rose-50
    border: "#FECDD3", // rose-200
    text: "#881337",   // rose-900
    strong: "#E11D48", // rose-700
    soft: "#FFE4E6",   // rose-100
    glow: "rgba(244, 63, 94, 0.35)",
  },
  cyan: {
    label: "Cyan",
    stroke: "#06B6D4", // cyan
    tint: "#ECFEFF",   // cyan-50
    border: "#A5F3FC", // cyan-200
    text: "#164E63",   // cyan-900
    strong: "#0891B2", // cyan-700
    soft: "#CFFAFE",   // cyan-100
    glow: "rgba(6, 182, 212, 0.35)",
  },
  indigo: {
    label: "Indigo",
    stroke: "#6366F1", // indigo
    tint: "#EEF2FF",   // indigo-50
    border: "#C7D2FE", // indigo-200
    text: "#312E81",   // indigo-900
    strong: "#4F46E5", // indigo-700
    soft: "#E0E7FF",   // indigo-100
    glow: "rgba(99, 102, 241, 0.35)",
  },
  teal: {
    label: "Teal",
    stroke: "#14B8A6", // teal
    tint: "#F0FDFA",   // teal-50
    border: "#99F6E4", // teal-200
    text: "#134E4A",   // teal-900
    strong: "#0D9488", // teal-700
    soft: "#CCFBF1",   // teal-100
    glow: "rgba(20, 184, 166, 0.35)",
  },
};

export const BRANCH_KEYS = Object.keys(BRANCHES);

export const getBranch = (name) => BRANCHES[name] || BRANCHES.blue;

// The central topic is deep obsidian slate with crisp contrast and illumination glow
export const ROOT_THEME = {
  stroke: "#1E293B",
  fill: "#0F172A",
  text: "#FFFFFF",
  glow: "rgba(15, 23, 42, 0.35)",
};
