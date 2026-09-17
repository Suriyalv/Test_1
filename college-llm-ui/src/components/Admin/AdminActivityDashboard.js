import React, { useState, useEffect, useCallback } from "react";
import { fetchRecentActivity, countByModule, countByUser } from "./activityQueries";
import { sortByTimestampDesc } from "../Progress/progressAggregation";
import BarChart from "../shared/BarChart";
import ActivityTable from "./ActivityTable";
import {
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  Activity,
  Users,
  Clock,
  Layers,
  GraduationCap,
  Video,
  Lightbulb,
} from "lucide-react";

const MODULE_ICON = {
  test: GraduationCap,
  flashcards: Layers,
  video: Video,
  "concept-bridge": Lightbulb,
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

/**
 * Enterprise-dashboard surface — neutral cards, restrained single-accent
 * chart, real hierarchy. Deliberately not the vibrant student-module
 * palette; this page is for monitoring, not for a student to enjoy.
 */
const AdminActivityDashboard = ({ onBackToHome, language = "en" }) => {
  const isTa = language === "ta";
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchRecentActivity(500);
      setEvents(data);
    } catch (err) {
      console.error("Failed to load activity log:", err);
      setError(isTa ? "செயல்பாட்டுப் பதிவை ஏற்ற முடியவில்லை." : "Could not load the activity log.");
    } finally {
      setLoading(false);
    }
  }, [isTa]);

  useEffect(() => {
    load();
  }, [load]);

  const moduleCounts = countByModule(events);
  const userCounts = countByUser(events);
  const recent = sortByTimestampDesc(events).slice(0, 20);
  const uniqueStudents = new Set(events.map((e) => e.uid)).size;

  const formatTime = (ts) => {
    const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null;
    if (!d) return "—";
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16 font-sans text-slate-900">
      <div className="tngov-tricolor-strip fixed left-0 right-0 top-0 z-50"></div>

      <header className="sticky top-[3px] z-40 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 shadow-xs">
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">{isTa ? "முகப்பு" : "Home"}</span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <ShieldCheck size={12} />
              {isTa ? "நிர்வாகம் மட்டும்" : "Admin only"}
            </div>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
              {isTa ? "செயல்பாட்டு கண்காணிப்பு" : "Activity Monitoring"}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={load}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {isTa ? "புதுப்பிக்க" : "Refresh"}
        </button>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 pt-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label={isTa ? "மொத்த நிகழ்வுகள்" : "Total Events"} value={events.length} icon={Activity} />
          <StatCard label={isTa ? "செயலில் உள்ள மாணவர்கள்" : "Active Students"} value={uniqueStudents} icon={Users} />
          <StatCard
            label={isTa ? "அதிகம் பயன்படுத்தும் தொகுதி" : "Most-Used Module"}
            value={moduleCounts[0]?.label || "—"}
            icon={Layers}
          />
          <StatCard label={isTa ? "கடைசி நிகழ்வு" : "Latest Event"} value={formatTime(recent[0]?.timestamp)} icon={Clock} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="mb-3 text-sm font-bold text-slate-900">
            {isTa ? "தொகுதி வாரியாக நிகழ்வுகள்" : "Events per Module"}
          </h2>
          <BarChart data={moduleCounts} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="mb-3 text-sm font-bold text-slate-900">
            {isTa ? "மாணவர் வாரியான செயல்பாடு" : "Per-Student Activity"}
          </h2>
          <ActivityTable rows={userCounts} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="mb-3 text-sm font-bold text-slate-900">
            {isTa ? "சமீபத்திய நிகழ்வுகள்" : "Recent Events"}
          </h2>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              {isTa ? "இன்னும் பதிவு எதுவும் இல்லை." : "Nothing logged yet."}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {recent.map((e) => {
                const Icon = MODULE_ICON[e.module] || Activity;
                return (
                  <li
                    key={e.id}
                    className="flex flex-wrap items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
                  >
                    <Icon size={14} className="shrink-0 text-slate-500" />
                    <span className="font-semibold text-slate-800">{e.username || "—"}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-600">{e.module}</span>
                    <span className="text-slate-300">·</span>
                    <span className="flex-1 truncate text-slate-500">{e.action}</span>
                    <span className="shrink-0 text-slate-400">{formatTime(e.timestamp)}</span>
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

export default AdminActivityDashboard;
