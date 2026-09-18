import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX, Send, RefreshCw, Sparkles } from "lucide-react";
import { fetchMascotHint } from "../api";
import { useMascotTestQuestion, useMascotHidden } from "../mascotContext";
import ArkMessage, { arkReplyToSpeech } from "./ArkMessage";

// ─── Panda Mascot "Ark" — photoreal poses, not drawn ───────────────────────────
// Assets live in public/mascot/ (optimized WebP, ~30KB each, all cropped to the
// same frame so switching poses never shifts or rescales the character).
const MASCOT_BASE = `${process.env.PUBLIC_URL}/mascot`;
const MASCOT_POSES = {
  standing: `${MASCOT_BASE}/standing.webp`, // default idle pose
  wave: `${MASCOT_BASE}/hi.webp`, // shown only for the one-time "Hi, I'm Ark" intro
  thinking: `${MASCOT_BASE}/thinking.webp`,
  searching: `${MASCOT_BASE}/search.webp`, // fetching a hint/answer from the server
  explainPoint: `${MASCOT_BASE}/explain_1.webp`, // normal "let me explain" state
  explainCheer: `${MASCOT_BASE}/explain_2.webp`, // celebrating / delivering a clue
};

const pickMascotPose = ({ open, mood, isLoading, introducing, loadingFrame }) => {
  if (introducing) return MASCOT_POSES.wave;
  // While waiting on the AI, Ark visibly works the problem: he thinks about
  // it, then looks it up in his book, then thinks again — the two frames
  // alternate so the wait reads as activity rather than a frozen image.
  if (isLoading) return loadingFrame % 2 === 0 ? MASCOT_POSES.thinking : MASCOT_POSES.searching;
  if (!open) return MASCOT_POSES.standing;
  if (mood === "thinking") return MASCOT_POSES.thinking;
  if (mood === "celebrating") return MASCOT_POSES.explainCheer;
  return MASCOT_POSES.explainPoint;
};

const MascotImage = ({ pose, height = 265 }) => {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [pose]);

  if (broken) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-cyan-500 text-white shadow-md"
        style={{ height, width: height }}
      >
        <Sparkles size={height * 0.4} />
      </div>
    );
  }

  return (
    <img
      src={pose}
      alt=""
      draggable="false"
      onError={() => setBroken(true)}
      className="pointer-events-none select-none drop-shadow-lg"
      style={{ height, width: "auto" }}
    />
  );
};

// ─── Typewriter Hook ───────────────────────────────────────────────────────────
function useTypewriter(text, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    if (!text) return;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(iv); setDone(true); }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  return { displayed, done };
}

const INTRO_KEY = "ark_introduced";

