import React, { useMemo } from "react";
import {
  Video,
  Layers,
  Network,
  MessageSquareText,
  Trophy,
  GraduationCap,
  Sparkles,
  Lock,
  Star,
  ArrowLeft,
  Languages,
} from "lucide-react";
import { motion } from "framer-motion";
import BrandLogo from "../BrandLogo";

/**
 * Preview build of a Duolingo-style "learning pathway" homepage — a single
 * winding trail of stops instead of a grid of cards. Lives at its own route
 * ("/pathway") and is not wired into the default "/" home screen, on purpose:
 * this is here to be looked at and compared, not to replace anything yet.
 */

// Fixed-width coordinate space for the trail graphic — the column itself is
// centered and capped with max-w-sm in the JSX, so this doesn't need to be
// percentage-based; Duolingo's own tree is the same fixed-width approach.
const VIEW_WIDTH = 340;
const STEP_Y = 172;
const TOP_PAD = 90;
const X_PATTERN = [170, 258, 170, 82, 170, 258]; // center, right, center, left, center, right

const STOPS = [
  {
    key: "video",
    icon: Video,
    ring: "#0ea5e9",
    fill: "from-sky-400 to-sky-600",
    shadow: "#0369a1",
    en: "Video Passage",
    ta: "வீடியோ பாடம்",
    line: "Watch, pause, answer",
    lineTa: "பார், நிறுத்து, பதில் சொல்",
  },
  {
    key: "flashcards",
    icon: Layers,
    ring: "#f59e0b",
    fill: "from-amber-400 to-amber-600",
    shadow: "#b45309",
    en: "Flashcards",
    ta: "அட்டைகள்",
    line: "Flip cards and revise",
    lineTa: "திருப்பி நினைவுகூர்",
  },
  {
    key: "mindmap",
    icon: Network,
    ring: "#10b981",
    fill: "from-emerald-400 to-emerald-600",
    shadow: "#047857",
    en: "Mind Map",
    ta: "வரைபடம்",
    line: "See the whole lesson",
    lineTa: "முழுப் பாடமும் ஒரே பார்வையில்",
  },
  {
    key: "chat",
    icon: MessageSquareText,
    ring: "#0284c7",
    fill: "from-brand-400 to-brand-600",
    shadow: "#075985",
    en: "AI Chatbot",
    ta: "AI உதவியாளர்",
    line: "Ask any doubt",
    lineTa: "எந்தச் சந்தேகமும் கேள்",
  },
  {
    key: "kahoot",
    icon: Trophy,
    ring: "#e11d48",
    fill: "from-rose-400 to-rose-600",
    shadow: "#9f1239",
    en: "Live Quiz",
    ta: "வினாடி வினா",
    line: "Play a fun quiz game",
    lineTa: "விளையாட்டாக பயில்",
  },
  {
    key: "test",
    icon: GraduationCap,
    ring: "#4338ca",
    fill: "from-indigo-500 to-indigo-700",
    shadow: "#312e81",
    en: "Test Module",
    ta: "தேர்வு தளம்",
    line: "The last step",
    lineTa: "இறுதிச் சோதனை",
  },
];

/** Smooth S-curve through the stop centers: cubic beziers with control
 * points held at the midpoint height between each pair, so the line bends
 * instead of zig-zagging with hard corners. */
function buildPathD(points) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midY = (prev.y + curr.y) / 2;
    d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
  }
  return d;
}

const TrailNode = ({ stop, index, x, y, isNext, onActivate, isTa }) => {
  const Icon = stop.icon;
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: x, top: y, transform: "translate(-50%, -50%)", width: 120 }}
    >
      {isNext && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg"
        >
          {isTa ? "இங்கே தொடங்கு" : "Start here"}
        </motion.div>
      )}

      <motion.button
        type="button"
        onClick={() => onActivate(stop.key)}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.08, type: "spring", stiffness: 260, damping: 18 }}
        whileHover={{ y: -4 }}
        whileTap={{ y: 2 }}
        className={`relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br text-white ${stop.fill} ${
          isNext ? "animate-bounce-slow" : ""
        }`}
        style={{ boxShadow: `0 7px 0 ${stop.shadow}, 0 12px 20px rgba(15,23,42,0.25)` }}
      >
        {isNext && (
          <span
            className="absolute inset-[-8px] rounded-full opacity-60"
            style={{ boxShadow: `0 0 0 4px ${stop.ring}55` }}
          />
        )}
        <Icon size={30} strokeWidth={2.2} />
        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-white text-[11px] font-black text-slate-700 shadow">
          {index + 1}
        </span>
      </motion.button>

      <div className="mt-2.5 text-center">
        <p className="text-xs font-extrabold leading-tight text-slate-800">
          {isTa ? stop.ta : stop.en}
        </p>
        <p className="mt-0.5 text-[10px] font-medium leading-tight text-slate-400">
          {isTa ? stop.lineTa : stop.line}
        </p>
      </div>
    </div>
  );
};

