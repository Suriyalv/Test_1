import React, { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebase";
import BarChart from "../shared/BarChart";
import {
  computeCategoryAccuracy,
  computeStrengthsWeaknesses,
  computeOverview,
  buildTimeline,
} from "./progressAggregation";
import {
  ArrowLeft,
  LineChart,
  RefreshCw,
  GraduationCap,
  Layers,
  Video,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react";

const MODULE_ICON = {
  test: GraduationCap,
  flashcards: Layers,
  video: Video,
  "concept-bridge": Lightbulb,
};

const MODULE_LABEL_EN = {
  test: "Test",
  flashcards: "Flashcards",
  video: "Video Lesson",
  "concept-bridge": "Concept Bridge",
  kahoot: "Live Quiz",
  mindmap: "Mind Map",
};

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
      <Icon size={13} />
      {label}
    </div>
    <div className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900">{value}</div>
  </div>
);

const MyProgress = ({ onBackToHome, language = "en" }) => {
  const isTa = language === "ta";
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEvents = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      // No orderBy here on purpose: an equality filter (uid) plus ordering on
      // a different field (timestamp) would need a composite Firestore index.
      // Sorting happens client-side after the fetch instead.
      const snap = await getDocs(query(collection(db, "activityLog"), where("uid", "==", user.uid)));
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Failed to load activity:", err);
      setError(isTa ? "செயல்பாட்டை ஏற்ற முடியவில்லை." : "Could not load your progress. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isTa]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const overview = computeOverview(events);
  const categoryAccuracy = computeCategoryAccuracy(events);
  const { strengths, weaknesses } = computeStrengthsWeaknesses(categoryAccuracy);
  const timeline = buildTimeline(events);

  const moduleLabel = (m) =>
    isTa
      ? { test: "தேர்வு", flashcards: "அட்டைகள்", video: "வீடியோ பாடம்", "concept-bridge": "கருத்து பாலம்", kahoot: "வினாடி வினா", mindmap: "வரைபடம்" }[m] || m
      : MODULE_LABEL_EN[m] || m;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-16 font-sans text-slate-900">
      <div className="tngov-tricolor-strip fixed left-0 right-0 top-0 z-50"></div>

      <header className="sticky top-[3px] z-40 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-2.5 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200 hover:text-brand-700 active:scale-95"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">{isTa ? "முகப்பு" : "Home"}</span>
            </button>
          )}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-brand-600">
              {isTa ? "தனிப்பயன் கண்காணிப்பு" : "Your learning"}
            </div>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
              {isTa ? "என் முன்னேற்றம்" : "My Progress"}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={loadEvents}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 hover:text-brand-700 active:scale-95"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-brand-600" : ""} />
          {isTa ? "புதுப்பிக்க" : "Refresh"}
        </button>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 pt-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Overview stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard label={isTa ? "தேர்வுகள்" : "Tests Taken"} value={overview.testsTaken} icon={GraduationCap} />
          <StatCard
            label={isTa ? "சராசரி துல்லியம்" : "Average score"}
            value={overview.avgAccuracy === null ? "—" : `${overview.avgAccuracy}%`}
            icon={LineChart}
          />
          <StatCard label={isTa ? "அட்டை திருப்புதல்" : "Flashcards studied"} value={overview.flashcardsReviewed} icon={Layers} />
          <StatCard label={isTa ? "வீடியோ வினாக்கள்" : "Video Questions"} value={overview.videoQuestionsAnswered} icon={Video} />
          <StatCard label={isTa ? "ஒப்புமைகள்" : "Examples made"} value={overview.analogiesSubmitted} icon={Lightbulb} />
        </div>

        {/* Category accuracy chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="mb-3 text-sm font-bold text-slate-900">
            {isTa ? "பாடப்பிரிவு வாரியாக துல்லியம்" : "Score for each test type"}
          </h2>
          <BarChart data={categoryAccuracy} valueLabel="%" />
        </div>

        {/* Strengths / weaknesses */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-extrabold text-emerald-800">
              <TrendingUp size={16} />
              {isTa ? "பலம்" : "Strong topics"}
            </h3>
            {strengths.length === 0 ? (
              <p className="text-xs text-emerald-700/70">
                {isTa ? "இன்னும் தரவு இல்லை." : "Not enough practice yet. Keep going!"}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {strengths.map((s) => (
                  <li key={s.label} className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                    <span>{s.label}</span>
                    <span>{s.value}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-extrabold text-amber-800">
              <TrendingDown size={16} />
              {isTa ? "மேம்படுத்த வேண்டியவை" : "Practise more"}
            </h3>
            {weaknesses.length === 0 ? (
              <p className="text-xs text-amber-700/70">
                {isTa ? "தற்போது எதுவும் இல்லை — நன்று!" : "No weak topics right now. Well done!"}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {weaknesses.map((w) => (
                  <li key={w.label} className="flex items-center justify-between text-xs font-semibold text-amber-900">
                    <span>{w.label}</span>
                    <span>{w.value}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent activity timeline */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-900">
            <Clock size={15} />
            {isTa ? "சமீபத்திய செயல்பாடு" : "Recent Activity"}
          </h2>
          {timeline.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              {isTa ? "இன்னும் செயல்பாடு பதிவு செய்யப்படவில்லை." : "No practice yet. Open a module to start."}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {timeline.map((e) => {
                const Icon = MODULE_ICON[e.module] || Clock;
                return (
                  <li key={e.id} className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                    <Icon size={14} className="shrink-0 text-brand-600" />
                    <span className="font-semibold text-slate-700">{moduleLabel(e.module)}</span>
                    <span className="text-slate-400">·</span>
                    <span className="flex-1 truncate text-slate-500">{e.action}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyProgress;
