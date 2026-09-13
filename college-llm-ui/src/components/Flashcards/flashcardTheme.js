// Accent palette shared by the student card deck and the admin card builder.
// Faces are light and vibrant, so the type on top of them is a deep tone of the
// same hue rather than white. Class names are written out in full so Tailwind's
// scanner keeps them in the build.

export const ACCENTS = {
  blue: {
    label: "Blue",
    swatch: "bg-gradient-to-br from-sky-200 via-blue-300 to-indigo-300",
    face: "from-sky-200 via-blue-300 to-indigo-300",
    title: "text-blue-950",
    muted: "text-blue-900/70",
    badge: "bg-white/70 text-blue-900",
    glow: "shadow-blue-300/50",
    chip: "bg-blue-50 text-blue-700 border-blue-200",
    ring: "group-hover:border-blue-400",
  },
  violet: {
    label: "Violet",
    swatch: "bg-gradient-to-br from-violet-200 via-purple-300 to-fuchsia-300",
    face: "from-violet-200 via-purple-300 to-fuchsia-300",
    title: "text-purple-950",
    muted: "text-purple-900/70",
    badge: "bg-white/70 text-purple-900",
    glow: "shadow-purple-300/50",
    chip: "bg-violet-50 text-violet-700 border-violet-200",
    ring: "group-hover:border-violet-400",
  },
  emerald: {
    label: "Emerald",
    swatch: "bg-gradient-to-br from-emerald-200 via-green-300 to-teal-300",
    face: "from-emerald-200 via-green-300 to-teal-300",
    title: "text-emerald-950",
    muted: "text-emerald-900/70",
    badge: "bg-white/70 text-emerald-900",
    glow: "shadow-emerald-300/50",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ring: "group-hover:border-emerald-400",
  },
  amber: {
    label: "Amber",
    swatch: "bg-gradient-to-br from-yellow-200 via-amber-300 to-orange-300",
    face: "from-yellow-200 via-amber-300 to-orange-300",
    title: "text-amber-950",
    muted: "text-amber-900/70",
    badge: "bg-white/70 text-amber-900",
    glow: "shadow-amber-300/50",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    ring: "group-hover:border-amber-400",
  },
  rose: {
    label: "Rose",
    swatch: "bg-gradient-to-br from-rose-200 via-pink-300 to-fuchsia-300",
    face: "from-rose-200 via-pink-300 to-fuchsia-300",
    title: "text-rose-950",
    muted: "text-rose-900/70",
    badge: "bg-white/70 text-rose-900",
    glow: "shadow-rose-300/50",
    chip: "bg-rose-50 text-rose-700 border-rose-200",
    ring: "group-hover:border-rose-400",
  },
  cyan: {
    label: "Cyan",
    swatch: "bg-gradient-to-br from-cyan-200 via-sky-300 to-blue-300",
    face: "from-cyan-200 via-sky-300 to-blue-300",
    title: "text-cyan-950",
    muted: "text-cyan-900/70",
    badge: "bg-white/70 text-cyan-900",
    glow: "shadow-cyan-300/50",
    chip: "bg-cyan-50 text-cyan-700 border-cyan-200",
    ring: "group-hover:border-cyan-400",
  },
  indigo: {
    label: "Indigo",
    swatch: "bg-gradient-to-br from-indigo-200 via-indigo-300 to-violet-300",
    face: "from-indigo-200 via-indigo-300 to-violet-300",
    title: "text-indigo-950",
    muted: "text-indigo-900/70",
    badge: "bg-white/70 text-indigo-900",
    glow: "shadow-indigo-300/50",
    chip: "bg-indigo-50 text-indigo-700 border-indigo-200",
    ring: "group-hover:border-indigo-400",
  },
  teal: {
    label: "Teal",
    swatch: "bg-gradient-to-br from-teal-200 via-emerald-300 to-cyan-300",
    face: "from-teal-200 via-emerald-300 to-cyan-300",
    title: "text-teal-950",
    muted: "text-teal-900/70",
    badge: "bg-white/70 text-teal-900",
    glow: "shadow-teal-300/50",
    chip: "bg-teal-50 text-teal-700 border-teal-200",
    ring: "group-hover:border-teal-400",
  },
};

export const ACCENT_KEYS = Object.keys(ACCENTS);

export const getAccent = (name) => ACCENTS[name] || ACCENTS.blue;
