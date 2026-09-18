import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { fetchPrePostTest, submitPrePostTest } from "../../api";
import { saveActivity } from "../../activity";
import { useHideMascot } from "../../mascotContext";
import { prePostSummary, improvement, retakeAllowed, fetchOwnRetakeGrant, PREPOST_MODULE, TEST_NAMES } from "./prePostResults";
import {
  ClipboardCheck,
  Lock,
  CheckCircle2,
  Star,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Send,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Clock,
  ChevronLeft,
  RotateCcw,
  Maximize,
  ShieldAlert,
} from "lucide-react";

/**
 * Test 1 and Test 2 — the same 25-mark paper taken twice: once when a student
 * first enters the platform (score only, no AI help) and once after using it
 * (AI marks every answer and gives feedback + an overall analysis). Each test
 * can be taken once. After submitting, the student must rate the test (1–5
 * stars + comment) — the answers are marked in the background meanwhile.
 * Results and ratings are saved to Firestore "activityLog" (module "prepost").
 */

const draftKey = (uid, n) => `prepost-draft-${uid}-${n}`;

const readDraft = (uid, n) => {
  try {
    return JSON.parse(localStorage.getItem(draftKey(uid, n)) || "null");
  } catch {
    return null;
  }
};

const writeDraft = (uid, n, draft) => {
  try {
    localStorage.setItem(draftKey(uid, n), JSON.stringify(draft));
  } catch {
    /* storage full or blocked — the test still works, just without autosave */
  }
};

const clearDraft = (uid, n) => {
  try {
    localStorage.removeItem(draftKey(uid, n));
  } catch {
    /* ignore */
  }
};

/* ── Full-screen exam mode ──────────────────────────────────────────────────
 * The paper runs in browser full screen. Leaving full screen, switching tab
 * or switching window is a warning: the question is hidden until the student
 * returns, and after MAX_WARNINGS the test is submitted automatically. Every
 * warning is saved with the result so the teacher can see it. Phones without
 * the Fullscreen API (e.g. iPhone Safari) still get tab-switch detection. */
const MAX_WARNINGS = 3;

const fullscreenSupported = () =>
  typeof document !== "undefined" && Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled);

const isFullscreen = () => Boolean(document.fullscreenElement || document.webkitFullscreenElement);

const enterFullscreen = () => {
  const el = document.documentElement;
  const request = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!request) return;
  try {
    const result = request.call(el);
    if (result && result.catch) result.catch(() => {});
  } catch {
    /* blocked by the browser — the warning screen offers a retry */
  }
};

const exitFullscreen = () => {
  if (!isFullscreen()) return;
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  try {
    const result = exit && exit.call(document);
    if (result && result.catch) result.catch(() => {});
  } catch {
    /* ignore */
  }
};

const fmtMarks = (m) => (Number.isInteger(m) ? String(m) : m.toFixed(1));