const HomePathway = ({ onNavigate, onNavigateToTest, language = "en", onToggleLanguage }) => {
  const isTa = language === "ta";

  const points = useMemo(
    () => STOPS.map((_, i) => ({ x: X_PATTERN[i % X_PATTERN.length], y: TOP_PAD + i * STEP_Y })),
    []
  );
  const pathD = useMemo(() => buildPathD(points), [points]);
  const viewHeight = TOP_PAD + (STOPS.length - 1) * STEP_Y + 140;

  const handleActivate = (key) => {
    if (key === "video") onNavigateToTest("video");
    else if (key === "test") onNavigateToTest("student");
    else if (key === "flashcards") onNavigate("/flashcards");
    else if (key === "mindmap") onNavigate("/mindmap");
    else if (key === "chat") onNavigate("/chat");
    else if (key === "kahoot") onNavigate("/kahoot");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eff9ff] to-[#f8fafc] font-sans text-slate-900">
      <div className="tngov-tricolor-strip fixed left-0 right-0 top-0 z-50" />

      <header className="sticky top-[3px] z-40 border-b border-brand-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <BrandLogo height={30} />
            <span className="hidden rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700 sm:inline">
              {isTa ? "முன்னோட்டம்" : "Preview"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate("/")}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-600 transition-all hover:border-brand-300 hover:text-brand-700 active:scale-95"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">{isTa ? "பழைய முகப்பு" : "Classic Home"}</span>
            </button>
            <button
              onClick={onToggleLanguage}
              className="flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-2.5 py-2 text-xs font-bold text-brand-700 transition-all hover:bg-brand-100 active:scale-95"
            >
              <Languages size={14} />
              <span>{isTa ? "EN" : "த"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-cyan-500 text-white shadow-pop-lg">
            <Sparkles size={26} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display sm:text-3xl">
            {isTa ? "உங்கள் கற்றல் பாதை" : "Your Learning Path"}
          </h1>
          <p className="mx-auto mt-1.5 max-w-sm text-xs text-slate-500 sm:text-sm">
            {isTa
              ? "ஒரு நிலையத்திலிருந்து அடுத்ததற்குச் செல்லுங்கள் — வீடியோவிலிருந்து இறுதித் தேர்வு வரை."
              : "Go step by step — from the video to the final test."}
          </p>
        </div>

        <div className="relative mx-auto" style={{ width: VIEW_WIDTH, height: viewHeight }}>
          <svg
            width={VIEW_WIDTH}
            height={viewHeight}
            viewBox={`0 0 ${VIEW_WIDTH} ${viewHeight}`}
            className="absolute inset-0"
          >
            <path
              d={pathD}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="2 22"
            />
          </svg>

          {STOPS.map((stop, i) => (
            <TrailNode
              key={stop.key}
              stop={stop}
              index={i}
              x={points[i].x}
              y={points[i].y}
              isNext={i === 0}
              onActivate={handleActivate}
              isTa={isTa}
            />
          ))}

          {/* Finish flag under the last stop */}
          <div
            className="absolute flex flex-col items-center text-slate-300"
            style={{ left: points[points.length - 1].x, top: points[points.length - 1].y + 110, transform: "translateX(-50%)" }}
          >
            <Star size={22} className="fill-amber-300 text-amber-400" />
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider">
              {isTa ? "இலக்கு" : "Finish"}
            </p>
          </div>
        </div>

        {/* Lower-priority utility links, out of the way of the trail itself */}
        <div className="mx-auto mt-16 flex max-w-xs items-center justify-center gap-2">
          <button
            onClick={() => onNavigate("/userresponse")}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500 transition-all hover:border-brand-300 hover:text-brand-700"
          >
            <Lock size={11} />
            {isTa ? "பின்னூட்டம் (ஆசிரியர்)" : "Feedback (staff)"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default HomePathway;
