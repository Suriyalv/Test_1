import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  fetchActivityForRecords,
  fetchUserProfiles,
  buildStudentRecords,
  filterSince,
  recordsToCsv,
  moduleLabel,
} from "./studentRecords";
import ProfilePage from "../Profile/ProfilePage";
import {
  prePostSummary,
  improvement,
  prePostCsv,
  retakeAllowed,
  fetchAllRetakeGrants,
  setRetakeGrant,
  PREPOST_MODULE,
} from "../TestTaking/prePostResults";
import { auth } from "../../firebase";
import {
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  Users,
  LogIn,
  GraduationCap,
  Target,
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  Activity,
  FileText,
  ClipboardCheck,
  RotateCcw,
} from "lucide-react";

const RANGES = [
  { key: "all", en: "All time", ta: "எல்லா நேரமும்", days: null },
  { key: "today", en: "Today", ta: "இன்று", days: 0 },
  { key: "7", en: "Last 7 days", ta: "கடந்த 7 நாட்கள்", days: 7 },
  { key: "30", en: "Last 30 days", ta: "கடந்த 30 நாட்கள்", days: 30 },
];

const sinceFor = (rangeKey) => {
  const range = RANGES.find((r) => r.key === rangeKey);
  if (!range || range.days === null) return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - range.days);
  return d;
};

const formatTime = (d) =>
  d
    ? d.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
      <Icon size={13} />
      {label}
    </div>
    <div className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900">{value}</div>
  </div>
);

/** Colored percentage pill: green ≥75, amber 50–74, red <50. */
const ScoreBadge = ({ value }) => {
  if (value === null || value === undefined) return <span className="text-slate-300">—</span>;
  const tone =
    value >= 75
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : value >= 50
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";
  return (
    <span className={`inline-block min-w-[3rem] rounded-md border px-1.5 py-0.5 text-center font-bold ${tone}`}>
      {value}%
    </span>
  );
};

