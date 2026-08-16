import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX, Send, RefreshCw } from "lucide-react";
import { fetchMascotQuestion, checkMascotAnswer, fetchMascotHint } from "../api";

// ─── Owl Mascot SVG ────────────────────────────────────────────────────────────
const OwlMascot = ({ mood = "happy", size = 56 }) => {
  const isThinking = mood === "thinking";
  const isCelebrating = mood === "celebrating";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      className="select-none pointer-events-none drop-shadow-md">
      <circle cx="50" cy="52" r="42" fill={isCelebrating ? "#fef9c3" : isThinking ? "#dbeafe" : "#e0f2fe"} opacity="0.7" />
      <rect x="22" y="30" width="56" height="54" rx="28" fill="#1e3a8a" />
      <rect x="25" y="32" width="50" height="50" rx="25" fill={isThinking ? "#1d4ed8" : "#2563eb"} />
      <ellipse cx="50" cy="63" rx="19" ry="16" fill="#eff6ff" />
      <circle cx="37" cy="46" r="12" fill="#fff" stroke="#1e3a8a" strokeWidth="2" />
      <circle cx="63" cy="46" r="12" fill="#fff" stroke="#1e3a8a" strokeWidth="2" />
      {isThinking ? (
        <><circle cx="41" cy="43" r="5.5" fill="#0f172a" /><circle cx="67" cy="43" r="5.5" fill="#0f172a" />
          <circle cx="43" cy="41" r="1.8" fill="#fff" /><circle cx="69" cy="41" r="1.8" fill="#fff" /></>
      ) : isCelebrating ? (
        <><path d="M32 46Q37 40 42 46" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M58 46Q63 40 68 46" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" /></>
      ) : (
        <><circle cx="38" cy="46" r="6" fill="#0f172a" /><circle cx="62" cy="46" r="6" fill="#0f172a" />
          <circle cx="36" cy="43.5" r="2.2" fill="#fff" /><circle cx="60" cy="43.5" r="2.2" fill="#fff" /></>
      )}
      <ellipse cx="27" cy="55" rx="4.5" ry="2.5" fill="#f43f5e" opacity="0.6" />
      <ellipse cx="73" cy="55" rx="4.5" ry="2.5" fill="#f43f5e" opacity="0.6" />
      <path d="M45 50L55 50L50 57Z" fill="#f59e0b" stroke="#d97706" strokeWidth="1" strokeLinejoin="round" />
      <path d="M50 10L80 22L50 30L20 22Z" fill="#0f172a" />
      <rect x="37" y="27" width="26" height="5" rx="2" fill="#0f172a" />
      <circle cx="50" cy="21" r="2" fill="#fbbf24" />
      <path d="M50 21Q71 26 73 37" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="73" cy="39" r="2.5" fill="#f59e0b" />
    </svg>
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

// ─── Main Component ────────────────────────────────────────────────────────────
const FloatingMascotBot = ({ language = "en", currentQuestion = "" }) => {
  const isTa = language === "ta";
  const isTestPage = Boolean(currentQuestion && currentQuestion.trim());

  // ── Shared State
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState("happy");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [points, setPoints] = useState(() => {
    return parseInt(localStorage.getItem("mithran_points") || "3", 10);
  });

  useEffect(() => {
    localStorage.setItem("mithran_points", points.toString());
  }, [points]);

  // ── Home page quiz state
  const [homeQ, setHomeQ] = useState(null);         // { question, answer, topic }
  const [homeStatus, setHomeStatus] = useState("idle");  // idle | asking | checking | correct | hint | reveal
  const [homeMsg, setHomeMsg] = useState("");
  const [studentAnswer, setStudentAnswer] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [usedQuestions, setUsedQuestions] = useState([]);
  const inputRef = useRef(null);

  // ── Test page hint state
  const [testMsg, setTestMsg] = useState("");
  const [testHintLevel, setTestHintLevel] = useState(0);
  const [testLoading, setTestLoading] = useState(false);
  const prevTestQ = useRef("");

  // Typewriter targets
  const typeTarget = isTestPage ? testMsg : homeMsg;
  const { displayed, done } = useTypewriter(typeTarget, 16);

  // Reset test hints when question changes
  useEffect(() => {
    if (currentQuestion !== prevTestQ.current) {
      prevTestQ.current = currentQuestion;
      setTestHintLevel(0);
      setTestMsg("");
      setMood("thinking");
    }
  }, [currentQuestion]);

  // Focus input when asking
  useEffect(() => {
    if (homeStatus === "asking" && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [homeStatus]);

  // ── Load a new AI question (home page)
  const loadNewQuestion = useCallback(async () => {
    setLoading(true);
    setStudentAnswer("");
    setAttempt(0);
    setHomeStatus("loading");
    setHomeMsg(isTa ? "புதிய வினா உருவாக்குகிறேன்..." : "Generating a fresh question...");
    try {
      const res = await fetchMascotQuestion({ language, used_questions: usedQuestions });
      if (res.question) {
        setHomeQ(res);
        setUsedQuestions(prev => [...prev, res.question]);
        setHomeStatus("asking");
        setHomeMsg(
          (isTa ? "🎯 " : "🎯 ") + res.question +
          (isTa ? "\n\n📝 உங்கள் விடையை கீழே எழுதி அனுப்பவும்!" : "\n\n📝 Type your answer below and send!")
        );
        setMood("happy");
      }
    } catch {
      setHomeStatus("asking");
      setHomeMsg(isTa ? "⚠️ வினா ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்." : "⚠️ Could not load a question. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [language, isTa, usedQuestions]);

  // ── Submit student's answer (home page)
  const handleSubmitAnswer = async () => {
    if (!studentAnswer.trim() || !homeQ) return;
    const nextAttempt = attempt + 1;
    setAttempt(nextAttempt);
    setHomeStatus("checking");
    setMood("thinking");
    setHomeMsg(isTa ? "பரிசீலிக்கிறேன்..." : "Checking your answer…");
    try {
      const res = await checkMascotAnswer({
        question: homeQ.question,
        correct_answer: homeQ.answer,
        student_answer: studentAnswer,
        attempt: nextAttempt,
        language,
      });
      setHomeStatus(res.status); // "correct" | "hint" | "reveal"
      setHomeMsg(res.message || "");
      if (res.status === "correct" || res.status === "reveal") {
        setMood("celebrating");
        if (res.status === "correct") {
          setPoints(p => p + 1);
        }
      } else {
        setMood("thinking");
      }
    } catch {
      setHomeStatus("asking");
      setHomeMsg(isTa ? "⚠️ சரிபார்க்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்." : "⚠️ Could not check answer. Try again.");
    }
    setStudentAnswer("");
  };

  // ── Open mascot
  const handleMascotClick = async () => {
    if (!open) {
      setOpen(true);
      if (isTestPage) {
        if (!testMsg) {
          if (points <= 0) {
            setTestMsg(isTa ? "குறிப்புகள் பெற புள்ளிகள் தேவை! முகப்புப் பக்கத்தில் விடையளித்து புள்ளிகளைப் பெறுங்கள் 🌟" : "You need points for clues! Play on the home page to earn 🌟");
            setMood("thinking");
            return;
          }
          setTestLoading(true);
          setTestMsg(isTa ? "வினாவை பகுப்பாய்கிறேன்..." : "Looking at your question…");
          try {
            const res = await fetchMascotHint({
              message: `Give a short concept clue (1-2 sentences) for this exam question without revealing the answer: "${currentQuestion}". Keep it simple.`,
              context_question: currentQuestion,
              history: [],
              language,
            });
            setTestMsg(res?.response || (isTa ? "📖 பாடத்தை நினையுங்கள்!" : "📖 Recall what you studied!"));
            setTestHintLevel(1);
            setPoints(p => p - 1);
            setMood("thinking");
          } catch {
            setTestMsg(isTa ? "📖 பாடத்தை மீண்டும் படியுங்கள்." : "📖 Review your textbook notes.");
          } finally {
            setTestLoading(false);
          }
        }
      } else {
        if (!homeQ) {
          await loadNewQuestion();
        }
      }
    }
  };

  // ── Next hint on test page (on continue click)
  const handleTestContinue = async () => {
    if (testHintLevel >= 2) {
      setTestMsg(isTa
        ? "🌟 நீங்களே யோசித்து விடை கண்டுபிடியுங்கள் — அது உண்மையான கற்றல்! 👍"
        : "🌟 Trust yourself and answer — solving it alone is the best practice! 👍");
      setMood("celebrating");
      setTestHintLevel(3);
      return;
    }
    if (points <= 0) {
      setTestMsg(isTa ? "மேலும் குறிப்புகள் பெற புள்ளிகள் தேவை! முகப்புப் பக்கத்தில் விளையாடி புள்ளிகளைப் பெறுங்கள் 🌟" : "You need points for more clues! Play on the home page to earn 🌟");
      setMood("thinking");
      return;
    }
    setTestLoading(true);
    setMood("thinking");
    try {
      const res = await fetchMascotHint({
        message: `Give a formula or elimination strategy hint (1-2 sentences) for: "${currentQuestion}". Do NOT reveal the answer.`,
        context_question: currentQuestion,
        history: [],
        language,
      });
      setTestMsg(res?.response || (isTa ? "📐 சூத்திரத்தை பயன்படுத்துங்கள்!" : "📐 Think about the formula!"));
      setTestHintLevel(2);
      setPoints(p => p - 1);
    } catch {
      setTestMsg(isTa ? "📐 தவறான விடைகளை நீக்கி சரியானதை தேர்வு செய்யுங்கள்." : "📐 Eliminate wrong options to find the right one.");
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
    const u = new SpeechSynthesisUtterance(typeTarget.replace(/[^\w\s.,!?-]/g, ""));
    u.lang = isTa ? "ta-IN" : "en-US";
    u.rate = 0.95;
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  // ── Labels
  const isLoading = isTestPage ? testLoading : loading;
  const testLevelLabel = ["", isTa ? "குறிப்பு 1" : "Clue 1", isTa ? "குறிப்பு 2" : "Clue 2", isTa ? "ஊக்கம்" : "Go!"];
  const homeStatusLabel = {
    idle: "", loading: isTa ? "ஏற்றுகிறது" : "Loading",
    asking: isTa ? "வினா" : "Question", checking: isTa ? "சரிபார்க்கிறது" : "Checking",
    correct: isTa ? "சரி!" : "Correct!", hint: isTa ? "குறிப்பு" : "Hint",
    reveal: isTa ? "விடை" : "Answer",
  };
  const headerLabel = isTestPage ? (testLevelLabel[testHintLevel] || (isTa ? "குறிப்பு" : "Clue")) : (homeStatusLabel[homeStatus] || "");
  const headerColor = isTestPage
    ? ["bg-[#1e3a8a]", "bg-[#1e3a8a]", "bg-amber-600", "bg-green-700"][testHintLevel] || "bg-[#1e3a8a]"
    : { correct: "bg-green-700", reveal: "bg-purple-700", hint: "bg-amber-600" }[homeStatus] || "bg-[#1e3a8a]";

  const showAnswerInput = !isTestPage && homeStatus === "asking";
  const showTryAgain = !isTestPage && homeStatus === "hint";
  const showNextQ = !isTestPage && (homeStatus === "correct" || homeStatus === "reveal");
  const showTestContinue = isTestPage && !testLoading && testHintLevel < 3 && testHintLevel > 0 && done;

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
            className="relative bg-white rounded-2xl overflow-hidden"
            style={{ width: 268, boxShadow: "0 6px 28px rgba(30,58,138,0.16)", border: "1px solid #e2e8f0" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-3 py-1.5 ${headerColor} transition-colors duration-300`}>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white/20 px-1.5 py-0.5 rounded gap-1 mr-1" title={isTa ? "உங்களின் புள்ளிகள் (Hints பெற உதவும்)" : "Your Points (Use for hints)"}>
                  <span className="text-[10px]">🌟</span>
                  <span className="text-white text-[10px] font-bold">{points}</span>
                </div>
                {isLoading
                  ? <RefreshCw size={11} className="text-white animate-spin" />
                  : <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                }
                <span className="text-white/90 text-[10px] font-bold uppercase tracking-wider">{headerLabel}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={handleSpeak} className="text-white/60 hover:text-white transition-colors p-0.5">
                  {isSpeaking ? <VolumeX size={11} /> : <Volume2 size={11} />}
                </button>
                <button onClick={handleClose} className="text-white/60 hover:text-white transition-colors p-0.5">
                  <X size={11} />
                </button>
              </div>
            </div>

            {/* Body: Typewriter */}
            <div className="px-3.5 pt-2.5 pb-1 min-h-[52px]">
              {isLoading && !typeTarget ? (
                <div className="flex items-center gap-2 py-1">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-bounce"
                      style={{ animationDelay: `${i * 0.14}s` }} />
                  ))}
                  <span className="text-[11px] text-slate-400">{isTa ? "யோசிக்கிறேன்…" : "Thinking…"}</span>
                </div>
              ) : (
                <p className="text-[12px] leading-relaxed text-slate-700 font-medium whitespace-pre-line">
                  {displayed}
                  {!done && <span className="inline-block w-[2px] h-[13px] bg-[#2563eb] ml-0.5 animate-pulse align-middle rounded-full" />}
                </p>
              )}
            </div>

            {/* Answer input (home page - when asking) */}
            {showAnswerInput && done && (
              <div className="px-3 pb-3">
                <div className="flex items-center gap-1.5 mt-2 border border-slate-200 rounded-xl overflow-hidden bg-slate-50 focus-within:border-[#2563eb] transition-colors">
                  <input
                    ref={inputRef}
                    type="text"
                    value={studentAnswer}
                    onChange={(e) => setStudentAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmitAnswer()}
                    placeholder={isTa ? "உங்கள் விடை..." : "Your answer..."}
                    className="flex-1 text-[12px] px-2.5 py-2 bg-transparent outline-none text-slate-800 placeholder-slate-400"
                  />
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!studentAnswer.trim()}
                    className="p-2 bg-[#1e3a8a] text-white disabled:opacity-40 hover:bg-[#1e40af] transition-colors"
                  >
                    <Send size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Try Again (hint state) */}
            {showTryAgain && done && (
              <div className="px-3 pb-3">
                <div className="flex items-center gap-1.5 mt-1.5 border border-slate-200 rounded-xl overflow-hidden bg-slate-50 focus-within:border-[#2563eb] transition-colors">
                  <input
                    ref={inputRef}
                    type="text"
                    value={studentAnswer}
                    onChange={(e) => setStudentAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmitAnswer()}
                    placeholder={isTa ? "மீண்டும் முயற்சி..." : "Try again..."}
                    className="flex-1 text-[12px] px-2.5 py-2 bg-transparent outline-none text-slate-800 placeholder-slate-400"
                  />
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!studentAnswer.trim()}
                    className="p-2 bg-amber-600 text-white disabled:opacity-40 hover:bg-amber-700 transition-colors"
                  >
                    <Send size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Next Question (correct/reveal) */}
            {showNextQ && done && (
              <div className="px-3 pb-3 pt-1">
                <button
                  onClick={loadNewQuestion}
                  className="w-full text-[11px] font-bold text-white bg-[#1e3a8a] hover:bg-[#1e40af] rounded-xl py-1.5 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={11} />
                  {isTa ? "அடுத்த வினா" : "Next Question"}
                </button>
              </div>
            )}

            {/* Test page Continue */}
            {showTestContinue && (
              <div className="px-3 pb-3 pt-1">
                <button
                  onClick={handleTestContinue}
                  className="w-full text-[10px] font-bold text-[#1e3a8a] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl py-1.5 transition-all active:scale-95"
                >
                  {isTa ? "▶ மேலும் குறிப்பு" : "▶ More Clue"}
                </button>
              </div>
            )}

            {/* Tail pointer */}
            <div className="absolute -bottom-[7px] right-7 w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mascot Avatar ────────────────────────────────────────────── */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        animate={{ y: [0, -5, 0], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
        onClick={handleMascotClick}
        className="flex flex-col items-center gap-0.5 cursor-pointer focus:outline-none"
        title={isTa ? "கல்வி மித்ரன் — கிளிக் செய்!" : "Kalvi Mithran — click me!"}
      >
        <OwlMascot size={58} mood={mood} />
        {!open && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[9px] font-black uppercase tracking-wider bg-[#1e3a8a] text-white px-2 py-0.5 rounded-full shadow-sm"
          >
            {isTa ? "கிளிக்" : "Click"}
          </motion.span>
        )}
      </motion.button>

    </div>
  );
};

export default FloatingMascotBot;