const barTone = (pct) => (pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-500");

/* ── Rating page ──────────────────────────────────────────────────────────── */

const RatingPage = ({ testNumber, attemptId, isTa, onSaved }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const labels = isTa
    ? ["", "மிக மோசம்", "மோசம்", "பரவாயில்லை", "நன்று", "மிக நன்று"]
    : ["", "Very bad", "Bad", "Okay", "Good", "Very good"];

  const save = async () => {
    if (!rating) {
      setError(isTa ? "நட்சத்திர மதிப்பீட்டைத் தேர்ந்தெடுக்கவும்." : "Please choose a star rating.");
      return;
    }
    if (comment.trim().length < 3) {
      setError(isTa ? "ஒரு சிறிய கருத்தை எழுதவும்." : "Please write a short comment.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const meta = { testNumber, attemptId: attemptId || null, rating, comment: comment.trim().slice(0, 1000) };
      await saveActivity(PREPOST_MODULE, "rating", meta);
      onSaved(meta);
    } catch (err) {
      console.error("Rating save failed:", err);
      setError(isTa ? "சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்." : "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-600">
        <CheckCircle2 size={14} />
        {isTa ? `${TEST_NAMES[testNumber]} சமர்ப்பிக்கப்பட்டது` : `${TEST_NAMES[testNumber]} submitted`}
      </div>
      <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
        {isTa ? "இந்தத் தேர்வை மதிப்பிடுங்கள்" : "Rate this test"}
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        {isTa
          ? "உங்கள் மதிப்பெண்ணைப் பார்க்கும் முன் மதிப்பீடும் கருத்தும் தேவை. இதற்கிடையில் உங்கள் விடைகள் திருத்தப்படுகின்றன."
          : "Your rating and comment are needed before you see your score. Your answers are being marked meanwhile."}
      </p>

      <div className="mt-5 flex items-center justify-center gap-1.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className="rounded-lg p-1 transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              size={36}
              className={(hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-slate-300"}
            />
          </button>
        ))}
      </div>
      <p className="mt-1 h-4 text-center text-xs font-semibold text-amber-600">{labels[hover || rating]}</p>

      <label className="mt-4 block text-xs font-bold text-slate-700">
        {isTa ? "உங்கள் கருத்து" : "Your comment"}
      </label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        maxLength={1000}
        placeholder={
          isTa ? "தேர்வு எப்படி இருந்தது? எது கடினமாக இருந்தது?" : "How was the test? What was easy or difficult?"
        }
        className="mt-1.5 w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-brand-400 focus:bg-white"
      />

      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 py-2.5 text-sm font-bold text-white shadow-pop transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
        {isTa ? "சமர்ப்பித்து மதிப்பெண்ணைப் பார்" : "Submit and see my score"}
      </button>
    </div>
  );
};

/* ── Result views ─────────────────────────────────────────────────────────── */

const ScoreHeader = ({ result, testNumber, isTa, gain }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
    <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
      {TEST_NAMES[testNumber]} · {isTa ? "உங்கள் மதிப்பெண்" : "Your score"}
    </div>
    <div className="mt-1 text-5xl font-extrabold tracking-tight text-slate-900">
      {fmtMarks(result.score)}
      <span className="text-2xl text-slate-400"> / {result.maxScore}</span>
    </div>
    <div className="mt-1 text-sm font-bold text-brand-600">{result.percent}%</div>
    {gain && (
      <div
        className={`mx-auto mt-3 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-bold ${
          gain.marks >= 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
        }`}
      >
        {gain.marks >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {gain.marks >= 0 ? "+" : ""}
        {fmtMarks(gain.marks)} {isTa ? "மதிப்பெண்கள் (Test 1 உடன் ஒப்பிட)" : "marks compared with Test 1"}
      </div>
    )}
    <div className="mx-auto mt-5 grid max-w-md grid-cols-3 gap-2">
      {["A", "B", "C"].map((id) =>
        result.sections?.[id] ? (
          <div key={id} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
            <div className="text-[10px] font-bold uppercase text-slate-400">
              {isTa ? `பகுதி ${{ A: "அ", B: "ஆ", C: "இ" }[id]}` : `Part ${id}`}
            </div>
            <div className="text-base font-extrabold text-slate-800">
              {fmtMarks(result.sections[id].marks)}/{result.sections[id].maxMarks}
            </div>
          </div>
        ) : null
      )}
    </div>
  </div>
);

const Test2Review = ({ result, isTa }) => {
  const [open, setOpen] = useState(null);
  const a = result.analysis || {};
  return (
    <>
      {(a.summary || a.strengths?.length || a.weaknesses?.length || a.suggestions?.length) && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
            <Lightbulb size={16} className="text-amber-500" />
            {isTa ? "AI பகுப்பாய்வு" : "AI analysis"}
          </h3>
          {a.summary && <p className="mb-3 text-sm leading-relaxed text-slate-700">{a.summary}</p>}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <div className="mb-1 text-xs font-extrabold text-emerald-800">{isTa ? "பலங்கள்" : "Strengths"}</div>
              <ul className="list-disc space-y-0.5 pl-4 text-xs text-emerald-900">
                {(a.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
                {!a.strengths?.length && <li>—</li>}
              </ul>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <div className="mb-1 text-xs font-extrabold text-red-800">{isTa ? "பலவீனங்கள்" : "Weaknesses"}</div>
              <ul className="list-disc space-y-0.5 pl-4 text-xs text-red-900">
                {(a.weaknesses || []).map((s, i) => <li key={i}>{s}</li>)}
                {!a.weaknesses?.length && <li>—</li>}
              </ul>
            </div>
          </div>
          {a.suggestions?.length > 0 && (
            <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3">
              <div className="mb-1 text-xs font-extrabold text-sky-800">{isTa ? "பரிந்துரைகள்" : "Suggestions"}</div>
              <ul className="list-disc space-y-0.5 pl-4 text-xs text-sky-900">
                {a.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-extrabold text-slate-900">{isTa ? "பாடம் வாரியாக" : "Score by topic"}</h3>
        <ul className="space-y-2.5">
          {(result.topics || []).map((t) => (
            <li key={t.topic}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold text-slate-700">{t.name}</span>
                <span className="text-slate-500">
                  <b className="text-slate-900">{fmtMarks(t.marks)}/{t.maxMarks}</b> · {t.percent}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${barTone(t.percent)}`} style={{ width: `${Math.max(t.percent, 3)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-extrabold text-slate-900">{isTa ? "ஒவ்வொரு வினாவும்" : "Question-by-question feedback"}</h3>
        <ul className="divide-y divide-slate-100">
          {(result.questions || []).map((q) => {
            const isOpen = open === q.id;
            const pct = q.maxMarks ? (q.marks / q.maxMarks) * 100 : 0;
            return (
              <li key={q.id} className="py-2">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : q.id)}
                  className="flex w-full items-center gap-2 text-left text-xs"
                >
                  {isOpen ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                  <span className="w-14 shrink-0 font-bold text-slate-800">{q.label}</span>
                  <span className="min-w-0 flex-1 truncate text-slate-600">{q.question}</span>
                  <span className={`shrink-0 rounded-md px-1.5 py-0.5 font-bold text-white ${barTone(pct)}`}>
                    {fmtMarks(q.marks)}/{q.maxMarks}
                  </span>
                </button>
                {isOpen && (
                  <div className="mt-2 space-y-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed">
                    <p className="font-semibold text-slate-800">{q.question}</p>
                    <p>
                      <span className="font-bold text-slate-500">{isTa ? "உங்கள் விடை: " : "Your answer: "}</span>
                      <span className="whitespace-pre-wrap text-slate-700">{q.studentAnswer || (isTa ? "(விடை இல்லை)" : "(not answered)")}</span>
                    </p>
                    {q.correctAnswer ? (
                      <p>
                        <span className="font-bold text-emerald-700">{isTa ? "சரியான விடை: " : "Correct answer: "}</span>
                        {q.correctAnswer}
                      </p>
                    ) : null}
                    {q.modelAnswer && (
                      <p className="rounded-lg border border-emerald-200 bg-white p-2">
                        <span className="font-bold text-emerald-700">{isTa ? "மாதிரி விடை: " : "Model answer: "}</span>
                        {q.modelAnswer}
                      </p>
                    )}
                    {q.missedPoints?.length > 0 && (
                      <div>
                        <span className="font-bold text-red-600">{isTa ? "விடுபட்டவை:" : "What was missing:"}</span>
                        <ul className="list-disc pl-4 text-slate-700">
                          {q.missedPoints.map((m, i) => <li key={i}>{m}</li>)}
                        </ul>
                      </div>
                    )}
                    {q.feedback && (
                      <p className="text-sky-800">
                        <span className="font-bold">{isTa ? "ஆலோசனை: " : "Tip: "}</span>
                        {q.feedback}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

/* ── Main view ────────────────────────────────────────────────────────────── */

const PrePostTestView = ({ language = "en" }) => {
  const isTa = language === "ta";
  const user = auth.currentUser;

  const [events, setEvents] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [paper, setPaper] = useState(null);
  const [paperError, setPaperError] = useState("");

  const [screen, setScreen] = useState("home"); // home | intro | taking | rating | result
  const [testNumber, setTestNumber] = useState(1);
  const [answers, setAnswers] = useState({});
  const [choices, setChoices] = useState({ 11: "a", 12: "a" });
  const [startedAt, setStartedAt] = useState(null);
  const [grading, setGrading] = useState({ status: "idle", result: null }); // idle | running | done | error
  const [pendingPayload, setPendingPayload] = useState(null);
  const [qIndex, setQIndex] = useState(0); // which question is on screen
  const [grant, setGrant] = useState(null); // admin retake permission (retakeGrants/{uid})
  const [warnings, setWarnings] = useState([]); // [{ type, at }] full-screen / tab-switch events
  const [blocked, setBlocked] = useState(null); // null | "enter" | warning type — hides the paper
  const [confirmOpen, setConfirmOpen] = useState(false);
  const lastWarnRef = useRef(0);
  const submittingRef = useRef(false);

  // No AI help anywhere near the exam: hide the mascot while the paper,
  // the instructions or the rating page are on screen.
  useHideMascot(screen === "intro" || screen === "taking" || screen === "rating");

  const loadEvents = useCallback(async () => {
    if (!user) return;
    setLoadError("");
    try {
      const snap = await getDocs(query(collection(db, "activityLog"), where("uid", "==", user.uid)));
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((e) => e.module === PREPOST_MODULE));
      setGrant(await fetchOwnRetakeGrant(user.uid));
    } catch (err) {
      console.error("Failed to load test status:", err);
      setLoadError(isTa ? "தேர்வு நிலையை ஏற்ற முடியவில்லை." : "Could not load your test status.");
    }
  }, [user, isTa]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    let cancelled = false;
    setPaperError("");
    fetchPrePostTest(language)
      .then((p) => !cancelled && setPaper(p))
      .catch(() => !cancelled && setPaperError(isTa ? "வினாத்தாளை ஏற்ற முடியவில்லை." : "Could not load the question paper. Is the server running?"));
    return () => {
      cancelled = true;
    };
  }, [language, isTa]);

  const summary = useMemo(() => prePostSummary(events || []), [events]);

  // Autosave the answer sheet so a refresh or dropped connection loses nothing.
  useEffect(() => {
    if (screen === "taking" && user) writeDraft(user.uid, testNumber, { answers, choices, startedAt, warnings });
  }, [answers, choices, startedAt, warnings, screen, testNumber, user]);

  // Watch for leaving the exam while the paper is open.
  useEffect(() => {
    if (screen !== "taking") return undefined;
    const fsOn = fullscreenSupported();

    const warn = (type) => {
      if (submittingRef.current) return;
      const now = Date.now();
      if (now - lastWarnRef.current < 1500) return; // one action often fires several events
      lastWarnRef.current = now;
      setWarnings((prev) => [...prev, { type, at: new Date(now).toISOString() }]);
      setBlocked(type);
    };
    const onFullscreenChange = () => {
      if (fsOn && !isFullscreen()) warn("left-fullscreen");
    };
    const onVisibility = () => {
      if (document.hidden) warn("switched-tab");
    };
    // Losing window focus only counts if it lasts: a notification or system
    // pop-up can steal focus for a moment without the student doing anything.
    let blurTimer = null;
    const onBlur = () => {
      clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        if (!document.hasFocus()) warn("switched-window");
      }, 2000);
    };
    const onFocus = () => clearTimeout(blurTimer);
    const block = (e) => e.preventDefault();

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    ["copy", "cut", "paste", "contextmenu"].forEach((t) => document.addEventListener(t, block));

    // Full screen can be refused (e.g. the click didn't count as a gesture) —
    // then ask once more without counting it as a warning.
    const check = setTimeout(() => {
      if (fsOn && !isFullscreen()) setBlocked((b) => b || "enter");
    }, 900);

    return () => {
      clearTimeout(check);
      clearTimeout(blurTimer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      ["copy", "cut", "paste", "contextmenu"].forEach((t) => document.removeEventListener(t, block));
    };
  }, [screen]);

  // Leaving the Tests page mid-exam must not leave the browser stuck in full screen.
  useEffect(() => () => exitFullscreen(), []);

  const sectionQuestions = useMemo(() => {
    const out = { A: [], B: [], C: {} };
    (paper?.questions || []).forEach((q) => {
      if (q.section === "C") {
        out.C[q.number] = out.C[q.number] || {};
        out.C[q.number][q.choice] = q;
      } else if (out[q.section]) {
        out[q.section].push(q);
      }
    });
    return out;
  }, [paper]);

  const countedIds = useMemo(() => {
    const ids = [...sectionQuestions.A, ...sectionQuestions.B].map((q) => q.id);
    Object.entries(sectionQuestions.C).forEach(([num, alts]) => {
      const q = alts[choices[num] || "a"];
      if (q) ids.push(q.id);
    });
    return ids;
  }, [sectionQuestions, choices]);

  const answeredCount = countedIds.filter((id) => String(answers[id] ?? "").trim() !== "").length;

  const items = useMemo(
    () => [
      ...sectionQuestions.A.map((q) => ({ key: q.id, number: q.number, section: "A", q })),
      ...sectionQuestions.B.map((q) => ({ key: q.id, number: q.number, section: "B", q })),
      ...Object.entries(sectionQuestions.C).map(([num, alts]) => ({ key: `C${num}`, number: Number(num), section: "C", alts })),
    ],
    [sectionQuestions]
  );

  const itemAnswered = (item) => {
    const q = item.q || item.alts[choices[item.number] || "a"];
    return q ? String(answers[q.id] ?? "").trim() !== "" : false;
  };

  // View the latest attempt (rating it first if that hasn't been done yet).
  const openTest = (n) => {
    setTestNumber(n);
    const s = summary[n];
    if (s.result && !s.rating) {
      setGrading({ status: "done", result: s.result });
      setPendingPayload({ attemptId: s.attemptId });
      setScreen("rating");
    } else if (s.result) {
      setGrading({ status: "done", result: s.result });
      setScreen("result");
    } else {
      setScreen("intro");
    }
  };

  // First attempt, or a retake the admin has allowed.
  const openFreshAttempt = (n) => {
    if (summary[n].result && !retakeAllowed(summary, grant, n)) return;
    setTestNumber(n);
    setScreen("intro");
  };

  const startTest = () => {
    const draft = user ? readDraft(user.uid, testNumber) : null;
    setAnswers(draft?.answers || {});
    setChoices(draft?.choices || { 11: "a", 12: "a" });
    setStartedAt(draft?.startedAt || Date.now());
    setWarnings(draft?.warnings || []);
    setBlocked(null);
    setConfirmOpen(false);
    submittingRef.current = false;
    lastWarnRef.current = Date.now(); // entering full screen itself fires events
    setQIndex(0);
    enterFullscreen();
    setScreen("taking");
    window.scrollTo({ top: 0 });
  };

  const runGrading = useCallback(
    async (payload) => {
      setGrading({ status: "running", result: null });
      try {
        const res = await submitPrePostTest(payload);
        const meta = {
          testNumber: payload.testNumber,
          testName: TEST_NAMES[payload.testNumber],
          score: res.score,
          maxScore: res.maxScore,
          percent: res.percent,
          sections: res.sections,
          topics: res.topics,
          questions: res.questions,
          analysis: res.analysis || null,
          language: payload.language,
          durationSec: payload.durationSec,
          answeredCount: payload.answeredCount,
          attemptId: payload.attemptId,
          attemptNo: payload.attemptNo,
          integrity: payload.integrity,
        };
        await saveActivity(PREPOST_MODULE, "submitted", meta);
        if (user) clearDraft(user.uid, payload.testNumber);
        setGrading({ status: "done", result: meta });
        loadEvents();
      } catch (err) {
        console.error("Test marking failed:", err);
        setGrading({ status: "error", result: null });
      }
    },
    [user, loadEvents]
  );

  const unansweredCount = countedIds.length - answeredCount;

  const doSubmit = (autoSubmitted = false) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setConfirmOpen(false);
    setBlocked(null);
    exitFullscreen();

    const payloadAnswers = {};
    countedIds.forEach((id) => {
      if (answers[id] !== undefined && String(answers[id]).trim() !== "") payloadAnswers[id] = answers[id];
    });
    const payload = {
      testNumber,
      language,
      answers: payloadAnswers,
      durationSec: startedAt ? Math.round((Date.now() - startedAt) / 1000) : null,
      answeredCount,
      attemptId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      attemptNo: summary[testNumber].attempts.length + 1,
      integrity: {
        warnings: warnings.length,
        events: warnings,
        fullscreenSupported: fullscreenSupported(),
        autoSubmitted,
      },
    };
    setPendingPayload(payload);
    setScreen("rating");
    window.scrollTo({ top: 0 });
    runGrading(payload);
  };

  // Too many warnings: submit what has been written so far.
  useEffect(() => {
    if (screen === "taking" && warnings.length >= MAX_WARNINGS) doSubmit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warnings.length, screen]);

  const onRated = (rating) => {
    setEvents((prev) => [
      ...(prev || []),
      { id: `local-${Date.now()}`, module: PREPOST_MODULE, action: "rating", meta: rating, timestamp: new Date() },
    ]);
    setScreen("result");
    window.scrollTo({ top: 0 });
  };

  const backHome = () => {
    setScreen("home");
    loadEvents();
  };

  if (!user) return null;

  /* ── Home: the two test cards ── */
  if (screen === "home") {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900">
            <ClipboardCheck size={20} className="text-brand-600" />
            {isTa ? "Test 1 மற்றும் Test 2" : "Test 1 and Test 2"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {isTa
              ? "ஒரே வினாத்தாள், இரண்டு முறை. Test 1: தளத்தைப் பயன்படுத்தும் முன். Test 2: பயன்படுத்திய பின். ஆசிரியர் அனுமதித்தால் மட்டுமே மீண்டும் எழுத முடியும்."
              : "The same paper, taken twice. Test 1: before using the platform. Test 2: after using it. Each test can be taken once, unless your teacher allows a retake."}
          </p>
        </div>

        {loadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{loadError}</div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((n) => {
            const s = summary[n];
            const done = Boolean(s.result);
            const canRetake = done && retakeAllowed(summary, grant, n);
            return (
              <div key={n} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900">{TEST_NAMES[n]}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      canRetake
                        ? "bg-amber-100 text-amber-700"
                        : done
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {canRetake
                      ? isTa ? "மீண்டும் எழுத அனுமதி" : "Retake allowed"
                      : done
                      ? isTa ? "முடிந்தது" : "Completed"
                      : isTa ? "எழுதவில்லை" : "Not taken"}
                  </span>
                </div>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-500">
                  {n === 1
                    ? isTa
                      ? "தளத்தில் நுழைந்தவுடன் எழுதவும். மதிப்பெண் மட்டும் காட்டப்படும் — விடைகளோ ஆலோசனைகளோ இல்லை."
                      : "Take this right after joining. Only your score is shown — no answers or suggestions."
                    : isTa
                    ? "தளத்தைப் பயன்படுத்திய பின் எழுதவும். AI உங்கள் விடைகளைப் பகுப்பாய்ந்து ஆலோசனைகள் தரும்."
                    : "Take this after using the platform. AI analyses every answer and gives suggestions."}
                </p>
                {done && (
                  <div className="mt-3 rounded-xl bg-slate-50 p-3 text-center">
                    <div className="text-2xl font-extrabold text-slate-900">
                      {fmtMarks(s.result.score)}
                      <span className="text-sm text-slate-400"> / {s.result.maxScore}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {s.submittedAt?.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {s.attempts.length > 1 && ` · ${isTa ? "முயற்சி" : "attempt"} ${s.attempts.length}`}
                    </div>
                  </div>
                )}
                {canRetake && (
                  <button
                    type="button"
                    onClick={() => openFreshAttempt(n)}
                    className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-sm font-bold text-white shadow-pop transition-all hover:brightness-110 active:scale-95"
                  >
                    <RotateCcw size={15} />
                    {isTa ? `${TEST_NAMES[n]} மீண்டும் எழுது` : `Retake ${TEST_NAMES[n]}`}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => (done ? openTest(n) : openFreshAttempt(n))}
                  disabled={events === null}
                  className={`${canRetake ? "mt-2" : "mt-4"} flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 ${
                    done
                      ? "border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                      : "bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-pop hover:brightness-110"
                  }`}
                >
                  {done
                    ? s.rating
                      ? isTa ? "முடிவைப் பார்" : "View result"
                      : isTa ? "மதிப்பிட்டு முடிவைப் பார்" : "Rate & view result"
                    : isTa ? `${TEST_NAMES[n]} தொடங்கு` : `Start ${TEST_NAMES[n]}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Instructions ── */
  if (screen === "intro") {
    const test1Missing = testNumber === 2 && !summary[1].result;
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <button type="button" onClick={backHome} className="mb-3 flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-600">
          <ArrowLeft size={14} /> {isTa ? "பின்செல்" : "Back"}
        </button>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
          {TEST_NAMES[testNumber]} — {paper?.title || ""}
        </h2>
        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
          <li>{isTa ? "மொத்த மதிப்பெண்: 25. பகுதி அ: 5 × 1, பகுதி ஆ: 5 × 2, பகுதி இ: 2 × 5." : "Total 25 marks. Part A: 5 × 1, Part B: 5 × 2, Part C: 2 × 5."}</li>
          <li>{isTa ? "பகுதி இ-யில் ஒவ்வொரு வினாவிலும் (அ) அல்லது (ஆ) ஒன்றுக்கு மட்டும் விடையளி." : "In Part C, answer only one of (a) OR (b) in each question."}</li>
          <li>{isTa ? "கணக்குகளில் சூத்திரம், படிகள், அலகுடன் விடை எழுதவும்." : "For sums, write the formula, the steps and the answer with its unit."}</li>
          <li>{isTa ? "தமிழிலோ ஆங்கிலத்திலோ விடை எழுதலாம்." : "You may answer in English or Tamil."}</li>
          <li>{isTa ? "தேர்வின் போது AI உதவி கிடைக்காது." : "No AI help is available during the test."}</li>
          <li className="font-semibold text-red-700">
            {isTa
              ? `தேர்வு முழுத் திரையில் நடக்கும். முழுத் திரையிலிருந்து வெளியேறினால் அல்லது வேறு தாவல்/சாளரத்துக்குச் சென்றால் எச்சரிக்கை பதிவாகும்; ${MAX_WARNINGS} எச்சரிக்கைகளுக்குப் பின் தேர்வு தானாகச் சமர்ப்பிக்கப்படும். நகலெடுத்தல் / ஒட்டுதல் முடக்கப்பட்டுள்ளது.`
              : `The test runs in full screen. Leaving full screen or switching tab/window gives a warning that your teacher can see; after ${MAX_WARNINGS} warnings the test is submitted automatically. Copy and paste are turned off.`}
          </li>
          <li>{isTa ? "ஒரு வினா ஒரு முறை காட்டப்படும்; முந்தைய / அடுத்த பொத்தான்களால் நகரலாம். உங்கள் விடைகள் தானாகச் சேமிக்கப்படும்." : "Questions are shown one at a time — use Previous / Next to move. Your answers are saved automatically."}</li>
          <li>{isTa ? "ஆசிரியர் அனுமதித்தால் மட்டுமே மீண்டும் எழுத முடியும்." : "You can take it only once unless your teacher allows a retake."}</li>
          <li>
            {testNumber === 1
              ? isTa ? "முடிவில் மதிப்பெண் மட்டும் காட்டப்படும்." : "At the end you will see your score only."
              : isTa ? "முடிவில் ஒவ்வொரு விடைக்கும் AI ஆலோசனையும் பகுப்பாய்வும் காட்டப்படும்." : "At the end you will see AI feedback on every answer and an overall analysis."}
          </li>
          <li>{isTa ? "சமர்ப்பித்த பின், மதிப்பெண்ணைப் பார்க்கும் முன் தேர்வை மதிப்பிட வேண்டும்." : "After submitting, you must rate the test before you see your score."}</li>
        </ul>
        {test1Missing && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            {isTa ? "நீங்கள் இன்னும் Test 1 எழுதவில்லை. ஆசிரியர் கூறினால் மட்டும் தொடரவும்." : "You have not taken Test 1 yet. Continue only if your teacher asked you to."}
          </div>
        )}
        {paperError && <p className="mt-4 text-xs font-semibold text-red-600">{paperError}</p>}
        <button
          type="button"
          onClick={startTest}
          disabled={!paper}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 py-3 text-sm font-bold text-white shadow-pop transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          {!paper && !paperError ? <Loader2 size={16} className="animate-spin" /> : <ClipboardCheck size={16} />}
          {isTa ? "தேர்வைத் தொடங்கு" : "Start the test"}
        </button>
      </div>
    );
  }

  /* ── The exam: one question at a time, like the Student Test ── */
  if (screen === "taking" && paper && items.length) {
    const setAnswer = (id, value) => setAnswers((prev) => ({ ...prev, [id]: value }));
    const partLetter = (c) => (isTa ? { a: "அ", b: "ஆ" }[c] : c);
    const partName = (id) => (isTa ? `பகுதி ${{ A: "அ", B: "ஆ", C: "இ" }[id]}` : `Part ${id}`);
    const index = Math.min(qIndex, items.length - 1);
    const item = items[index];
    const pick = item.alts ? choices[item.number] || "a" : null;
    const q = item.q || item.alts[pick];
    const isLast = index === items.length - 1;
    const goTo = (i) => {
      setQIndex(Math.max(0, Math.min(items.length - 1, i)));
      window.scrollTo({ top: 0 });
    };
    const otherAlt = item.alts ? item.alts[pick === "a" ? "b" : "a"] : null;
    const fsOn = fullscreenSupported();
    const warningText = {
      "left-fullscreen": isTa ? "நீங்கள் முழுத் திரையிலிருந்து வெளியேறினீர்கள்." : "You left full screen.",
      "switched-tab": isTa ? "நீங்கள் வேறு தாவலுக்குச் சென்றீர்கள்." : "You switched to another tab.",
      "switched-window": isTa ? "நீங்கள் வேறு சாளரத்துக்குச் சென்றீர்கள்." : "You switched to another window or app.",
    };

    return (
      <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#faf8ff]">
      {/* Warning screen: hides the paper until the student returns */}
      {blocked && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
            {blocked === "enter" ? (
              <Maximize size={34} className="mx-auto text-brand-600" />
            ) : (
              <ShieldAlert size={34} className="mx-auto text-red-500" />
            )}
            <h3 className="mt-3 text-lg font-extrabold text-slate-900">
              {blocked === "enter"
                ? isTa ? "முழுத் திரையில் தேர்வு எழுதவும்" : "This test runs in full screen"
                : isTa ? `எச்சரிக்கை ${warnings.length} / ${MAX_WARNINGS}` : `Warning ${warnings.length} of ${MAX_WARNINGS}`}
            </h3>
            {blocked !== "enter" && <p className="mt-1 text-sm font-semibold text-red-600">{warningText[blocked]}</p>}
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              {blocked === "enter"
                ? isTa
                  ? "தொடர முழுத் திரைக்குச் செல்லவும். தேர்வின் போது முழுத் திரையிலிருந்தோ இந்தப் பக்கத்திலிருந்தோ வெளியேறக் கூடாது."
                  : "Go to full screen to continue. Do not leave full screen or this page during the test."
                : isTa
                ? `இது உங்கள் ஆசிரியருக்குப் பதிவு செய்யப்பட்டது. ${MAX_WARNINGS} எச்சரிக்கைகளுக்குப் பின் தேர்வு தானாகச் சமர்ப்பிக்கப்படும்.`
                : `This has been recorded for your teacher. After ${MAX_WARNINGS} warnings the test is submitted automatically.`}
            </p>
            <button
              type="button"
              onClick={() => {
                if (fsOn) enterFullscreen();
                lastWarnRef.current = Date.now();
                setBlocked(null);
              }}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 py-2.5 text-sm font-bold text-white shadow-pop hover:brightness-110 active:scale-95"
            >
              <Maximize size={15} />
              {fsOn
                ? isTa ? "முழுத் திரைக்குத் திரும்பித் தொடர்" : "Return to full screen and continue"
                : isTa ? "தேர்வைத் தொடர்" : "Continue the test"}
            </button>
          </div>
        </div>
      )}

      {/* In-page submit confirmation (a browser pop-up would drop full screen) */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900">
              {isTa ? `${TEST_NAMES[testNumber]} சமர்ப்பிக்கவா?` : `Submit ${TEST_NAMES[testNumber]}?`}
            </h3>
            {unansweredCount > 0 && (
              <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs font-semibold text-amber-800">
                {isTa ? `${unansweredCount} வினாக்களுக்கு விடை எழுதவில்லை.` : `${unansweredCount} question(s) are not answered.`}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              {isTa ? "சமர்ப்பித்த பின் விடைகளை மாற்ற முடியாது." : "You cannot change your answers after submitting."}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-100 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                {isTa ? "திரும்பு" : "Go back"}
              </button>
              <button
                type="button"
                onClick={() => doSubmit(false)}
                className="flex-1 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 py-2 text-xs font-bold text-white hover:brightness-110"
              >
                {isTa ? "சமர்ப்பி" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
        {/* Progress + question palette */}
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-extrabold text-slate-900">
              {TEST_NAMES[testNumber]} · {paper.title}
            </span>
            <span className="flex items-center gap-2 font-semibold text-slate-500">
              <Lock size={12} /> {isTa ? "AI உதவி இல்லை" : "No AI help"}
              <span className="text-slate-300">|</span>
              {answeredCount}/{countedIds.length} {isTa ? "விடையளிக்கப்பட்டது" : "answered"}
              {warnings.length > 0 && (
                <>
                  <span className="text-slate-300">|</span>
                  <span className="text-red-600">
                    <ShieldAlert size={12} className="-mt-0.5 mr-0.5 inline" />
                    {warnings.length}/{MAX_WARNINGS}
                  </span>
                </>
              )}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(answeredCount / countedIds.length) * 100}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {items.map((it, i) => {
              const current = i === index;
              const done = itemAnswered(it);
              return (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => goTo(i)}
                  title={`${partName(it.section)} · Q${it.number}`}
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                    current
                      ? "bg-[#0284c7] text-white ring-2 ring-brand-200"
                      : done
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {it.number}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#0284c7] px-2 py-0.5 text-[11px] font-bold uppercase text-white">
                {partName(item.section)}
              </span>
              <span className="rounded border border-brand-100 bg-brand-50 px-2 py-0.5 text-xs font-semibold text-[#0284c7]">
                {q.marks} {isTa ? "மதிப்பெண்" : q.marks === 1 ? "Mark" : "Marks"}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-500">
              {isTa ? "வினா:" : "Question:"} <span className="font-extrabold text-[#0284c7]">{index + 1}</span> / {items.length}
            </div>
          </div>

          {/* Part C: choose (a) OR (b) */}
          {item.alts && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                {["a", "b"].map((c) =>
                  item.alts[c] ? (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setChoices((prev) => ({ ...prev, [item.number]: c }))}
                      className={`rounded-md px-3 py-1 text-xs font-bold transition-all ${
                        pick === c ? "bg-white text-brand-700 shadow-xs" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      ({partLetter(c)}) {String(answers[item.alts[c].id] || "").trim() ? "✓" : ""}
                    </button>
                  ) : null
                )}
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {isTa ? "(அ) அல்லது (ஆ) — ஒன்றுக்கு மட்டும் விடையளி" : "Answer (a) OR (b) — only one"}
              </span>
            </div>
          )}

          <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <h3 className="text-sm font-bold leading-relaxed text-slate-900 sm:text-base">
              {item.number}.{item.alts ? ` (${partLetter(pick)})` : ""} {q.question}
            </h3>
          </div>

          {q.type === "mcq" ? (
            <div className="my-4 space-y-2.5">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                {isTa ? "சரியான விடையைத் தேர்ந்தெடுக்கவும்:" : "Choose the right answer:"}
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {q.options.map((opt, i) => {
                  const selected = String(answers[q.id]) === String(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAnswer(q.id, i)}
                      className={`flex items-center justify-between rounded-lg border p-3 text-left text-xs font-semibold transition-all ${
                        selected
                          ? "border-[#0284c7] bg-brand-50 text-[#0284c7] shadow-xs"
                          : "border-slate-200 bg-white text-slate-800 hover:border-brand-300"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold ${
                            selected ? "bg-[#0284c7] text-white" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span>{opt}</span>
                      </span>
                      {selected && <CheckCircle2 size={16} className="shrink-0 text-[#0284c7]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="my-4">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                {q.marks >= 5
                  ? isTa ? "விரிவாக விடையளி (சூத்திரம், படிகள், அலகு):" : "Answer in detail (formula, steps, unit):"
                  : isTa ? "சுருக்கமாக விடையளி:" : "Answer briefly:"}
              </label>
              <textarea
                value={answers[q.id] || ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                rows={q.marks >= 5 ? 9 : 5}
                placeholder={isTa ? "உங்கள் விடையை இங்கே எழுதவும்..." : "Write your answer here..."}
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-brand-100"
              />
              {otherAlt && String(answers[otherAlt.id] || "").trim() && (
                <p className="mt-1 text-[11px] font-semibold text-amber-700">
                  {isTa
                    ? "மற்ற தெரிவுக்கும் விடை எழுதியுள்ளீர்கள் — தற்போது தேர்ந்தெடுத்தது மட்டுமே திருத்தப்படும்."
                    : "You also wrote an answer for the other choice — only the one selected here will be marked."}
                </p>
              )}
            </div>
          )}

          {/* Previous / Next / Submit */}
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95 disabled:opacity-40"
            >
              <ChevronLeft size={15} />
              {isTa ? "முந்தைய" : "Previous"}
            </button>
            {isLast ? (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-cyan-600 px-5 py-2 text-sm font-bold text-white shadow-pop transition-all hover:brightness-110 active:scale-95"
              >
                <Send size={15} />
                {isTa ? `${TEST_NAMES[testNumber]} சமர்ப்பி` : `Submit ${TEST_NAMES[testNumber]}`}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                className="flex items-center gap-1 rounded-lg bg-[#0284c7] px-4 py-2 text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95"
              >
                {isTa ? "அடுத்த வினா" : "Next question"}
                <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
      </div>
    );
  }

  /* ── Mandatory rating ── */
  if (screen === "rating") {
    return <RatingPage testNumber={testNumber} attemptId={pendingPayload?.attemptId} isTa={isTa} onSaved={onRated} />;
  }

  /* ── Result ── */
  if (screen === "result") {
    const result = grading.result;
    const gain = testNumber === 2 && result ? improvement({ 1: summary[1], 2: { result } }) : null;
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <button type="button" onClick={backHome} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-600">
          <ArrowLeft size={14} /> {isTa ? "Test 1 / Test 2 பக்கத்துக்கு" : "Back to Test 1 / Test 2"}
        </button>

        {grading.status === "running" && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Loader2 size={30} className="animate-spin text-brand-600" />
            <p className="text-sm font-semibold text-slate-700">{isTa ? "உங்கள் விடைகள் திருத்தப்படுகின்றன..." : "Marking your answers..."}</p>
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <Clock size={12} /> {isTa ? "சில விநாடிகள் ஆகலாம்" : "This can take a few seconds"}
            </p>
          </div>
        )}

        {grading.status === "error" && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertTriangle size={26} className="mx-auto text-red-500" />
            <p className="mt-2 text-sm font-semibold text-red-700">
              {isTa ? "திருத்த முடியவில்லை. உங்கள் விடைகள் பாதுகாப்பாக உள்ளன." : "Marking failed. Your answers are safe."}
            </p>
            <button
              type="button"
              onClick={() => pendingPayload && runGrading(pendingPayload)}
              disabled={!pendingPayload}
              className="mx-auto mt-3 flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              <RefreshCw size={14} /> {isTa ? "மீண்டும் முயற்சி" : "Try again"}
            </button>
          </div>
        )}

        {grading.status === "done" && result && (
          <>
            <ScoreHeader result={result} testNumber={testNumber} isTa={isTa} gain={gain} />
            {testNumber === 1 ? (
              <p className="rounded-xl border border-slate-200 bg-white p-4 text-center text-xs text-slate-500">
                {isTa
                  ? "உங்கள் மதிப்பெண் பதிவு செய்யப்பட்டது. இப்போது தளத்தின் பாடங்களைப் பயன்படுத்துங்கள்; Test 2-இல் விரிவான AI ஆலோசனை கிடைக்கும்."
                  : "Your score has been recorded. Now use the lessons on the platform — Test 2 will give you detailed AI feedback."}
              </p>
            ) : (
              <Test2Review result={result} isTa={isTa} />
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={24} className="animate-spin text-brand-600" />
    </div>
  );
};

export default PrePostTestView;