const StudentDetail = ({ rec, isTa, onOpenReport }) => (
  <div className="space-y-4 border-t border-slate-200 bg-slate-50 px-4 py-4">
    <div className="flex justify-end">
      <button
        type="button"
        onClick={() => onOpenReport(rec.uid)}
        className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
      >
        <FileText size={14} />
        {isTa ? "முழு அறிக்கை — பலம் & பலவீனம்" : "Full report — strengths & weaknesses"}
      </button>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
          {isTa ? "பயன்படுத்திய தொகுதிகள்" : "Modules used (times)"}
        </h4>
        {Object.keys(rec.modules).length === 0 ? (
          <p className="text-xs text-slate-400">—</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(rec.modules)
              .sort((a, b) => b[1] - a[1])
              .map(([m, n]) => (
                <span key={m} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                  {moduleLabel(m)} <span className="font-bold text-slate-900">×{n}</span>
                </span>
              ))}
          </div>
        )}
        {rec.chatQuestions > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            {isTa ? "AI அரட்டை கேள்விகள்" : "AI chat questions asked"}: <b>{rec.chatQuestions}</b>
          </p>
        )}
      </div>
      <div>
        <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
          {isTa ? "சமீபத்திய உள்நுழைவுகள்" : "Recent logins"}
        </h4>
        {rec.logins.length === 0 ? (
          <p className="text-xs text-slate-400">{isTa ? "பதிவு இல்லை" : "No login recorded in this period"}</p>
        ) : (
          <ul className="space-y-0.5 text-xs text-slate-600">
            {rec.logins.slice(0, 6).map((d, i) => (
              <li key={i}>{formatTime(d)}</li>
            ))}
            {rec.logins.length > 6 && <li className="text-slate-400">+{rec.logins.length - 6} more</li>}
          </ul>
        )}
      </div>
    </div>

    <div>
      <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {isTa ? "மதிப்பெண்கள்" : "Results & marks"} ({rec.results.length})
      </h4>
      {rec.results.length === 0 ? (
        <p className="text-xs text-slate-400">{isTa ? "இன்னும் முடிவுகள் இல்லை." : "No scored results yet."}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400">
                <th className="px-3 py-2 font-bold uppercase tracking-wide">{isTa ? "நேரம்" : "Date & time"}</th>
                <th className="px-3 py-2 font-bold uppercase tracking-wide">{isTa ? "செயல்பாடு" : "Activity"}</th>
                <th className="px-3 py-2 font-bold uppercase tracking-wide">{isTa ? "மதிப்பெண்" : "Score"}</th>
                <th className="px-3 py-2 font-bold uppercase tracking-wide">{isTa ? "விவரம்" : "Details"}</th>
              </tr>
            </thead>
            <tbody>
              {rec.results.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="whitespace-nowrap px-3 py-2 text-slate-500">{formatTime(r.when)}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800">{r.activity}</td>
                  <td className="px-3 py-2">
                    <ScoreBadge value={r.score} />
                  </td>
                  <td className="max-w-md truncate px-3 py-2 text-slate-500" title={r.detail}>
                    {r.detail || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);

const fmtMarks = (m) => (Number.isInteger(m) ? String(m) : Number(m).toFixed(1));

const Stars = ({ rating }) =>
  rating ? (
    <span className="whitespace-nowrap text-amber-500" title={`${rating.rating}/5`}>
      {"★".repeat(rating.rating)}
      <span className="text-slate-300">{"★".repeat(5 - rating.rating)}</span>
    </span>
  ) : (
    <span className="text-slate-300">—</span>
  );

/** Test 1 / Test 2 results for every student who has taken at least one. */
const PrePostSection = ({ rows, isTa, onExport, onOpenReport, grants, onRetake, busyKey }) => (
  <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-3">
      <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
        <ClipboardCheck size={15} className="text-slate-500" />
        {isTa ? "Test 1 மற்றும் Test 2 முடிவுகள்" : "Test 1 & Test 2 results"}
        <span className="font-medium text-slate-400">({rows.length})</span>
      </h2>
      <button
        type="button"
        onClick={onExport}
        disabled={rows.length === 0}
        className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
      >
        <Download size={14} />
        {isTa ? "Test 1 & 2 CSV" : "Export Test 1 & 2 CSV"}
      </button>
    </div>
    {rows.length === 0 ? (
      <p className="py-8 text-center text-xs text-slate-400">
        {isTa ? "இன்னும் யாரும் Test 1 / Test 2 எழுதவில்லை." : "No student has taken Test 1 or Test 2 yet."}
      </p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400">
              <th className="px-3 py-2 font-bold uppercase tracking-wide">{isTa ? "மாணவர்" : "Student"}</th>
              <th className="px-3 py-2 font-bold uppercase tracking-wide">Test 1</th>
              <th className="px-3 py-2 font-bold uppercase tracking-wide">Test 2</th>
              <th className="px-3 py-2 font-bold uppercase tracking-wide">{isTa ? "மாற்றம்" : "Change"}</th>
              <th className="px-3 py-2 font-bold uppercase tracking-wide">{isTa ? "மதிப்பீடு 1 / 2" : "Rating 1 / 2"}</th>
              <th className="px-3 py-2 font-bold uppercase tracking-wide">{isTa ? "கருத்துகள்" : "Comments"}</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ uid, username, name, summary, gain }) => (
              <tr key={uid} className="border-b border-slate-100 align-top last:border-0">
                <td className="px-3 py-2.5">
                  <div className="font-semibold text-slate-800">{username}</div>
                  {name && <div className="text-[11px] text-slate-400">{name}</div>}
                </td>
                {[1, 2].map((n) => (
                  <td key={n} className="whitespace-nowrap px-3 py-2.5">
                    {summary[n].result ? (
                      <>
                        <div className="font-bold text-slate-900">
                          {fmtMarks(summary[n].result.score)}/{summary[n].result.maxScore}
                          <span className="ml-1 font-medium text-slate-400">({summary[n].result.percent}%)</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {summary[n].submittedAt?.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          {summary[n].attempts.length > 1 && ` · ${isTa ? "முயற்சி" : "attempt"} ${summary[n].attempts.length}`}
                        </div>
                        {summary[n].result.integrity?.warnings > 0 && (
                          <div
                            className="mt-0.5 text-[10px] font-bold text-red-600"
                            title={(summary[n].result.integrity.events || []).map((w) => `${w.type} ${new Date(w.at).toLocaleTimeString()}`).join(" | ")}
                          >
                            ⚠ {summary[n].result.integrity.warnings} {isTa ? "எச்சரிக்கை" : summary[n].result.integrity.warnings === 1 ? "warning" : "warnings"}
                            {summary[n].result.integrity.autoSubmitted && (isTa ? " · தானாகச் சமர்ப்பிப்பு" : " · auto-submitted")}
                          </div>
                        )}
                        {retakeAllowed(summary, grants[uid], n) ? (
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                              {isTa ? "மீண்டும் எழுத அனுமதி" : "Retake allowed"}
                            </span>
                            <button
                              type="button"
                              disabled={busyKey === `${uid}-${n}`}
                              onClick={() => onRetake(uid, n, false)}
                              className="text-[10px] font-bold text-slate-400 underline hover:text-red-600 disabled:opacity-50"
                            >
                              {isTa ? "ரத்து" : "Cancel"}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={busyKey === `${uid}-${n}`}
                            onClick={() => onRetake(uid, n, true)}
                            className="mt-1 flex items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
                          >
                            <RotateCcw size={10} />
                            {isTa ? "மீண்டும் எழுத அனுமதி" : "Allow retake"}
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-300">{isTa ? "எழுதவில்லை" : "Not taken"}</span>
                    )}
                  </td>
                ))}
                <td className="px-3 py-2.5 font-bold">
                  {gain ? (
                    <span className={gain.marks >= 0 ? "text-emerald-600" : "text-red-600"}>
                      {gain.marks >= 0 ? "+" : ""}
                      {fmtMarks(gain.marks)}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <div><Stars rating={summary[1].rating} /></div>
                  <div><Stars rating={summary[2].rating} /></div>
                </td>
                <td className="max-w-xs px-3 py-2.5 text-slate-500">
                  {[1, 2].map((n) =>
                    summary[n].rating?.comment ? (
                      <p key={n} className="truncate" title={summary[n].rating.comment}>
                        <b className="text-slate-600">T{n}:</b> {summary[n].rating.comment}
                      </p>
                    ) : null
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => onOpenReport(uid)}
                    className="whitespace-nowrap rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200"
                  >
                    {isTa ? "அறிக்கை" : "Report"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

/**
 * Admin-only page: one row per student with logins, modules used and marks,
 * expandable into every result with its date and time. Built entirely from
 * the "activityLog" Firestore collection, so it survives backend restarts.
 */
const AdminStudentRecords = ({ onBackToHome, onNavigate, language = "en" }) => {
  const isTa = language === "ta";
  const [events, setEvents] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [range, setRange] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [reportUid, setReportUid] = useState(null);
  const [grants, setGrants] = useState({});
  const [busyKey, setBusyKey] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [data, users, retakes] = await Promise.all([
        fetchActivityForRecords(),
        fetchUserProfiles(),
        fetchAllRetakeGrants().catch((err) => {
          console.warn("Could not load retake permissions:", err);
          return {};
        }),
      ]);
      setEvents(data);
      setProfiles(users);
      setGrants(retakes);
    } catch (err) {
      console.error("Failed to load student records:", err);
      setError(isTa ? "மாணவர் பதிவுகளை ஏற்ற முடியவில்லை." : "Could not load student records.");
    } finally {
      setLoading(false);
    }
  }, [isTa]);

  useEffect(() => {
    load();
  }, [load]);

  const records = useMemo(
    () => buildStudentRecords(filterSince(events, sinceFor(range)), profiles),
    [events, profiles, range]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => r.username.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
  }, [records, search]);

  const totals = useMemo(() => {
    const testScores = records.flatMap((r) =>
      r.results.filter((x) => x.module === "test" && typeof x.score === "number").map((x) => x.score)
    );
    return {
      students: records.length,
      logins: records.reduce((s, r) => s + r.loginCount, 0),
      tests: testScores.length,
      avgTest: testScores.length ? Math.round(testScores.reduce((a, b) => a + b, 0) / testScores.length) : null,
    };
  }, [records]);

  // Test 1 / Test 2 — always over the full history, not the date filter.
  const prePostRows = useMemo(() => {
    const byUid = {};
    events.forEach((e) => {
      if (e.module !== PREPOST_MODULE) return;
      const uid = e.uid || "unknown";
      (byUid[uid] = byUid[uid] || []).push(e);
    });
    return Object.entries(byUid)
      .map(([uid, evs]) => {
        const summary = prePostSummary(evs);
        const profile = profiles[uid] || {};
        return {
          uid,
          username: profile.username || evs[0]?.username || "—",
          name: profile.name || "",
          events: evs,
          summary,
          gain: improvement(summary),
        };
      })
      .filter((r) => r.summary[1].result || r.summary[2].result)
      .sort((a, b) => a.username.localeCompare(b.username, undefined, { numeric: true }));
  }, [events, profiles]);

  const downloadCsv = (text, name) => {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Full-history events for the student whose report is open (ignores the
  // date filter — a report should cover everything they've done).
  const reportEvents = useMemo(
    () => (reportUid ? events.filter((e) => (e.uid || "unknown") === reportUid) : null),
    [events, reportUid]
  );
  const reportProfile = useMemo(() => {
    if (!reportUid) return null;
    const rec = records.find((r) => r.uid === reportUid);
    const base = profiles[reportUid] || {};
    return { ...base, username: base.username || rec?.username, name: base.name || rec?.name || "" };
  }, [reportUid, profiles, records]);

  const toggleRetake = async (uid, n, allow) => {
    const who = prePostRows.find((r) => r.uid === uid)?.username || uid;
    const msg = allow
      ? isTa
        ? `${who} மாணவர் Test ${n} மீண்டும் எழுத அனுமதிக்கவா? புதிய முயற்சியே கணக்கில் எடுக்கப்படும்.`
        : `Allow ${who} to retake Test ${n}? Their new attempt will become the counted result (earlier attempts stay in the CSV).`
      : isTa
      ? `${who} மாணவரின் Test ${n} மறுதேர்வு அனுமதியை ரத்து செய்யவா?`
      : `Cancel the Test ${n} retake permission for ${who}?`;
    if (!window.confirm(msg)) return;
    setBusyKey(`${uid}-${n}`);
    try {
      await setRetakeGrant(uid, n, allow, auth.currentUser?.uid);
      const fresh = await fetchAllRetakeGrants();
      setGrants(fresh);
    } catch (err) {
      console.error("Retake permission failed:", err);
      alert(isTa ? "அனுமதியைச் சேமிக்க முடியவில்லை." : "Could not save the retake permission. Check the Firestore rules are deployed.");
    } finally {
      setBusyKey(null);
    }
  };

  const exportCsv = () => downloadCsv(recordsToCsv(visible), "student-records");
  const exportPrePostCsv = () => downloadCsv(prePostCsv(prePostRows), "test1-test2-results");

  if (reportUid && reportEvents) {
    return (
      <ProfilePage
        adminView
        events={reportEvents}
        profile={reportProfile}
        language={language}
        onBack={() => setReportUid(null)}
      />
    );
  }

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
              {isTa ? "மாணவர் பதிவுகள்" : "Student Records"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate("/admin/activity")}
              className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95 sm:flex"
            >
              <Activity size={14} />
              {isTa ? "செயல்பாடு" : "Activity"}
            </button>
          )}
          <button
            type="button"
            onClick={exportCsv}
            disabled={loading || visible.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95 disabled:opacity-50"
          >
            <Download size={14} />
            <span className="hidden sm:inline">{isTa ? "CSV பதிவிறக்கு" : "Export CSV"}</span>
          </button>
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{isTa ? "புதுப்பிக்க" : "Refresh"}</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 pt-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label={isTa ? "மாணவர்கள்" : "Active Students"} value={totals.students} icon={Users} />
          <StatCard label={isTa ? "உள்நுழைவுகள்" : "Logins"} value={totals.logins} icon={LogIn} />
          <StatCard label={isTa ? "தேர்வு விடைகள்" : "Test Answers"} value={totals.tests} icon={GraduationCap} />
          <StatCard
            label={isTa ? "சராசரி தேர்வு மதிப்பெண்" : "Class Avg Test"}
            value={totals.avgTest === null ? "—" : `${totals.avgTest}%`}
            icon={Target}
          />
        </div>

        <PrePostSection
          rows={prePostRows}
          isTa={isTa}
          onExport={exportPrePostCsv}
          onOpenReport={setReportUid}
          grants={grants}
          onRetake={toggleRetake}
          busyKey={busyKey}
        />

        <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
            <div className="relative min-w-[12rem] flex-1">
              <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isTa ? "பயனர்பெயர் அல்லது பெயர் தேடு" : "Search username or name"}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-slate-400 focus:bg-white"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRange(r.key)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    range === r.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {isTa ? r.ta : r.en}
                </button>
              ))}
            </div>
          </div>

          {loading && records.length === 0 ? (
            <p className="py-10 text-center text-xs text-slate-400">{isTa ? "ஏற்றுகிறது..." : "Loading..."}</p>
          ) : visible.length === 0 ? (
            <p className="py-10 text-center text-xs text-slate-400">
              {isTa ? "பதிவுகள் எதுவும் இல்லை." : "No student activity recorded for this filter."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400">
                    <th className="w-8 px-3 py-2"></th>
                    <th className="px-3 py-2 font-bold uppercase tracking-wide">{isTa ? "மாணவர்" : "Student"}</th>
                    <th className="px-3 py-2 font-bold uppercase tracking-wide">{isTa ? "உள்நுழைவு" : "Logins"}</th>
                    <th className="px-3 py-2 font-bold uppercase tracking-wide">{isTa ? "கடைசி உள்நுழைவு" : "Last Login"}</th>
                    <th className="px-3 py-2 font-bold uppercase tracking-wide">{isTa ? "தொகுதிகள்" : "Modules Used"}</th>
                    <th className="px-3 py-2 font-bold uppercase tracking-wide">{isTa ? "தேர்வுகள்" : "Tests"}</th>
                    <th className="px-3 py-2 font-bold uppercase tracking-wide">{isTa ? "தேர்வு சராசரி" : "Avg Test"}</th>
                    <th className="px-3 py-2 font-bold uppercase tracking-wide">{isTa ? "வீடியோ" : "Video Quiz"}</th>
                    <th className="px-3 py-2 font-bold uppercase tracking-wide">Kahoot</th>
                    <th className="px-3 py-2 font-bold uppercase tracking-wide">{isTa ? "கடைசி செயல்பாடு" : "Last Active"}</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((rec) => {
                    const open = expanded === rec.uid;
                    return (
                      <React.Fragment key={rec.uid}>
                        <tr
                          onClick={() => setExpanded(open ? null : rec.uid)}
                          className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${open ? "bg-slate-50" : ""}`}
                        >
                          <td className="px-3 py-2.5 text-slate-400">
                            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-slate-800">{rec.username}</div>
                            {rec.name && <div className="text-[11px] text-slate-400">{rec.name}</div>}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600">{rec.loginCount}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">{formatTime(rec.lastLogin)}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex max-w-xs flex-wrap gap-1">
                              {rec.modulesUsed.length === 0 ? (
                                <span className="text-slate-300">—</span>
                              ) : (
                                rec.modulesUsed.map((m) => (
                                  <span key={m} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                                    {moduleLabel(m)}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-slate-600">{rec.testsTaken}</td>
                          <td className="px-3 py-2.5"><ScoreBadge value={rec.avgTest} /></td>
                          <td className="px-3 py-2.5"><ScoreBadge value={rec.avgVideo} /></td>
                          <td className="px-3 py-2.5"><ScoreBadge value={rec.avgKahoot} /></td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">{formatTime(rec.lastActive)}</td>
                        </tr>
                        {open && (
                          <tr>
                            <td colSpan={10} className="p-0">
                              <StudentDetail rec={rec} isTa={isTa} onOpenReport={setReportUid} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-400">
          {isTa
            ? "ஒரு மாணவரைக் கிளிக் செய்து ஒவ்வொரு மதிப்பெண்ணையும் நேரத்துடன் பார்க்கவும்."
            : "Click a student to see every result with its date and time. Averages are percentages."}
        </p>
      </main>
    </div>
  );
};

export default AdminStudentRecords;
