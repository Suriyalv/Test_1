import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  CalendarDays,
  Flame,
  LogIn,
  GraduationCap,
  MessageCircle,
  Layers,
  Lightbulb,
  Target,
  Clock,
} from "lucide-react";
import { buildStudentReport, moduleName, topicName, STRONG_AT, WEAK_BELOW, MIN_ATTEMPTS } from "./reportLogic";
import { prePostSummary, improvement } from "../TestTaking/prePostResults";
import { ClipboardCheck } from "lucide-react";

const TONES = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  sky: "bg-sky-50 text-sky-700 border-sky-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
  slate: "bg-slate-50 text-slate-500 border-slate-200",
};

const barColor = (v) => (v >= STRONG_AT ? "bg-emerald-500" : v >= WEAK_BELOW ? "bg-amber-400" : "bg-red-500");

const formatDate = (d, withTime = false) =>
  d
    ? d.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
      })
    : "—";

const Card = ({ title, icon: Icon, children, className = "" }) => (
  <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-xs break-inside-avoid ${className}`}>
    {title && (
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-900">
        {Icon && <Icon size={15} className="text-slate-500" />}
        {title}
      </h2>
    )}
    {children}
  </section>
);

const Stat = ({ label, value, icon: Icon }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
      <Icon size={12} />
      {label}
    </div>
    <div className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">{value}</div>
  </div>
);

/** Horizontal percentage bars, colored by strong / developing / weak. */
const ScoreBars = ({ rows, empty }) =>
  rows.length === 0 ? (
    <p className="py-4 text-center text-xs text-slate-400">{empty}</p>
  ) : (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-700">{r.label}</span>
            <span className="shrink-0 text-slate-500">
              <b className="text-slate-900">{r.avg}%</b> · {r.count}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${barColor(r.avg)}`} style={{ width: `${Math.max(r.avg, 3)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );

const AreaList = ({ items, tone, empty, isTa }) =>
  items.length === 0 ? (
    <p className="text-xs opacity-70">{empty}</p>
  ) : (
    <ul className="space-y-2">
      {items.map((a) => (
        <li key={`${a.kind}-${a.key}`} className="flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold">{a.label}</span>
          <span className={`shrink-0 rounded-md border px-1.5 py-0.5 font-bold ${TONES[tone]}`}>
            {a.avg}% <span className="font-medium opacity-70">/ {a.count} {isTa ? "விடைகள்" : "answers"}</span>
          </span>
        </li>
      ))}
    </ul>
  );

const fmtMarks = (m) => (Number.isInteger(m) ? String(m) : Number(m).toFixed(1));

/** Test 1 vs Test 2: scores, dates, change, per-topic comparison and ratings. */
const PrePostCard = ({ events, isTa }) => {
  const s = useMemo(() => prePostSummary(events), [events]);
  const gain = improvement(s);
  const t1 = s[1].result;
  const t2 = s[2].result;
  const topics = (t2?.topics || t1?.topics || []).map((t) => ({
    topic: t.topic,
    name: t.name,
    p1: t1?.topics?.find((x) => x.topic === t.topic)?.percent,
    p2: t2?.topics?.find((x) => x.topic === t.topic)?.percent,
  }));

  return (
    <Card title={isTa ? "Test 1 மற்றும் Test 2" : "Test 1 and Test 2"} icon={ClipboardCheck}>
      <div className="grid grid-cols-3 gap-3 text-center">
        {[1, 2].map((n) => {
          const r = s[n].result;
          return (
            <div key={n} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Test {n}</div>
              <div className="text-xl font-extrabold text-slate-900">
                {r ? `${fmtMarks(r.score)}/${r.maxScore}` : "—"}
              </div>
              <div className="text-[11px] text-slate-500">
                {r ? `${r.percent}% · ${formatDate(s[n].submittedAt)}` : isTa ? "எழுதவில்லை" : "Not taken"}
              </div>
              {s[n].rating && (
                <div className="mt-0.5 text-[11px] text-amber-600">{"★".repeat(s[n].rating.rating)}{"☆".repeat(5 - s[n].rating.rating)}</div>
              )}
            </div>
          );
        })}
        <div className={`rounded-xl border p-3 ${gain ? (gain.marks >= 0 ? TONES.emerald : TONES.red) : TONES.slate}`}>
          <div className="text-[10px] font-bold uppercase tracking-wide opacity-70">{isTa ? "மாற்றம்" : "Change"}</div>
          <div className="text-xl font-extrabold">
            {gain ? `${gain.marks >= 0 ? "+" : ""}${fmtMarks(gain.marks)}` : "—"}
          </div>
          <div className="text-[11px] opacity-80">
            {gain ? `${gain.percent >= 0 ? "+" : ""}${gain.percent}%` : isTa ? "இரண்டும் தேவை" : "Needs both tests"}
          </div>
        </div>
      </div>

      {topics.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400">
                <th className="py-1.5 pr-2 font-bold">{isTa ? "பாடம்" : "Topic"}</th>
                <th className="px-2 py-1.5 text-right font-bold">Test 1</th>
                <th className="px-2 py-1.5 text-right font-bold">Test 2</th>
                <th className="py-1.5 pl-2 text-right font-bold">{isTa ? "மாற்றம்" : "Change"}</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((t) => {
                const d = typeof t.p1 === "number" && typeof t.p2 === "number" ? t.p2 - t.p1 : null;
                return (
                  <tr key={t.topic} className="border-b border-slate-100 last:border-0">
                    <td className="py-1.5 pr-2 font-semibold text-slate-700">{t.name}</td>
                    <td className="px-2 py-1.5 text-right text-slate-600">{t.p1 ?? "—"}{typeof t.p1 === "number" ? "%" : ""}</td>
                    <td className="px-2 py-1.5 text-right text-slate-600">{t.p2 ?? "—"}{typeof t.p2 === "number" ? "%" : ""}</td>
                    <td className={`py-1.5 pl-2 text-right font-bold ${d === null ? "text-slate-300" : d >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {d === null ? "—" : `${d >= 0 ? "+" : ""}${d}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

/**
 * Full performance report for one student. Pass that student's activityLog
 * events and (optionally) their users/{uid} profile doc.
 */
const StudentReport = ({ events, profile, language = "en" }) => {
  const isTa = language === "ta";
  const r = useMemo(() => buildStudentReport(events, profile, isTa), [events, profile, isTa]);

  const initials = (r.profile.name || r.profile.username || "?")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const trendView = {
    up: { icon: TrendingUp, text: isTa ? `முன்னேறுகிறது (+${r.trend.delta}%)` : `Improving (+${r.trend.delta}%)`, cls: "text-emerald-700" },
    down: { icon: TrendingDown, text: isTa ? `குறைகிறது (${r.trend.delta}%)` : `Dropping (${r.trend.delta}%)`, cls: "text-red-600" },
    steady: { icon: Minus, text: isTa ? "நிலையாக உள்ளது" : "Steady", cls: "text-slate-600" },
    "not-enough": { icon: Minus, text: isTa ? "போக்கைக் காட்ட இன்னும் விடைகள் தேவை" : "Needs 6+ answers to show a trend", cls: "text-slate-400" },
  }[r.trend.direction];
  const TrendIcon = trendView.icon;

  const modulesUsed = Object.entries(r.moduleCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-5">
      {/* Profile header */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-cyan-500 text-lg font-extrabold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-extrabold tracking-tight text-slate-900">
              {r.profile.name || r.profile.username}
            </h2>
            <p className="text-xs text-slate-500">
              @{r.profile.username} · {isTa ? "சேர்ந்தது" : "Joined"} {formatDate(r.profile.joined)} ·{" "}
              {isTa ? "கடைசியாக" : "Last active"} {formatDate(r.profile.lastActive, true)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {isTa ? "ஒட்டுமொத்த மதிப்பெண்" : "Overall score"}
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {r.overall === null ? "—" : `${r.overall}%`}
              </span>
              <span className={`rounded-lg border px-2 py-1 text-xs font-bold ${TONES[r.grade.tone]}`}>
                <Award size={12} className="-mt-0.5 mr-1 inline" />
                {r.grade.label}
              </span>
            </div>
            <div className={`mt-0.5 flex items-center justify-end gap-1 text-xs font-semibold ${trendView.cls}`}>
              <TrendIcon size={13} />
              {trendView.text}
            </div>
          </div>
        </div>
      </Card>

      <PrePostCard events={events} isTa={isTa} />

      {/* Engagement */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label={isTa ? "உள்நுழைவுகள்" : "Logins"} value={r.totals.logins} icon={LogIn} />
        <Stat label={isTa ? "செயலில் நாட்கள்" : "Days active"} value={r.totals.daysActive} icon={CalendarDays} />
        <Stat label={isTa ? "தொடர் நாட்கள்" : "Day streak"} value={r.totals.streak} icon={Flame} />
        <Stat label={isTa ? "தேர்வு விடைகள்" : "Test answers"} value={r.totals.tests} icon={GraduationCap} />
        <Stat label={isTa ? "அட்டைகள்" : "Flashcards"} value={r.totals.flashcards} icon={Layers} />
        <Stat label={isTa ? "AI கேள்விகள்" : "AI questions"} value={r.totals.chatQuestions} icon={MessageCircle} />
      </div>

      {/* Strengths / weaknesses */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 break-inside-avoid">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-extrabold text-emerald-800">
            <TrendingUp size={16} />
            {isTa ? "பலங்கள்" : "Strengths"}
            <span className="font-medium text-emerald-700/70">({isTa ? `${STRONG_AT}%+` : `${STRONG_AT}% and above`})</span>
          </h2>
          <AreaList
            items={r.strengths}
            tone="emerald"
            isTa={isTa}
            empty={isTa ? "இன்னும் போதுமான பயிற்சி இல்லை." : `Not enough practice yet — each area needs ${MIN_ATTEMPTS}+ answers.`}
          />
        </section>

        <section className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-900 break-inside-avoid">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-extrabold text-red-800">
            <TrendingDown size={16} />
            {isTa ? "பலவீனங்கள்" : "Weaknesses"}
            <span className="font-medium text-red-700/70">({isTa ? `${WEAK_BELOW}%க்கு கீழ்` : `below ${WEAK_BELOW}%`})</span>
          </h2>
          <AreaList
            items={r.weaknesses}
            tone="red"
            isTa={isTa}
            empty={isTa ? "பலவீனமான பகுதிகள் இல்லை — நன்று!" : "No weak areas right now. Well done!"}
          />
          {r.developing.length > 0 && (
            <div className="mt-4 border-t border-red-200/70 pt-3">
              <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                {isTa ? "வளர்ந்து வருகிறது" : `Developing (${WEAK_BELOW}–${STRONG_AT - 1}%)`}
              </div>
              <p className="text-xs text-amber-800">
                {r.developing.map((d) => `${d.label} ${d.avg}%`).join(" · ")}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Recommendations */}
      <Card title={isTa ? "அடுத்து என்ன செய்யலாம்" : "What to do next"} icon={Lightbulb}>
        <ul className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-slate-700">
          {r.recommendations.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </Card>

      {/* Score trend */}
      <Card title={isTa ? "மதிப்பெண் போக்கு (கடைசி 20)" : "Score trend (last 20 answers)"} icon={TrendingUp}>
        {r.history.length < 2 ? (
          <p className="py-6 text-center text-xs text-slate-400">
            {isTa ? "போக்கைக் காட்ட இன்னும் விடைகள் தேவை." : "Answer a few more questions to see a trend."}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={r.history} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <ReferenceLine y={STRONG_AT} stroke="#10b981" strokeDasharray="4 4" />
              <ReferenceLine y={WEAK_BELOW} stroke="#ef4444" strokeDasharray="4 4" />
              <Tooltip formatter={(v) => [`${v}%`, isTa ? "மதிப்பெண்" : "Score"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="score" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Topic / module / level breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card title={isTa ? "பாடம் வாரியாக" : "Performance by topic"} icon={Target}>
          <ScoreBars rows={r.topicScores} empty={isTa ? "இன்னும் தரவு இல்லை." : "No topic scores yet."} />
        </Card>
        <div className="space-y-4">
          <Card title={isTa ? "தொகுதி வாரியாக" : "Performance by module"} icon={Layers}>
            <ScoreBars rows={r.moduleScores} empty={isTa ? "இன்னும் தரவு இல்லை." : "No scores yet."} />
          </Card>
          <Card title={isTa ? "கடினநிலை வாரியாக" : "Performance by difficulty"} icon={GraduationCap}>
            <ScoreBars
              rows={r.levelScores}
              empty={isTa ? "தகவமைப்புத் தேர்வு எழுதவும்." : "Take an adaptive test to see Easy / Medium / Hard."}
            />
          </Card>
        </div>
      </div>

      {/* Modules used + recent results */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card title={isTa ? "பயன்படுத்திய தொகுதிகள்" : "Modules used"} icon={Layers} className="md:col-span-2">
          {modulesUsed.length === 0 ? (
            <p className="text-xs text-slate-400">—</p>
          ) : (
            <ul className="space-y-1.5 text-xs">
              {modulesUsed.map(([m, n]) => (
                <li key={m} className="flex justify-between">
                  <span className="text-slate-700">{moduleName(m, isTa)}</span>
                  <span className="font-bold text-slate-900">{n}×</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={isTa ? "சமீபத்திய முடிவுகள்" : "Recent results"} icon={Clock} className="md:col-span-3">
          {r.recentResults.length === 0 ? (
            <p className="text-xs text-slate-400">{isTa ? "இன்னும் முடிவுகள் இல்லை." : "No results yet."}</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-xs">
              {r.recentResults.map((s) => (
                <li key={s.id} className="flex items-center gap-2 py-1.5">
                  <span className="w-28 shrink-0 text-slate-400">{formatDate(s.when, true)}</span>
                  <span className="min-w-0 flex-1 truncate text-slate-700" title={s.question || ""}>
                    {moduleName(s.module, isTa)}
                    {s.topic ? ` · ${topicName(s.topic, isTa)}` : s.quiz ? ` · ${s.quiz}` : ""}
                  </span>
                  <span className={`shrink-0 rounded-md border px-1.5 py-0.5 font-bold ${TONES[s.score >= STRONG_AT ? "emerald" : s.score >= WEAK_BELOW ? "amber" : "red"]}`}>
                    {Math.round(s.score)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};

export default StudentReport;
