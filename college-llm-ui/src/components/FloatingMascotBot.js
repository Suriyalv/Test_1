import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Volume2,
  VolumeX,
  Send,
  RefreshCw,
  Sparkles,
  Star,
  BookOpen,
  ChevronDown,
  Lightbulb,
  Award
} from "lucide-react";
import { fetchMascotQuestion, checkMascotAnswer, fetchMascotHint } from "../api";

// ─── Available Curriculum Subjects ─────────────────────────────────────────────
const SUBJECT_OPTIONS = [
  { id: "OPERATING SYSTEMS (22IST34)", en: "Operating Systems (OS)", ta: "இயக்க முறைமை (OS)", icon: "💻" },
  { id: "DATA STRUCTURES (24IST32)", en: "Data Structures (DSA)", ta: "தரவு கட்டமைப்புகள் (DSA)", icon: "⚡" },
  { id: "JAVA PROGRAMMING (24IST31)", en: "Java Programming", ta: "ஜாவா நிரலாக்கம்", icon: "☕" },
  { id: "Machine Learning (22IST61)", en: "Machine Learning (ML)", ta: "இயந்திரக் கற்றல் (ML)", icon: "🤖" },
  { id: "Cryptography and Network Security (22IST62)", en: "Cryptography (CNS)", ta: "கணினி வலையமைப்பு", icon: "🔐" },
  { id: "C# and .NET Technologies (22ISC61)", en: "C# & .NET", ta: "C# & .NET", icon: "🔷" },
  { id: "UNIX AND SHELL PROGRAMMING (24ISC31)", en: "Unix Programming", ta: "யுனிக்ஸ் நிரலாக்கம்", icon: "🐚" },
  { id: "Internet of Things and Cloud Computing (22ISC62)", en: "IoT & Cloud", ta: "ஐஓடி & கிளவுட்", icon: "☁️" },
  { id: "COMPUTER ORGANIZATION (22IST24)", en: "Computer Organization", ta: "கணினி அமைப்பு", icon: "🖥️" },
  { id: "", en: "General Academic", ta: "அனைத்துப் பாடங்கள்", icon: "🎓" }
];