// ─── Main Component ────────────────────────────────────────────────────────────
// Two personalities depending on where it's mounted:
//  - Normal pages (no active test question): "doubt clarifier" — the student
//    can ask any question and Ark answers directly, in simple, word-limited
//    language (mode: "explain").
//  - Test module / video passage module: "clue giver" — Socratic hints only,
//    never the direct answer (mode: "clue"), exactly as before.
const FloatingMascotBot = ({ language = "en", currentQuestion = "" }) => {
  const isTa = language === "ta";

  // A directly-passed prop wins (kept for backward compatibility); otherwise
  // this single global instance picks up "there's a test/video question on
  // screen" from context, published by StudentTestView/VideoLessonView
  // without any route wiring.
  const ctxQuestion = useMascotTestQuestion();
  const hiddenForExam = useMascotHidden();
  const activeQuestion = currentQuestion || ctxQuestion.question;
  const activeCategory = ctxQuestion.category;
  const activeOptions = currentQuestion ? [] : ctxQuestion.options;
  const activeAnswer = currentQuestion ? "" : ctxQuestion.answer;
  const isClueMode = Boolean(activeQuestion && activeQuestion.trim());

  // ── Shared State
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState("happy");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [introducing, setIntroducing] = useState(false);

  // ── Doubt-clarifier state (normal pages)
  const [doubtStatus, setDoubtStatus] = useState("idle"); // idle | answering | answered
  const [doubtMsg, setDoubtMsg] = useState("");
  const [doubtInput, setDoubtInput] = useState("");
  const [lastDoubt, setLastDoubt] = useState("");
  const [doubtLoading, setDoubtLoading] = useState(false);
  const inputRef = useRef(null);

  // ── Clue-giver state (test/video pages)
  const [testMsg, setTestMsg] = useState("");
  const [testHintLevel, setTestHintLevel] = useState(0);
  const [testLoading, setTestLoading] = useState(false);
  const prevTestQ = useRef("");

  const isLoading = isClueMode ? testLoading : doubtLoading;

  // Drives the think → read → think pose cycle while a request is in flight.
  const [loadingFrame, setLoadingFrame] = useState(0);
  useEffect(() => {
    if (!isLoading) {
      setLoadingFrame(0);
      return undefined;
    }
    const iv = setInterval(() => setLoadingFrame((f) => f + 1), 1100);
    return () => clearInterval(iv);
  }, [isLoading]);

  // Typewriter targets
  const typeTarget = isClueMode ? testMsg : doubtMsg;
  const { displayed, done } = useTypewriter(typeTarget, 10);

  // Reset clue state when the active question changes. The bubble is closed
  // too, so a clue for the previous question (or a doubt answer from before
  // the quiz started) never stays on screen next to a new question — the
  // student taps Ark again for a fresh clue.
  useEffect(() => {
    if (activeQuestion !== prevTestQ.current) {
      prevTestQ.current = activeQuestion;
      setTestHintLevel(0);
      setTestMsg("");
      setMood("thinking");
      setOpen(false);
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  }, [activeQuestion]);

  // Focus the doubt box once it's showing
  useEffect(() => {
    if (!isClueMode && (doubtStatus === "idle" || doubtStatus === "answered") && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [doubtStatus, isClueMode]);

  // A one-time "Hi, I'm Ark" prefix — consumed once ever, across every page.
  const consumeIntroPrefix = () => {
    if (localStorage.getItem(INTRO_KEY) === "true") return "";
    localStorage.setItem(INTRO_KEY, "true");
    setIntroducing(true);
    // Own line, so the reply's bold title after it still renders as a title.
    return isTa ? "வணக்கம்! நான் ஆர்க் 🐼\n" : "Hi, I'm Ark! 🐼\n";
  };

  // Drop the "just introducing" wave pose once the intro text has finished typing.
  useEffect(() => {
    if (introducing && done) {
      const t = setTimeout(() => setIntroducing(false), 600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [introducing, done]);

  // ── Ask a doubt (normal pages)
  const handleAskDoubt = async () => {
    const doubt = doubtInput.trim();
    if (!doubt) return;
    setDoubtInput("");
    setLastDoubt(doubt);
    setDoubtStatus("answering");
    setDoubtLoading(true);
    setMood("thinking");
    setDoubtMsg("");
    try {
      const res = await fetchMascotHint({
        message: doubt,
        context_question: doubt,
        history: [],
        language,
        mode: "explain",
      });
      setDoubtMsg(res?.response || (isTa ? "🐼 மீண்டும் கேளுங்கள்!" : "🐼 Ask me again!"));
      setMood("celebrating");
    } catch {
      setDoubtMsg(isTa ? "⚠️ பதில் கிடைக்கவில்லை. மீண்டும் முயற்சிக்கவும்." : "⚠️ No answer came. Please try again.");
      setMood("thinking");
    } finally {
      setDoubtLoading(false);
      setDoubtStatus("answered");
    }
  };

  // ── Open mascot
  const handleMascotClick = async () => {
    if (open) return;
    setOpen(true);
    const introPrefix = consumeIntroPrefix();

    if (isClueMode) {
      if (!testMsg) {
        setTestLoading(true);
        setMood("thinking");
        setTestMsg(introPrefix + (isTa ? "வினாவை பகுப்பாய்கிறேன்…" : "Reading your question…"));
        try {
          const res = await fetchMascotHint({
            message: `Give a short concept clue (1-2 sentences) for this ${activeCategory || ""} question without revealing the answer: "${activeQuestion}". Keep it simple.`,
            context_question: activeQuestion,
            history: [],
            language,
            mode: "clue",
            options: activeOptions,
            answer: activeAnswer,
          });
          setTestMsg(introPrefix + (res?.response || (isTa ? "📖 பாடத்தை நினையுங்கள்!" : "📖 Think about what you learned!")));
          setTestHintLevel(1);
          setMood("thinking");
        } catch {
          setTestMsg(introPrefix + (isTa ? "📖 பாடத்தை மீண்டும் படியுங்கள்." : "📖 Look at your textbook notes."));
        } finally {
          setTestLoading(false);
        }
      }
    } else {
      setLastDoubt("");
      setDoubtStatus("idle");
      setDoubtMsg(introPrefix + (isTa ? "உங்கள் சந்தேகத்தை எளிய வார்த்தைகளில் கேளுங்கள்! 👇" : "**Hi! Ask me anything 👇**\n- Type your question below.\n- I will explain it in easy words."));
      setMood("happy");
    }
  };

  // ── Next hint on clue pages (on continue click)
  const handleTestContinue = async () => {
    if (testHintLevel >= 2) {
      setTestMsg(isTa
        ? "🌟 நீங்களே யோசித்து விடை கண்டுபிடியுங்கள் — அது உண்மையான கற்றல்! 👍"
        : "🌟 You can do it! Try to answer on your own. 👍");
      setMood("celebrating");
      setTestHintLevel(3);
      return;
    }
    setTestLoading(true);
    setMood("thinking");
    try {
      const res = await fetchMascotHint({
        message: `Give a second, slightly stronger clue (1-2 sentences) for: "${activeQuestion}" — e.g. a way to rule out wrong choices or a related everyday situation. Do NOT reveal the answer or name any of the options.`,
        context_question: activeQuestion,
        history: [],
        language,
        mode: "clue",
        options: activeOptions,
        answer: activeAnswer,
      });
      setTestMsg(res?.response || (isTa ? "📐 சூத்திரத்தை பயன்படுத்துங்கள்!" : "📐 Think about the formula!"));
      setTestHintLevel(2);
    } catch {
      setTestMsg(isTa ? "📐 தவறான விடைகளை நீக்கி சரியானதை தேர்வு செய்யுங்கள்." : "📐 First, cross out the answers you know are wrong.");
    } finally {
      setTestLoading(false);
    }
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setOpen(false);
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const handleSpeak = (e) => {
    e.stopPropagation();
    if (!("speechSynthesis" in window)) return;
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(arkReplyToSpeech(typeTarget));
    u.lang = isTa ? "ta-IN" : "en-US";
    u.rate = 0.95;
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  // ── Labels
  const testLevelLabel = ["", isTa ? "குறிப்பு 1" : "Clue 1", isTa ? "குறிப்பு 2" : "Clue 2", isTa ? "ஊக்கம்" : "Go!"];
  const headerLabel = isClueMode
    ? (testLevelLabel[testHintLevel] || (isTa ? "குறிப்பு" : "Clue"))
    : (isTa ? "ஆர்க்" : "Ark");
  // Clue level colour-codes the header: first clues stay brand blue, the
  // second (bigger giveaway) goes amber, and the "you've got this" nudge
  // lands on green.
  const headerGradient = isClueMode
    ? [
        "from-brand-600 to-cyan-600",
        "from-brand-600 to-cyan-600",
        "from-amber-500 to-orange-500",
        "from-emerald-600 to-teal-600",
      ][testHintLevel] || "from-brand-600 to-cyan-600"
    : "from-brand-600 to-cyan-600";

  const currentPose = pickMascotPose({ open, mood, isLoading, introducing, loadingFrame });
  const showDoubtInput = !isClueMode && (doubtStatus === "idle" || doubtStatus === "answered") && done;
  const showTestContinue = isClueMode && !testLoading && testHintLevel < 3 && testHintLevel > 0 && done;

  if (hiddenForExam) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2 select-none">

      {/* ── Speech Bubble ──────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="bubble"
            initial={{ opacity: 0, y: 10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.92 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="relative overflow-hidden rounded-[26px] bg-white ring-1 ring-brand-100"
            style={{ width: 350, boxShadow: "0 18px 45px -12px rgba(2,132,199,0.45), 0 4px 14px rgba(15,23,42,0.08)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between bg-gradient-to-r px-4 py-2.5 ${headerGradient} transition-colors duration-300`}>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[13px] backdrop-blur-sm">
                  🐼
                </span>
                <span className="font-ark text-[16px] font-semibold tracking-wide text-white">{headerLabel}</span>
                {isLoading
                  ? <RefreshCw size={13} className="ml-0.5 animate-spin text-white/80" />
                  : <span className="ml-0.5 h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.9)]" />
                }
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleSpeak}
                  title={isTa ? "வாசித்துக் காட்டு" : "Read aloud"}
                  className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
                >
                  {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
                <button
                  onClick={handleClose}
                  title={isTa ? "மூடு" : "Close"}
                  className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Body: the student's question (doubt mode), then Ark's structured reply */}
            <div className="max-h-[48vh] min-h-[68px] overflow-y-auto bg-gradient-to-b from-brand-50/60 to-white px-4 pb-2 pt-3.5">
              {!isClueMode && lastDoubt && (
                <div className="mb-2.5 flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-brand-600 to-cyan-600 px-3 py-1.5 font-ark text-[14px] text-white shadow-sm">
                    {lastDoubt}
                  </div>
                </div>
              )}
              {isLoading && !typeTarget ? (
                <div className="flex items-center gap-2 py-1.5">
                  {[0,1,2].map(i => (
                    <span key={i} className="h-2 w-2 rounded-full bg-brand-500 animate-bounce"
                      style={{ animationDelay: `${i * 0.14}s` }} />
                  ))}
                  <span className="font-ark text-[14px] text-slate-400">{isTa ? "யோசிக்கிறேன்…" : "Thinking…"}</span>
                </div>
              ) : (
                <ArkMessage text={displayed} typing={!done} />
              )}
            </div>

            {/* Doubt input (normal pages) */}
            {showDoubtInput && (
              <div className="px-4 pb-4">
                <div className="mt-1 flex items-center gap-1.5 rounded-2xl border-2 border-brand-100 bg-white p-1 pl-3.5 transition-colors focus-within:border-brand-400">
                  <input
                    ref={inputRef}
                    type="text"
                    value={doubtInput}
                    onChange={(e) => setDoubtInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAskDoubt()}
                    placeholder={isTa ? "உங்கள் சந்தேகம்..." : "Type your question..."}
                    className="min-w-0 flex-1 bg-transparent py-1.5 font-ark text-[15px] text-slate-800 outline-none placeholder:text-slate-400"
                  />
                  <button
                    onClick={handleAskDoubt}
                    disabled={!doubtInput.trim()}
                    title={isTa ? "அனுப்பு" : "Send"}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-cyan-600 text-white shadow-pop transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:shadow-none"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Test/video page: More Clue */}
            {showTestContinue && (
              <div className="px-4 pb-4 pt-1">
                <button
                  onClick={handleTestContinue}
                  className="w-full rounded-2xl border-2 border-brand-100 bg-brand-50 py-2.5 font-ark text-[15px] font-semibold text-brand-700 transition-all hover:border-brand-300 hover:bg-brand-100 active:scale-95"
                >
                  {isTa ? "▶ மேலும் குறிப்பு" : "▶ Give me another clue"}
                </button>
              </div>
            )}

            {/* Tail pointer */}
            <div className="absolute -bottom-[7px] right-8 h-3.5 w-3.5 rotate-45 border-b border-r border-brand-100 bg-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mascot Avatar ────────────────────────────────────────────── */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.93 }}
        animate={open ? { y: 0 } : { y: [0, -6, 0], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
        onClick={handleMascotClick}
        className="flex flex-col items-center cursor-pointer focus:outline-none"
        title={isTa ? "ஆர்க் — கிளிக் செய்!" : "Ark — click me!"}
      >
        {/* Keyed on the pose so each swap remounts and fades in. Deliberately
            not wrapped in AnimatePresence: "wait" mode holds the outgoing
            frame until its exit finishes, which stalls the think/read cycle
            mid-request — the pose would never visibly change. */}
        <motion.div
          key={currentPose}
          initial={{ opacity: 0.35, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <MascotImage pose={currentPose} height={265} />
        </motion.div>
        {!open && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="-mt-1 rounded-full bg-gradient-to-r from-brand-600 to-cyan-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-pop"
          >
            {isTa ? "கிளிக்" : "Click"}
          </motion.span>
        )}
      </motion.button>

    </div>
  );
};

export default FloatingMascotBot;
