import React, { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Target,
  Layers,
} from "lucide-react";
import { ADAPTIVE_TOPICS, PASS_MARK, topicById, levelOfStep, nextStep, isPass } from "./adaptiveTest";

// Mark categories offered in the setup screen. "MCQ" is how 1-mark questions
// are stored in the question bank.
const MARK_CATEGORIES = [
  { id: "MCQ", en: "1 Mark (MCQ)", ta: "1 மதிப்பெண் (MCQ)", summaryEn: "1 Mark questions", summaryTa: "1 மதிப்பெண் வினாக்கள்" },
  { id: "2 Marks", en: "2 Marks", ta: "2 மதிப்பெண்", summaryEn: "2 Marks questions", summaryTa: "2 மதிப்பெண் வினாக்கள்" },
  { id: "5 Marks", en: "5 Marks", ta: "5 மதிப்பெண்", summaryEn: "5 Marks questions", summaryTa: "5 மதிப்பெண் வினாக்கள்" },
];

const LEVEL_META = {
  easy: { en: "Easy", ta: "எளிது", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  medium: { en: "Medium", ta: "நடுத்தரம்", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  hard: { en: "Hard", ta: "கடினம்", cls: "bg-rose-100 text-rose-800 border-rose-200" },
};

export const LevelBadge = ({ level, isTa }) => {
  const meta = LEVEL_META[level];
  if (!meta) return null;
  return (
    <span className={`rounded border px-2 py-0.5 text-[11px] font-bold uppercase ${meta.cls}`}>
      {isTa ? meta.ta : meta.en}
    </span>
  );
};

const OUTCOME_META = {
  mastered: { en: "Excellent", ta: "முழுமையாகக் கற்றது", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Trophy },
  "reached-hard": { en: "Good — practise the hard question", ta: "நன்று — கடின நிலையைத் திருப்பிப் பார்", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: TrendingUp },
  "needs-practice": { en: "Needs practice", ta: "பயிற்சி தேவை", cls: "bg-rose-50 text-rose-700 border-rose-200", icon: Target },
};

/* ── Setup: pick topics and the mark category ───────────────────────────────── */
export const AdaptiveSetup = ({ isTa, onStart, availableTopics }) => {
  const [category, setCategory] = useState("MCQ");
  const [selected, setSelected] = useState(ADAPTIVE_TOPICS.map((t) => t.id));

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const allSelected = selected.length === ADAPTIVE_TOPICS.length;
  // Keep the topic order fixed, whatever order they were ticked in.
  const ordered = ADAPTIVE_TOPICS.map((t) => t.id).filter((id) => selected.includes(id));

  return (
    <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#0284c7]">
          <Layers size={14} />
          {isTa ? "இயற்பியல் தகவமைப்புத் தேர்வு" : "Smart Physics Test"}
        </div>
        <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900">
          {isTa ? "உங்கள் நிலைக்கு ஏற்ப வினாக்கள் மாறும்" : "Your next question depends on your answer"}
        </h2>
      </div>

      {/* How it works */}
      <div className="grid gap-2 text-xs sm:grid-cols-3">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="font-extrabold text-amber-800">1. {isTa ? "நடுத்தர வினாவில் தொடக்கம்" : "Start with Medium"}</div>
          <p className="mt-1 text-amber-900/80">
            {isTa ? "ஒவ்வொரு தலைப்பும் நடுத்தர நிலை வினாவுடன் தொடங்கும்." : "Each topic starts with a medium question."}
          </p>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
          <div className="font-extrabold text-rose-800">2. {PASS_MARK}% {isTa ? "அல்லது அதற்கு மேல் → கடினம்" : "or more → Hard"}</div>
          <p className="mt-1 text-rose-900/80">
            {isTa ? "சரியாகப் பதிலளித்தால் கடின வினா கிடைக்கும்." : "Get 70% or more to go to the hard question."}
          </p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <div className="font-extrabold text-emerald-800">3. {isTa ? `${PASS_MARK}%-க்குக் கீழ் → எளிது` : `Below ${PASS_MARK}% → Easy`}</div>
          <p className="mt-1 text-emerald-900/80">
            {isTa
              ? "முதலில் எளிய வினா, பிறகு அதே நடுத்தர வினாவை மீண்டும் முயற்சி செய்யலாம்."
              : "You get an easy question. Then you try the medium question again."}
          </p>
        </div>
      </div>

      {/* Marks */}
      <div>
        <div className="mb-1.5 text-xs font-bold text-slate-600">{isTa ? "மதிப்பெண் வகை" : "Question type"}</div>
        <div className="flex gap-2">
          {MARK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`rounded-lg border px-4 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                category === cat.id
                  ? "border-[#0284c7] bg-[#0284c7] text-white shadow-xs"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-300 hover:text-[#0284c7]"
              }`}
            >
              {isTa ? cat.ta : cat.en}
            </button>
          ))}
        </div>
      </div>

      {/* Topics */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">{isTa ? "தலைப்புகள்" : "Topics"}</span>
          <button
            type="button"
            onClick={() => setSelected(allSelected ? [] : ADAPTIVE_TOPICS.map((t) => t.id))}
            className="text-[11px] font-bold text-[#0284c7] hover:underline"
          >
            {allSelected ? (isTa ? "அனைத்தையும் நீக்கு" : "Clear all") : isTa ? "அனைத்தையும் தேர்வு செய்" : "Select all"}
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {ADAPTIVE_TOPICS.map((topic) => {
            const on = selected.includes(topic.id);
            const missing = availableTopics && !availableTopics.has(topic.id);
            return (
              <button
                key={topic.id}
                type="button"
                disabled={missing}
                onClick={() => toggle(topic.id)}
                className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-left text-xs font-semibold transition-all disabled:opacity-40 ${
                  on
                    ? "border-[#0284c7] bg-brand-50 text-[#0284c7]"
                    : "border-slate-200 bg-white text-slate-700 hover:border-brand-300"
                }`}
              >
                <span className="text-base leading-none">{topic.icon}</span>
                <span className="flex-1">{isTa ? topic.ta : topic.en}</span>
                {on && <CheckCircle2 size={15} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={ordered.length === 0}
        onClick={() => onStart(ordered, category)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 py-2.5 text-sm font-bold text-white shadow-pop transition-all hover:brightness-110 active:scale-95 disabled:opacity-40"
      >
        {isTa ? "தேர்வைத் தொடங்கு" : "Start"} ({ordered.length} {isTa ? "தலைப்புகள்" : ordered.length === 1 ? "topic" : "topics"})
        <ArrowRight size={16} />
      </button>
    </div>
  );
};

/* ── Header strip above the question: topic, position and the path so far ──── */
export const AdaptiveProgress = ({ session, isTa }) => {
  const topicId = session.topics[session.topicIndex];
  const topic = topicById(topicId);
  const trail = session.attempts.filter((a) => a.topic === topicId);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <span className="text-lg leading-none">{topic?.icon}</span>
          {isTa ? topic?.ta : topic?.en}
        </div>
        <span className="text-xs font-bold text-slate-500">
          {isTa ? "தலைப்பு" : "Topic"} <span className="text-[#0284c7]">{session.topicIndex + 1}</span> / {session.topics.length}
        </span>
      </div>

      {/* Path through this topic, e.g. Medium 45% → Easy 80% → Medium (now) */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
        {trail.map((a, i) => (
          <React.Fragment key={i}>
            <span
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 ${
                a.passed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {a.passed ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
              {isTa ? LEVEL_META[a.level].ta : LEVEL_META[a.level].en} {a.accuracy}%
            </span>
            <ArrowRight size={11} className="text-slate-300" />
          </React.Fragment>
        ))}
        <span className="flex items-center gap-1 rounded-full border border-[#0284c7] bg-brand-50 px-2 py-0.5 text-[#0284c7]">
          {isTa ? LEVEL_META[levelOfStep(session.step)].ta : LEVEL_META[levelOfStep(session.step)].en}
          {session.step === "medium-retry" && (isTa ? " (மீண்டும்)" : " (retry)")}
          <span className="font-semibold opacity-70">· {isTa ? "இப்போது" : "now"}</span>
        </span>
      </div>
    </div>
  );
};

/* ── Banner after evaluation: says what happens next and moves on ───────────── */
export const AdaptiveNextStep = ({ session, accuracy, isTa, onContinue }) => {
  const passed = isPass(accuracy);
  const { next } = nextStep(session.step, accuracy);
  const isLastTopic = session.topicIndex === session.topics.length - 1;

  let title;
  let body;
  let tone;
  let Icon;

  if (next === "hard") {
    tone = "emerald";
    Icon = TrendingUp;
    title = isTa ? `அருமை! ${accuracy}% — கடின நிலைக்குச் செல்லுங்கள்` : `Great! ${accuracy}% — next is a hard question`;
    body = isTa ? "நீங்கள் இந்த வினாவைச் சரியாகப் பதிலளித்தீர்கள். இப்போது கடினமான வினாவை முயற்சி செய்யுங்கள்." : "Your answer is correct. Now try the hard question.";
  } else if (next === "easy") {
    tone = "amber";
    Icon = TrendingDown;
    title = isTa ? `${accuracy}% — முதலில் ஒரு எளிய வினா` : `${accuracy}% — let's try an easy question first`;
    body = isTa
      ? `${PASS_MARK}% தேவை. மாதிரி விடையைப் படித்து, எளிய வினாவுக்குப் பதிலளியுங்கள்; பிறகு இதே நடுத்தர வினாவை மீண்டும் முயற்சி செய்யலாம்.`
      : `You need ${PASS_MARK}%. Read the model answer below. Answer an easy question. Then try this question again.`;
  } else if (next === "medium-retry") {
    tone = "sky";
    Icon = RotateCcw;
    title = isTa ? `${accuracy}% — இப்போது நடுத்தர வினாவை மீண்டும் முயற்சி செய்யுங்கள்` : `${accuracy}% — now try the medium question again`;
    body = isTa ? "எளிய வினாவில் கற்றதைப் பயன்படுத்தி, முன்பு தவறிய நடுத்தர வினாவுக்கு மீண்டும் பதிலளியுங்கள்." : "Use what you just learned. Try the medium question again.";
  } else {
    tone = passed ? "emerald" : "rose";
    Icon = passed ? Trophy : Target;
    title = passed
      ? isTa ? `${accuracy}% — இந்தத் தலைப்பு முடிந்தது!` : `${accuracy}% — topic complete!`
      : isTa ? `${accuracy}% — இந்தத் தலைப்பு முடிந்தது` : `${accuracy}% — topic finished`;
    body = session.step === "medium-retry"
      ? isTa ? "இந்தத் தலைப்பை அட்டைகள் மற்றும் வரைபடத்தில் மீண்டும் படியுங்கள்." : "Study this topic again with flashcards and mind maps. Then try again."
      : passed
        ? isTa ? "கடின வினாவையும் சரியாகப் பதிலளித்தீர்கள்!" : "You answered the hard question too!"
        : isTa ? "நடுத்தர நிலையைக் கடந்தீர்கள்; கடின வினாவின் மாதிரி விடையைப் படியுங்கள்." : "You passed medium. Read the model answer for the hard question to learn more.";
  }

  const toneCls = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    sky: "border-sky-200 bg-sky-50 text-sky-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900",
  }[tone];

  const buttonLabel = next
    ? isTa ? "அடுத்த வினா" : "Next question"
    : isLastTopic
      ? isTa ? "முடிவுகளைப் பார்" : "See results"
      : isTa ? "அடுத்த தலைப்பு" : "Next topic";

  return (
    <div className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${toneCls}`}>
      <Icon size={26} className="shrink-0" />
      <div className="flex-1">
        <div className="text-sm font-extrabold">{title}</div>
        <p className="mt-0.5 text-xs font-medium opacity-80">{body}</p>
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="flex items-center justify-center gap-1.5 rounded-xl bg-[#0284c7] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#026aa2] active:scale-95"
      >
        {buttonLabel}
        <ArrowRight size={14} />
      </button>
    </div>
  );
};

/* ── Final summary across all topics ───────────────────────────────────────── */
export const AdaptiveSummary = ({ session, isTa, onRestart }) => {
  const counts = Object.values(session.outcomes).reduce((acc, o) => ({ ...acc, [o]: (acc[o] || 0) + 1 }), {});

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md">
          <Trophy size={26} />
        </div>
        <h2 className="mt-3 text-lg font-extrabold tracking-tight text-slate-900">
          {isTa ? "தேர்வு முடிந்தது!" : "Test complete!"}
        </h2>
        <p className="text-xs font-semibold text-slate-500">
          {(() => {
            const cat = MARK_CATEGORIES.find((c) => c.id === session.category) || MARK_CATEGORIES[0];
            return isTa ? cat.summaryTa : cat.summaryEn;
          })()}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {["mastered", "reached-hard", "needs-practice"].map((key) => {
          const meta = OUTCOME_META[key];
          return (
            <div key={key} className={`rounded-xl border p-3 ${meta.cls}`}>
              <div className="text-xl font-extrabold">{counts[key] || 0}</div>
              <div className="text-[10px] font-bold uppercase tracking-wide">{isTa ? meta.ta : meta.en}</div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        {session.topics.map((topicId) => {
          const topic = topicById(topicId);
          const meta = OUTCOME_META[session.outcomes[topicId]] || OUTCOME_META["needs-practice"];
          const OutcomeIcon = meta.icon;
          const trail = session.attempts.filter((a) => a.topic === topicId);
          return (
            <div key={topicId} className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <span>{topic?.icon}</span>
                  {isTa ? topic?.ta : topic?.en}
                </span>
                <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${meta.cls}`}>
                  <OutcomeIcon size={12} />
                  {isTa ? meta.ta : meta.en}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] font-bold">
                {trail.map((a, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <ArrowRight size={11} className="text-slate-300" />}
                    <span className={a.passed ? "text-emerald-700" : "text-rose-700"}>
                      {isTa ? LEVEL_META[a.level].ta : LEVEL_META[a.level].en} {a.accuracy}%
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0284c7] py-2.5 text-sm font-bold text-white shadow-xs transition-all hover:bg-[#026aa2] active:scale-95"
      >
        <RotateCcw size={15} />
        {isTa ? "புதிய தேர்வு" : "Start a new test"}
      </button>
    </div>
  );
};