// ─── Animated Mascot Face Avatar ───────────────────────────────────────────────
const AnimatedMascot = ({ mood = "happy", isSpeaking = false, size = "large" }) => {
  const isLarge = size === "large";

  // Dynamic expressions
  const getEyes = () => {
    switch (mood) {
      case "celebrating":
        return (
          <div className="flex items-center gap-1.5 text-yellow-300">
            <span className="font-black text-xs">★</span>
            <span className="font-black text-xs">★</span>
          </div>
        );
      case "thinking":
        return (
          <div className="flex items-center gap-2 text-cyan-200">
            <motion.span
              animate={{ scaleY: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="w-2 h-2 rounded-full bg-cyan-300"
            />
            <motion.span
              animate={{ scaleY: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
              className="w-2 h-2 rounded-full bg-cyan-300"
            />
          </div>
        );
      case "hint":
        return (
          <div className="flex items-center gap-1.5 text-amber-300">
            <span className="font-black text-[10px]">●</span>
            <span className="font-black text-[10px]">●</span>
          </div>
        );
      default: // happy
        return (
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scaleY: [1, 1, 0.1, 1] }}
              transition={{ repeat: Infinity, duration: 3, times: [0, 0.85, 0.9, 1] }}
              className="w-2 h-2.5 rounded-full bg-emerald-200 shadow-[0_0_8px_#a7f3d0]"
            />
            <motion.div
              animate={{ scaleY: [1, 1, 0.1, 1] }}
              transition={{ repeat: Infinity, duration: 3, times: [0, 0.85, 0.9, 1] }}
              className="w-2 h-2.5 rounded-full bg-emerald-200 shadow-[0_0_8px_#a7f3d0]"
            />
          </div>
        );
    }
  };

  const getMouth = () => {
    if (isSpeaking) {
      return (
        <motion.div
          animate={{ scaleY: [0.3, 1.3, 0.3] }}
          transition={{ repeat: Infinity, duration: 0.3 }}
          className="w-2 h-1.5 rounded-full bg-white mx-auto mt-1"
        />
      );
    }
    if (mood === "celebrating") {
      return <div className="w-2.5 h-1.5 rounded-b-full bg-white mx-auto mt-0.5" />;
    }
    return <div className="w-2 h-0.5 rounded-full bg-white/80 mx-auto mt-0.5" />;
  };

  const containerClasses = isLarge
    ? "w-14 h-14 rounded-2xl"
    : "w-8 h-8 rounded-xl";

  return (
    <div className="relative select-none">
      {/* Glow Pulse Ring */}
      <motion.div
        animate={{
          scale: mood === "celebrating" ? [1, 1.25, 1] : [1, 1.1, 1],
          opacity: [0.35, 0.7, 0.35]
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute -inset-1 rounded-2xl blur-md ${
          mood === "celebrating"
            ? "bg-amber-400"
            : mood === "thinking"
            ? "bg-sky-400"
            : "bg-[#58cc02]"
        }`}
      />

      {/* Main Bot Body */}
      <div
        className={`relative ${containerClasses} bg-gradient-to-b from-[#2e7d32] to-[#1b5e20] border-2 border-[#4caf50] shadow-md flex flex-col items-center justify-center overflow-hidden`}
      >
        {/* Antenna */}
        {isLarge && (
          <div className="absolute top-1 flex items-center justify-center">
            <motion.div
              animate={{
                scale: [1, 1.4, 1],
                backgroundColor: isSpeaking ? ["#ffeb3b", "#ff9800", "#ffeb3b"] : ["#81c784", "#4caf50", "#81c784"]
              }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="w-1.5 h-1.5 rounded-full shadow-[0_0_6px_#81c784]"
            />
          </div>
        )}

        {/* Visor Screen */}
        <div
          className={`${
            isLarge ? "w-10 h-7 rounded-lg mt-1.5" : "w-6 h-4 rounded-md"
          } bg-zinc-950/90 border border-emerald-500/40 flex flex-col items-center justify-center p-0.5`}
        >
          {getEyes()}
          {getMouth()}
        </div>
      </div>
    </div>
  );
};

// ─── Typewriter Hook ───────────────────────────────────────────────────────────
function useTypewriter(text, speed = 15) {
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
      if (i >= text.length) {
        clearInterval(iv);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);

  return { displayed, done };
}

// ─── Main Floating Mascot Bot Component ────────────────────────────────────────
const FloatingMascotBot = ({
  language = "en",
  currentQuestion = "",
  currentCategory = "",
  selectedSubject: propSubject = ""
}) => {
  const isTa = language === "ta";
  const isTestPage = Boolean(currentQuestion && currentQuestion.trim());

  // ── Persistent & State Variables
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState("happy"); // happy | thinking | celebrating | hint
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showHintCard, setShowHintCard] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(false);

  // Active Subject (synced with localStorage or prop)
  const [activeSubject, setActiveSubject] = useState(() => {
    return propSubject || localStorage.getItem("mascot_selected_subject") || "OPERATING SYSTEMS (22IST34)";
  });

  // Sync prop changes
  useEffect(() => {
    if (propSubject) {
      setActiveSubject(propSubject);
    }
  }, [propSubject]);

  const [points, setPoints] = useState(() => {
    return parseInt(localStorage.getItem("mithran_points") || "3", 10);
  });

  useEffect(() => {
    localStorage.setItem("mithran_points", points.toString());
  }, [points]);

  // ── Question State
  const [homeQ, setHomeQ] = useState(null); // { question, answer, topic, hint }
  const [homeStatus, setHomeStatus] = useState("idle"); // idle | loading | asking | checking | correct | hint | reveal
  const [homeMsg, setHomeMsg] = useState("");
  const [studentAnswer, setStudentAnswer] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [usedQuestions, setUsedQuestions] = useState([]);
  const inputRef = useRef(null);

  // ── Test page hint state
  const [testMsg, setTestMsg] = useState("");
  const prevTestQ = useRef("");

  // Typewriter target
  const typeTarget = isTestPage ? testMsg : homeMsg;
  const { displayed, done } = useTypewriter(typeTarget, 14);

  // Reset test hints when question changes on test page
  useEffect(() => {
    if (currentQuestion !== prevTestQ.current) {
      prevTestQ.current = currentQuestion;
      setTestMsg("");
      setMood("thinking");
    }
  }, [currentQuestion]);

  // Focus input when ready
  useEffect(() => {
    if (homeStatus === "asking" && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [homeStatus]);

  // ── Load a new question strictly for the active subject ────────────────────────
  const loadNewQuestion = useCallback(
    async (overrideSubject) => {
      const subjectToUse = overrideSubject !== undefined ? overrideSubject : activeSubject;
      setLoading(true);
      setStudentAnswer("");
      setAttempt(0);
      setShowHintCard(false);
      setPointsAwarded(false);
      setHomeStatus("loading");
      setMood("thinking");

      const loadingText = isTa
        ? "தேர்ந்தெடுக்கப்பட்ட பாடத்திலிருந்து புதிய வினா உருவாக்குகிறேன்..."
        : "Generating a fresh question for your selected subject...";
      setHomeMsg(loadingText);

      try {
        const res = await fetchMascotQuestion({
          language,
          subject: subjectToUse,
          used_questions: usedQuestions
        });

        if (res.question) {
          setHomeQ(res);
          setUsedQuestions((prev) => [...prev, res.question]);
          setHomeStatus("asking");
          setHomeMsg(res.question);
          setMood("happy");
        }
      } catch (err) {
        console.error("Mascot question error:", err);
        setHomeStatus("asking");
        setHomeMsg(
          isTa
            ? "⚠️ வினாவை ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்."
            : "⚠️ Could not load a question. Please try again."
        );
        setMood("happy");
      } finally {
        setLoading(false);
      }
    },
    [activeSubject, language, isTa, usedQuestions]
  );

  // ── Subject Switch Handler ──────────────────────────────────────────────────
  const handleSelectSubject = (subjId) => {
    setActiveSubject(subjId);
    localStorage.setItem("mascot_selected_subject", subjId);
    setShowSubjectPicker(false);
    loadNewQuestion(subjId);
  };

  // ── Submit Answer ────────────────────────────────────────────────────────────
  const handleSubmitAnswer = async () => {
    if (!studentAnswer.trim() || !homeQ || loading) return;

    const nextAttempt = attempt + 1;
    setAttempt(nextAttempt);
    setHomeStatus("checking");
    setMood("thinking");
    setHomeMsg(isTa ? "உங்கள் விடையை பரிசீலிக்கிறேன்..." : "Evaluating your answer…");

    try {
      const res = await checkMascotAnswer({
        question: homeQ.question,
        correct_answer: homeQ.answer,
        student_answer: studentAnswer,
        attempt: nextAttempt,
        language
      });

      setHomeStatus(res.status); // "correct" | "hint" | "reveal"
      setHomeMsg(res.message || "");

      if (res.status === "correct") {
        setMood("celebrating");
        setPointsAwarded(true);
        setPoints((p) => p + 1);
        setTimeout(() => setPointsAwarded(false), 3000);
      } else if (res.status === "reveal") {
        setMood("celebrating");
      } else {
        setMood("hint");
      }
    } catch {
      setHomeStatus("asking");
      setHomeMsg(
        isTa
          ? "⚠️ சரிபார்க்க முடியவில்லை. மீண்டும் அனுப்பவும்."
          : "⚠️ Could not check your answer. Please try again."
      );
      setMood("happy");
    }
    setStudentAnswer("");
  };

  // ── Open / Toggle Mascot ─────────────────────────────────────────────────────
  const handleMascotClick = async () => {
    if (!open) {
      setOpen(true);
      if (isTestPage) {
        if (!testMsg) {
          if (points <= 0) {
            setTestMsg(
              isTa
                ? "குறிப்புகள் பெற புள்ளிகள் தேவை! வினாக்களுக்கு விடையளித்து புள்ளிகளைப் பெறுங்கள்"
                : "You need points for clues! Answer questions to earn stars."
            );
            setMood("thinking");
            return;
          }
          setLoading(true);
          setTestMsg(isTa ? "வினாவை பகுப்பாய்கிறேன்..." : "Analyzing exam question…");
          try {
            const res = await fetchMascotHint({
              message: `Give a short concept clue (1-2 sentences) for this exam question without revealing the answer: "${currentQuestion}". Keep it simple.`,
              context_question: currentQuestion,
              history: [],
              language
            });
            setTestMsg(res?.response || (isTa ? "பாடத்தை நினையுங்கள்!" : "Recall what you studied!"));
            setPoints((p) => p - 1);
            setMood("hint");
          } catch {
            setTestMsg(isTa ? "பாடக் குறிப்புகளை மீண்டும் படியுங்கள்." : "Review your textbook notes.");
          } finally {
            setLoading(false);
          }
        }
      } else {
        if (!homeQ) {
          await loadNewQuestion();
        }
      }
    } else {
      setOpen(false);
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  };

  // ── Speech Synthesis ─────────────────────────────────────────────────────────
  const handleSpeak = (e) => {
    e.stopPropagation();
    if (!("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = typeTarget.replace(/[#*`_~]/g, "").replace(/[^\w\s.,!?-]/g, " ");
    const u = new SpeechSynthesisUtterance(cleanText);
    u.lang = isTa ? "ta-IN" : "en-US";
    u.rate = 0.95;
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setOpen(false);
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const currentSubjectObj =
    SUBJECT_OPTIONS.find((s) => s.id === activeSubject) || SUBJECT_OPTIONS[0];

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2.5 select-none font-sans">
      {/* ── Interactive Speech Card ──────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mascot-card"
            initial={{ opacity: 0, y: 15, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.92 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border-2 border-[#e5e5e5] flex flex-col"
            style={{ width: "min(92vw, 360px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Tactile Game HUD */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-slate-900 to-zinc-900 text-white border-b-2 border-zinc-800">
              <div className="flex items-center gap-2">
                <AnimatedMascot mood={mood} isSpeaking={isSpeaking} size="small" />
                <div className="flex flex-col">
                  <span className="text-xs font-black tracking-tight text-white flex items-center gap-1">
                    {isTa ? "கல்வி மித்ரன்" : "Kalvi Mithran"}
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-400 font-bold border border-emerald-500/40">
                      AI Tutor
                    </span>
                  </span>
                </div>
              </div>

              {/* Star Counter + Controls */}
              <div className="flex items-center gap-1.5">
                <motion.div
                  animate={pointsAwarded ? { scale: [1, 1.4, 1] } : {}}
                  className="flex items-center bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 rounded-full gap-1 text-amber-300 font-black text-xs"
                  title="Earned Stars"
                >
                  <Star size={11} className="fill-amber-400 text-amber-400 animate-spin-slow" />
                  <span>{points}</span>
                </motion.div>

                {/* TTS Speaker */}
                <button
                  onClick={handleSpeak}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isSpeaking
                      ? "bg-[#007AFF] text-white animate-pulse"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                  title={isSpeaking ? "Stop Voice" : "Read Aloud"}
                >
                  {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Close"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Subject Selector Bar */}
            {!isTestPage && (
              <div className="relative bg-slate-50 border-b border-slate-200 px-3.5 py-1.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px]">
                  <BookOpen size={12} className="text-[#58cc02]" />
                  <span>{isTa ? "பாடம்:" : "Subject:"}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSubjectPicker((prev) => !prev)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-slate-300 hover:border-[#58cc02] text-slate-800 font-black text-[11.5px] transition-all max-w-[200px] truncate shadow-2xs"
                >
                  <span>{currentSubjectObj.icon}</span>
                  <span className="truncate">{isTa ? currentSubjectObj.ta : currentSubjectObj.en}</span>
                  <ChevronDown size={12} className="text-slate-400 shrink-0 ml-0.5" />
                </button>

                {/* Subject Dropdown Popover */}
                <AnimatePresence>
                  {showSubjectPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.95 }}
                      className="absolute top-full left-2 right-2 mt-1 bg-white border-2 border-slate-200 rounded-2xl shadow-xl z-50 p-1.5 max-h-56 overflow-y-auto space-y-0.5"
                    >
                      <p className="px-2 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        {isTa ? "பாடத்தை மாற்றுக:" : "Choose Syllabus Subject:"}
                      </p>
                      {SUBJECT_OPTIONS.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleSelectSubject(sub.id)}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs font-bold transition-all ${
                            activeSubject === sub.id
                              ? "bg-emerald-50 text-[#378101] font-black border border-emerald-200"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span className="text-sm shrink-0">{sub.icon}</span>
                          <span className="truncate">{isTa ? sub.ta : sub.en}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Main Question / Dialogue Area */}
            <div className="p-4 flex flex-col gap-3 min-h-[110px] max-h-80 overflow-y-auto">
              {/* Status Header Badge */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  <Sparkles size={11} className="text-yellow-500 fill-yellow-400" />
                  <span>
                    {homeStatus === "correct"
                      ? isTa ? "வெற்றி! சரி" : "Correct Answer!"
                      : homeStatus === "hint"
                      ? isTa ? "குறிப்பு முறை" : "Helpful Clue"
                      : isTa ? "வினாடி வினா" : "Question"}
                  </span>
                </span>

                {homeQ?.topic && (
                  <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">
                    {homeQ.topic}
                  </span>
                )}
              </div>

              {/* Typewriter Question Text */}
              <div className="text-zinc-800 text-[13.5px] leading-relaxed font-medium whitespace-pre-line">
                {displayed}
                {!done && (
                  <span className="inline-block w-1.5 h-3.5 bg-[#58cc02] ml-1 animate-pulse align-middle rounded-full" />
                )}
              </div>

              {/* Interactive Slide-down Hint Card */}
              {showHintCard && homeQ?.hint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 text-xs text-amber-900 flex items-start gap-2 shadow-2xs"
                >
                  <Lightbulb size={15} className="text-amber-600 shrink-0 mt-0.5 fill-amber-300" />
                  <div>
                    <span className="font-black text-[10px] uppercase block text-amber-700 tracking-wider">
                      {isTa ? "சோக்ரடிக் குறிப்பு:" : "Socratic Clue:"}
                    </span>
                    <p className="font-medium mt-0.5 leading-normal">{homeQ.hint}</p>
                  </div>
                </motion.div>
              )}

              {/* Celebration Animation Banner */}
              {homeStatus === "correct" && (
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-gradient-to-r from-emerald-500 to-[#46a302] rounded-2xl p-3 text-white flex items-center gap-2.5 shadow-md"
                >
                  <Award size={24} className="text-yellow-300 shrink-0 animate-bounce" />
                  <div>
                    <h4 className="font-black text-xs uppercase tracking-wider">
                      {isTa ? "அருமை! +1 நட்சத்திரம் ⭐" : "Awesome! +1 Star ⭐"}
                    </h4>
                    <p className="text-[11px] text-emerald-100 font-medium">
                      {isTa ? "நீங்கள் பாடக் கருத்தை சரியாகப் புரிந்துள்ளீர்கள்!" : "You mastered this syllabus concept!"}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Interactive Action Controls */}
            <div className="px-4 pb-3.5 pt-1 bg-white border-t border-slate-100 flex flex-col gap-2">
              {/* Answer Input Box (when asking or retrying) */}
              {(homeStatus === "asking" || homeStatus === "hint") && done && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 border-2 border-[#e5e5e5] focus-within:border-[#58cc02] rounded-2xl overflow-hidden bg-white shadow-sm transition-all p-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={studentAnswer}
                      onChange={(e) => setStudentAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmitAnswer()}
                      placeholder={isTa ? "உங்கள் விடையை எழுதவும்..." : "Type your answer..."}
                      className="flex-1 text-[13px] px-3 py-1.5 bg-transparent outline-none text-zinc-800 placeholder-zinc-400 font-bold"
                    />

                    <button
                      onClick={handleSubmitAnswer}
                      disabled={!studentAnswer.trim() || loading}
                      className="btn-3d btn-3d-green px-3 py-1.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed text-xs font-black flex items-center gap-1"
                    >
                      <Send size={12} />
                      <span>{isTa ? "விடை" : "Send"}</span>
                    </button>
                  </div>

                  {/* Secondary Quick Action Bar */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    {homeQ?.hint && !showHintCard ? (
                      <button
                        type="button"
                        onClick={() => setShowHintCard(true)}
                        className="text-[#378101] hover:underline font-bold flex items-center gap-1 active:scale-95"
                      >
                        <Lightbulb size={12} className="text-amber-500 fill-amber-400" />
                        <span>{isTa ? "💡 குறிப்பு தேவை?" : "💡 Need a hint?"}</span>
                      </button>
                    ) : (
                      <span />
                    )}

                    <button
                      type="button"
                      onClick={() => loadNewQuestion()}
                      className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 active:scale-95"
                    >
                      <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
                      <span>{isTa ? "வேறு வினா" : "New Question"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Next Question Button (after correct or reveal) */}
              {(homeStatus === "correct" || homeStatus === "reveal") && done && (
                <button
                  onClick={() => loadNewQuestion()}
                  className="btn-3d btn-3d-green w-full py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-sm"
                >
                  <RefreshCw size={13} />
                  <span>
                    {isTa
                      ? `${currentSubjectObj.ta}-ல் அடுத்த வினா ▶`
                      : `Next Question in ${currentSubjectObj.en} ▶`}
                  </span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mascot Floating Button (Kalvi Mithran) ────────────────────────── */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        animate={{
          y: [0, -6, 0],
          transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
        }}
        onClick={handleMascotClick}
        className="flex flex-col items-center gap-1 cursor-pointer focus:outline-none relative group"
        title={isTa ? "கல்வி மித்ரன் — வினாடி வினா & உதவி!" : "Kalvi Mithran — Quiz & Study Companion!"}
      >
        <AnimatedMascot mood={mood} isSpeaking={isSpeaking} size="large" />

        {/* Floating Idle Teaser Pill */}
        {!open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-black text-[10px] tracking-wider uppercase border border-slate-700 shadow-md group-hover:bg-[#58cc02] group-hover:border-[#46a302] transition-colors"
          >
            <Sparkles size={10} className="text-yellow-400 fill-yellow-400" />
            <span>{isTa ? "வினா" : "Quiz"}</span>
          </motion.div>
        )}
      </motion.button>
    </div>
  );
};

export default FloatingMascotBot;
