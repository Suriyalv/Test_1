import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchKahootQuizzes,
  fetchKahootQuiz,
  createKahootRoom,
  joinKahootRoom,
  fetchKahootRoom,
  startKahootRoom,
  submitRoomScore,
  leaveKahootRoom,
} from "../../api";
import { KAHOOT_TILES, scoreForAnswer } from "./kahootTheme";
import { useSetMascotTestQuestion } from "../../mascotContext";
import { logActivity } from "../../activity";
import {
  Play,
  Image as ImageIcon,
  Trophy,
  Timer,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowLeft,
  Zap,
  ListChecks,
  Users,
  KeyRound,
  Copy,
  Check,
  Crown,
  LogOut,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* Optional question-type tag shown above the question text. Teacher-built
   questions have no type, so they simply show no badge. */
const QUESTION_TYPES = {
  formula: { emoji: "📐", en: "Formula", ta: "சூத்திரம்", cls: "bg-sky-100 text-sky-800" },
  definition: { emoji: "📖", en: "Definition", ta: "வரையறை", cls: "bg-violet-100 text-violet-800" },
  unit: { emoji: "📏", en: "SI Unit", ta: "SI அலகு", cls: "bg-teal-100 text-teal-800" },
  example: { emoji: "🌍", en: "Real-life Example", ta: "அன்றாட உதாரணம்", cls: "bg-emerald-100 text-emerald-800" },
  match: { emoji: "🔗", en: "Match the Pair", ta: "பொருத்துக", cls: "bg-amber-100 text-amber-800" },
  concept: { emoji: "💡", en: "Think & Answer", ta: "யோசித்துப் பதில் சொல்", cls: "bg-rose-100 text-rose-800" },
};

const TypeBadge = ({ type, isTa }) => {
  const meta = QUESTION_TYPES[type];
  if (!meta) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.cls}`}>
      <span>{meta.emoji}</span>
      {isTa ? meta.ta : meta.en}
    </span>
  );
};

/* ── Join with Game PIN Card ─────────────────────────────────────────────────── */
const JoinPinCard = ({ onJoin, isTa }) => {
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPin = pin.trim().replace(/\s+/g, "");
    if (!cleanPin) {
      setError(isTa ? "விளையாட்டு PIN ஐ உள்ளிடவும்" : "Please enter the Game PIN");
      return;
    }
    if (!name.trim()) {
      setError(isTa ? "உங்கள் பெயரை உள்ளிடவும்" : "Please enter your name");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await onJoin(cleanPin, name.trim());
    } catch (err) {
      setError(err.message || (isTa ? "அறையில் இணைய முடியவில்லை" : "Failed to join room"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[#0284c7]/30 bg-gradient-to-br from-white via-sky-50/40 to-cyan-50/50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0284c7] to-[#0ba5ec] text-white shadow-md">
            <KeyRound size={24} />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#0284c7]">
              <Sparkles size={11} />
              {isTa ? "நேரடி மல்டிபிளேயர்" : "Live Multiplayer"}
            </span>
            <h3 className="text-base font-extrabold text-slate-900 sm:text-lg">
              {isTa ? "விளையாட்டு PIN மூலம் இணையவும்" : "Join with Game PIN"}
            </h3>
            <p className="text-xs text-slate-500">
              {isTa
                ? "உங்கள் ஆசிரியர் அல்லது நண்பரின் அறையில் சேருங்கள்"
                : "Enter the room code shared by your host or teacher"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError("");
            }}
            placeholder={isTa ? "Game PIN..." : "6-digit PIN..."}
            maxLength={8}
            className="w-full sm:w-36 rounded-xl border border-slate-300 bg-white px-3 py-2 text-center font-mono text-sm font-extrabold tracking-wider text-slate-900 outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/20"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder={isTa ? "உங்கள் பெயர்..." : "Your name..."}
            className="w-full sm:w-36 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/20"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0ba5ec] px-5 py-2 text-sm font-bold text-white shadow-md hover:from-[#026aa2] hover:to-[#0284c7] active:scale-95 disabled:opacity-50"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Users size={14} />}
            <span>{isTa ? "இணை" : "Join"}</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-center text-xs font-bold text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

/* ── Stage 1: pick a quiz from the catalogue ─────────────────────────────────── */
const QuizPicker = ({ quizzes, loading, onPick, onHostRoom, onJoinRoom, isTa }) => {
  return (
    <div className="space-y-6">
      {/* Join with Game PIN */}
      <JoinPinCard onJoin={onJoinRoom} isTa={isTa} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-extrabold tracking-tight text-slate-900">
            {isTa ? "வினாடி வினா பட்டியல்" : "Explore Quizzes"}
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {quizzes.length} {isTa ? "வினாக்கள் கிடைக்கின்றன" : "quizzes available"}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xs">
            <Trophy size={30} className="mx-auto mb-2 text-[#0284c7] opacity-70" />
            <h3 className="mb-1 text-sm font-bold text-slate-900">
              {isTa ? "இன்னும் வினாடி வினாக்கள் இல்லை" : "No live quizzes yet"}
            </h3>
            <p className="mx-auto max-w-sm text-xs text-slate-500">
              {isTa
                ? "ஆசிரியர் பகுதியில் ஒரு புதிய வினாடி வினாவை உருவாக்கவும்."
                : "Ask your teacher to make one."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz, i) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.2) }}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs transition-all hover:border-[#0284c7]/40 hover:shadow-lg"
              >
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0284c7] to-[#0ba5ec] text-white shadow-sm transition-transform group-hover:scale-105">
                    <Zap size={20} />
                  </div>
                  <h3 className="mt-3 text-base font-extrabold tracking-tight text-slate-900">{quiz.title}</h3>
                  {quiz.description ? (
                    <p className="mt-0.5 line-clamp-2 text-xs font-medium text-slate-500">{quiz.description}</p>
                  ) : null}
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#0284c7]">
                    <ListChecks size={13} />
                    <span>
                      {quiz.questionCount} {isTa ? "வினாக்கள்" : quiz.questionCount === 1 ? "Question" : "Questions"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => onPick(quiz)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100 active:scale-95"
                  >
                    <Play size={13} />
                    <span>{isTa ? "தனியாக" : "Solo Play"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onHostRoom(quiz)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-[#0284c7] py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#026aa2] active:scale-95"
                  >
                    <Users size={13} />
                    <span>{isTa ? "அறை தொடங்கு" : "Host Room"}</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Stage 2: solo lobby / get-ready screen ─────────────────────────────────── */
const Lobby = ({ quiz, nickname, setNickname, onStart, onBack, isTa }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-lg sm:p-8"
  >
    <button
      onClick={onBack}
      className="mb-4 flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#0284c7]"
    >
      <ArrowLeft size={13} /> {isTa ? "வினாடி வினா பட்டியல்" : "Back to quiz list"}
    </button>

    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0284c7] to-[#0ba5ec] text-white shadow-md">
      <Trophy size={26} />
    </div>
    <h2 className="text-xl font-extrabold tracking-tight text-slate-900">{quiz.title}</h2>
    <p className="mt-1 text-xs font-semibold text-slate-500">
      {quiz.questionCount} {isTa ? "வினாக்கள் • விரைவாக பதில் அளித்தால் அதிக மதிப்பெண்" : "questions • answer fast to get more points"}
    </p>

    <div className="mt-5 text-left">
      <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
        {isTa ? "உங்கள் பெயர்" : "Your Nickname"}
      </label>
      <input
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder={isTa ? "பெயரை உள்ளிடவும்..." : "Enter your name..."}
        className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm font-semibold outline-none transition-all focus:border-[#0284c7] focus:bg-white focus:ring-1 focus:ring-[#0284c7]"
      />
    </div>

    <button
      onClick={onStart}
      disabled={!nickname.trim()}
      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0284c7] py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#026aa2] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Play size={16} />
      {isTa ? "வினாடி வினாவைத் தொடங்கு" : "Start the Quiz"}
    </button>
  </motion.div>
);

/* ── Stage 2B: Multiplayer Room Lobby (Kahoot-style with PIN & live players) ─── */
const RoomLobby = ({ room, isHost, playerId, onStart, onLeave, isTa }) => {
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      await onStart();
    } catch (err) {
      console.error("Failed to start room quiz:", err);
      alert(err.message || "Failed to start quiz");
      setStarting(false);
    }
  };

  const players = room.players || [];
  const playerCount = players.length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <button
          type="button"
          onClick={onLeave}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
        >
          <LogOut size={14} /> {isTa ? "வெளியேறு" : "Leave Room"}
        </button>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-extrabold text-emerald-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {isTa ? "நேரடி அறை தயாராக உள்ளது" : "Live Room Active"}
        </span>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">{room.quizTitle}</h2>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          {room.questionCount} {isTa ? "வினாக்கள் • நேரடி வினாடி வினா" : "questions • live multiplayer quiz"}
        </p>
      </div>

      {/* Massive Game PIN Banner */}
      <div className="rounded-2xl border-2 border-dashed border-[#0284c7]/40 bg-gradient-to-b from-sky-50/70 to-white p-6 text-center shadow-xs">
        <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
          {isTa ? "விளையாட்டு PIN (மற்றவர்களுடன் பகிரவும்)" : "GAME PIN (Share with players)"}
        </div>
        <div className="mt-1 font-mono text-4xl sm:text-5xl font-black tracking-widest text-[#0284c7]">
          {room.code}
        </div>
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-white px-4 py-1.5 text-xs font-bold text-[#0284c7] shadow-xs hover:bg-sky-50 active:scale-95"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? (isTa ? "நகலெடுக்கப்பட்டது!" : "Copied PIN!") : isTa ? "PIN நகலெடு" : "Copy Game PIN"}</span>
          </button>
        </div>
      </div>

      {/* Players in Lobby */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-700">
            <Users size={15} className="text-[#0284c7]" />
            <span>
              {isTa ? "அறையில் உள்ளவர்கள்" : "Players in Lobby"} ({playerCount})
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {isTa ? "தானாக புதுப்பிக்கப்படுகிறது..." : "Live updates active..."}
          </span>
        </div>

        <div className="flex min-h-[110px] flex-wrap content-start gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
          {players.map((p) => {
            const isCurrent = p.id === playerId;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-extrabold shadow-xs transition-all ${
                  p.isHost
                    ? "border border-amber-300 bg-amber-50 text-amber-900"
                    : isCurrent
                    ? "border border-[#0284c7] bg-white text-[#0284c7] ring-2 ring-[#0284c7]/20"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                {p.isHost ? (
                  <Crown size={14} className="text-amber-500 fill-amber-500 shrink-0" />
                ) : (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] text-[#0284c7]">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span>{p.name}</span>
                {p.isHost && (
                  <span className="text-[9px] uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md font-bold">
                    Host
                  </span>
                )}
                {isCurrent && !p.isHost && (
                  <span className="text-[9px] uppercase tracking-wider text-[#0284c7] bg-sky-50 px-1.5 py-0.5 rounded-md font-bold">
                    You
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Action area */}
      <div className="pt-2">
        {isHost ? (
          <div className="space-y-2 text-center">
            <button
              type="button"
              onClick={handleStart}
              disabled={starting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0ba5ec] py-3.5 text-base font-extrabold text-white shadow-lg hover:from-[#026aa2] hover:to-[#0284c7] active:scale-95 disabled:opacity-50"
            >
              {starting ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} className="fill-white" />}
              <span>{isTa ? "வினாடி வினாவைத் தொடங்கு (அனைவருக்கும்)" : "Start Quiz for Everyone"}</span>
            </button>
            <p className="text-xs text-slate-400">
              {isTa
                ? "தொடக்க பொத்தானைக் கிளிக் செய்தால் இணைந்த அனைவருக்கும் வினாடி வினா தொடங்கும்"
                : "Starts the synchronized live quiz for all players in this room"}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-center">
            <RefreshCw size={18} className="animate-spin text-[#0284c7]" />
            <div className="text-left">
              <div className="text-sm font-extrabold text-slate-800">
                {isTa ? "ஆசிரியர் தொடங்கும் வரை காத்திருக்கவும்..." : "Waiting for the host to start the game..."}
              </div>
              <div className="text-xs text-slate-500">
                {isTa ? "தொடாங்கியதும் தானாக வினாக்கள் தோன்றும்" : "The quiz will start automatically on your screen"}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* ── Stage 3: one live question — image, timer bar, 4 colour tiles ──────────── */
const QuestionStage = ({ question, index, total, onAnswer, isTa }) => {
  const timeLimit = question.timeLimit || 20;

  useSetMascotTestQuestion(
    question.question,
    question.type || "",
    question.options,
    question.options?.[question.correctIndex] || ""
  );
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const selectedChoiceRef = useRef(null);
  const takenSecRef = useRef(null);
  const startRef = useRef(Date.now());
  const [imgBroken, setImgBroken] = useState(false);

  // User locks in their choice, but answer is revealed only when round timer completes
  const handleSelect = (idx) => {
    if (selectedChoiceRef.current !== null) return;
    const taken = Math.max(0.1, (Date.now() - startRef.current) / 1000);
    selectedChoiceRef.current = idx;
    takenSecRef.current = taken;
    setSelectedChoice(idx);
  };

  useEffect(() => {
    selectedChoiceRef.current = null;
    takenSecRef.current = null;
    setSelectedChoice(null);
    startRef.current = Date.now();
    setTimeLeft(timeLimit);
    setImgBroken(false);

    const interval = setInterval(() => {
      const remaining = Math.max(0, timeLimit - (Date.now() - startRef.current) / 1000);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        // Round timer completed! Reveal the answer now
        const choice = selectedChoiceRef.current;
        const taken = takenSecRef.current !== null ? takenSecRef.current : timeLimit;
        onAnswer(choice, taken);
      }
    }, 100);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, timeLimit]);

  const pct = Math.max(0, (timeLeft / timeLimit) * 100);
  const urgent = pct < 25;
  const isLocked = selectedChoice !== null;

  return (
    <div className="space-y-4">
      {/* Progress + timer */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
        <span>
          {isTa ? "வினா" : "Question"} {index + 1} / {total}
        </span>
        <span className={`flex items-center gap-1 font-mono text-sm ${urgent ? "text-red-600 animate-pulse" : "text-[#0284c7]"}`}>
          <Timer size={14} />
          {Math.ceil(timeLeft)}s
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <motion.div
          className={`h-full rounded-full ${urgent ? "bg-red-500" : "bg-[#0284c7]"}`}
          animate={{ width: `${pct}%` }}
          transition={{ ease: "linear", duration: 0.1 }}
        />
      </div>

      {/* Question card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {question.image && !imgBroken ? (
          <img
            src={question.image}
            alt=""
            onError={() => setImgBroken(true)}
            className="h-56 w-full object-cover sm:h-72"
          />
        ) : question.image ? (
          <div className="flex h-40 w-full items-center justify-center bg-slate-100 text-slate-400">
            <ImageIcon size={28} />
          </div>
        ) : null}
        <div className="p-5 sm:p-6">
          {question.type && (
            <div className="mb-2.5">
              <TypeBadge type={question.type} isTa={isTa} />
            </div>
          )}
          <h3 className="text-lg font-extrabold leading-snug tracking-tight text-slate-900 sm:text-xl">
            {question.question}
          </h3>
        </div>
      </div>

      {/* Status banner when option is selected and waiting for timer */}
      {isLocked && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 py-2.5 px-4 text-xs font-bold text-sky-800 shadow-xs"
        >
          <CheckCircle2 size={16} className="shrink-0 text-[#0284c7] animate-pulse" />
          <span>
            {isTa
              ? `விடை தேர்வு செய்யப்பட்டது! ${Math.ceil(timeLeft)} விநாடிகளில் விடை காட்டப்படும்...`
              : `Answer locked in! Revealing answer in ${Math.ceil(timeLeft)}s...`}
          </span>
        </motion.div>
      )}

      {/* Answer tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {question.options.map((opt, i) => {
          const tile = KAHOOT_TILES[i % KAHOOT_TILES.length];
          const Icon = tile.icon;
          const isSelected = selectedChoice === i;
          const isOther = isLocked && !isSelected;

          return (
            <motion.button
              key={i}
              type="button"
              whileTap={isLocked ? {} : { scale: 0.96 }}
              onClick={() => handleSelect(i)}
              disabled={isLocked}
              className={`relative flex items-center justify-between gap-3 rounded-xl px-4 py-4 text-left text-sm font-bold text-white shadow-md transition-all ${
                tile.bg
              } ${
                isSelected
                  ? "ring-4 ring-white ring-offset-2 ring-offset-[#0284c7] scale-[1.02] shadow-xl"
                  : isOther
                  ? "opacity-45 cursor-not-allowed filter grayscale-[20%]"
                  : `${tile.hoverBg} active:scale-95`
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className="shrink-0 fill-white/90" />
                <span className="leading-snug">{opt}</span>
              </div>
              {isSelected && (
                <span className="shrink-0 flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white backdrop-blur-xs">
                  <CheckCircle2 size={13} />
                  {isTa ? "தேர்வு" : "Locked"}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

/* ── Reveal screen after each question with 4s auto-advance ─────────────────── */
const AUTO_ADVANCE_SECONDS = 4;

const AnswerReveal = ({ question, selectedIndex, pointsEarned, onNext, isLast, isTa }) => {
  const isCorrect = selectedIndex === question.correctIndex;
  const [timeLeft, setTimeLeft] = useState(AUTO_ADVANCE_SECONDS);
  const hasAdvancedRef = useRef(false);

  const handleAdvance = useCallback(() => {
    if (hasAdvancedRef.current) return;
    hasAdvancedRef.current = true;
    onNext();
  }, [onNext]);

  useEffect(() => {
    hasAdvancedRef.current = false;
    const start = Date.now();

    const interval = setInterval(() => {
      const remaining = Math.max(0, AUTO_ADVANCE_SECONDS - (Date.now() - start) / 1000);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        handleAdvance();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [handleAdvance]);

  const pct = Math.max(0, (timeLeft / AUTO_ADVANCE_SECONDS) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-lg space-y-4 text-center"
    >
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
          isCorrect ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
        }`}
      >
        {isCorrect ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
      </div>
      <h3 className="text-xl font-extrabold tracking-tight text-slate-900">
        {isCorrect
          ? isTa ? "சரியான விடை!" : "Correct!"
          : selectedIndex === null
            ? isTa ? "நேரம் முடிந்தது!" : "Time's up!"
            : isTa ? "தவறான விடை" : "Not quite"}
      </h3>
      <p className="text-sm font-semibold text-slate-500">
        {isTa ? "சரியான விடை: " : "Correct answer: "}
        <span className="font-extrabold text-[#0284c7]">{question.options[question.correctIndex]}</span>
      </p>
      {isCorrect && (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-bold text-[#0284c7]">
          <Zap size={14} /> +{pointsEarned} {isTa ? "மதிப்பெண்கள்" : "points"}
        </div>
      )}
      {question.explanation && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left">
          <div className="text-[11px] font-bold uppercase tracking-wide text-amber-700">
            {isTa ? "💡 ஏன்?" : "💡 Why?"}
          </div>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-amber-900">{question.explanation}</p>
        </div>
      )}

      {/* Auto-advance countdown bar (no manual next button required) */}
      <div className="space-y-2 pt-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>
            {isLast
              ? isTa
                ? `${Math.ceil(timeLeft)} விநாடிகளில் முடிவுகள் காட்டப்படும்...`
                : `Showing results in ${Math.ceil(timeLeft)}s...`
              : isTa
                ? `${Math.ceil(timeLeft)} விநாடிகளில் அடுத்த வினா தானாக தொடங்கும்...`
                : `Next question in ${Math.ceil(timeLeft)}s...`}
          </span>
          <span className="font-mono font-bold text-[#0284c7]">{Math.ceil(timeLeft)}s</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <motion.div
            className="h-full rounded-full bg-[#0284c7]"
            animate={{ width: `${pct}%` }}
            transition={{ ease: "linear", duration: 0.1 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

/* ── Final score / podium screen ─────────────────────────────────────────────── */
const ResultsScreen = ({
  nickname,
  totalScore,
  maxScore,
  correctCount,
  total,
  onPlayAgain,
  onBackToList,
  isTa,
  leaderboard,
  playerId,
  waitingNote,
}) => {
  const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-lg sm:p-8"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md">
        <Trophy size={30} />
      </div>
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
          {isTa ? `அருமை, ${nickname}!` : `Great job, ${nickname}!`}
        </h2>
        <p className="text-xs font-semibold text-slate-500">
          {isTa ? "வினாடி வினா முடிந்தது" : "You finished the quiz"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-brand-50 p-3">
          <div className="text-xl font-extrabold text-[#0284c7]">{totalScore}</div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {isTa ? "மதிப்பெண்" : "Score"}
          </div>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3">
          <div className="text-xl font-extrabold text-emerald-700">
            {correctCount}/{total}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {isTa ? "சரியானவை" : "Correct"}
          </div>
        </div>
        <div className="rounded-xl bg-amber-50 p-3">
          <div className="text-xl font-extrabold text-amber-700">{pct}%</div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {isTa ? "துல்லியம்" : "Right answers"}
          </div>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#0284c7] to-[#38bdf8]"
          style={{ width: `${maxScore > 0 ? (totalScore / maxScore) * 100 : 0}%` }}
        />
      </div>

      {/* Live Room Leaderboard if in a multiplayer room */}
      {leaderboard && leaderboard.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
          <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
              <Trophy size={14} className="text-amber-500" />
              {isTa ? "அறை தரவரிசை பட்டியல்" : "Live Room Leaderboard"}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              {leaderboard.length} {isTa ? "வீரர்கள்" : "players"}
            </span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {leaderboard.map((player, rank) => {
              const isCurrent = player.id === playerId;
              const medal = rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : `#${rank + 1}`;
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-bold ${
                    isCurrent
                      ? "bg-white border border-[#0284c7] text-[#0284c7] shadow-xs"
                      : "bg-white/70 border border-slate-100 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-center font-mono">{medal}</span>
                    <span className="truncate max-w-[150px]">{player.name}</span>
                    {isCurrent && (
                      <span className="rounded bg-sky-100 px-1 text-[9px] text-[#0284c7]">You</span>
                    )}
                  </div>
                  <div className="font-mono text-[#0284c7] font-extrabold">
                    {player.score || 0} pts
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {waitingNote && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">
          <RefreshCw size={13} className="animate-spin" />
          {waitingNote}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {onPlayAgain && (
        <button
          onClick={onPlayAgain}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0284c7] py-2.5 text-sm font-bold text-white shadow-xs transition-all hover:bg-[#026aa2] active:scale-95"
        >
          <RefreshCw size={14} /> {isTa ? "மீண்டும் விளையாடு" : "Play Again"}
        </button>
        )}
        <button
          onClick={onBackToList}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
        >
          <ArrowLeft size={14} /> {isTa ? "பட்டியல்" : "Quiz List"}
        </button>
      </div>
    </motion.div>
  );
};

/* ── Orchestrator ─────────────────────────────────────────────────────────────── */
const KahootPlayView = ({ language = "en" }) => {
  const isTa = language === "ta";

  const [stage, setStage] = useState("list"); // list | lobby | roomLobby | playing | reveal | results
  const [quizzes, setQuizzes] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [nickname, setNickname] = useState("");

  // Multiplayer room state
  const [roomData, setRoomData] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [playerId, setPlayerId] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  // Which round of the room this client is playing — the host's "Play Again"
  // bumps the room's round and every player's screen restarts with it.
  const roundRef = useRef(0);

  const [qIndex, setQIndex] = useState(0);
  const [lastAnswer, setLastAnswer] = useState(null); // { selectedIndex, points }
  const [answers, setAnswers] = useState([]); // per-question record

  const loadQuizzes = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await fetchKahootQuizzes(language);
      setQuizzes(data.quizzes || []);
    } catch (err) {
      console.error("Failed to load quizzes:", err);
    } finally {
      setLoadingList(false);
    }
  }, [language]);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  // Solo Pick
  const handlePickQuiz = async (quiz) => {
    try {
      const data = await fetchKahootQuiz(quiz.id, language);
      setActiveQuiz(data.quiz);
      setRoomData(null);
      setIsHost(false);
      setStage("lobby");
    } catch (err) {
      console.error("Failed to load quiz:", err);
    }
  };

  // Host Live Room
  const handleHostRoom = async (quiz) => {
    const hostName = nickname.trim() || (isTa ? "ஆசிரியர்" : "Host");
    try {
      const roomRes = await createKahootRoom(quiz.id, hostName, language);
      const quizRes = await fetchKahootQuiz(quiz.id, language);
      setActiveQuiz(quizRes.quiz);
      setRoomData(roomRes.room);
      setIsHost(true);
      setPlayerId(roomRes.playerId);
      setNickname(hostName);
      setStage("roomLobby");
    } catch (err) {
      console.error("Failed to host room:", err);
      alert(err.message || "Failed to create room");
    }
  };

  // Join Room via Game PIN
  const handleJoinRoom = async (pin, playerName) => {
    const joinRes = await joinKahootRoom(pin, playerName);
    const quizRes = await fetchKahootQuiz(joinRes.room.quizId, language);
    setActiveQuiz(quizRes.quiz);
    setRoomData(joinRes.room);
    setIsHost(false);
    setPlayerId(joinRes.playerId);
    setNickname(playerName);
    setStage("roomLobby");
  };

  // Start Room Quiz (Host action)
  const handleStartRoomQuiz = async () => {
    if (!roomData || !playerId) return;
    const res = await startKahootRoom(roomData.code, playerId);
    roundRef.current = res?.room?.round || roundRef.current + 1;
    setLeaderboard([]);
    setQIndex(0);
    setAnswers([]);
    setStage("playing");
  };

  // Leave Room
  const handleLeaveRoom = async () => {
    if (roomData && playerId) {
      leaveKahootRoom(roomData.code, playerId);
    }
    setRoomData(null);
    setIsHost(false);
    setPlayerId(null);
    setStage("list");
    loadQuizzes();
  };

  // Poll room updates while in roomLobby
  useEffect(() => {
    if (stage !== "roomLobby" || !roomData) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetchKahootRoom(roomData.code);
        if (res.room) {
          setRoomData(res.room);
          if (res.room.status === "started") {
            roundRef.current = res.room.round;
            setLeaderboard([]);
            setQIndex(0);
            setAnswers([]);
            setStage("playing");
          }
        }
      } catch (err) {
        if (/not found/i.test(err.message || "")) {
          alert(isTa ? "ஆசிரியர் அறையை மூடிவிட்டார்." : "The host closed this room.");
          setRoomData(null);
          setIsHost(false);
          setPlayerId(null);
          setStage("list");
        }
        // otherwise: quiet fail on transient errors
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, roomData, isTa]);

  // Solo Start
  const handleStart = () => {
    setQIndex(0);
    setAnswers([]);
    setStage("playing");
  };

  const handleAnswer = (selectedIndex, takenSec) => {
    const question = activeQuiz.questions[qIndex];
    const isCorrect = selectedIndex === question.correctIndex;
    const points = scoreForAnswer(isCorrect, takenSec, question.timeLimit || 20);
    setAnswers((prev) => [...prev, { questionId: question.id, selectedIndex, isCorrect, points }]);
    setLastAnswer({ selectedIndex, points });
    setStage("reveal");
  };

  const handleNext = () => {
    if (qIndex < activeQuiz.questions.length - 1) {
      setQIndex((prev) => prev + 1);
      setStage("playing");
    } else {
      setStage("results");
      const total = activeQuiz.questions.length;
      const correct = answers.filter((a) => a.isCorrect).length;
      logActivity("kahoot", "quiz_completed", {
        quizId: activeQuiz.id,
        quizTitle: activeQuiz.title,
        points: answers.reduce((sum, a) => sum + a.points, 0),
        maxPoints: total * 1000,
        correct,
        total,
        accuracy: total ? Math.round((correct / total) * 100) : 0,
        mode: roomData ? "room" : "solo",
        roomCode: roomData?.code || null,
      });
    }
  };

  const totalScore = answers.reduce((sum, a) => sum + a.points, 0);
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const maxScore = activeQuiz ? activeQuiz.questions.length * 1000 : 0;

  // Submit final score to room leaderboard when finishing
  useEffect(() => {
    if (stage !== "results" || !roomData || !playerId) return;

    const syncScore = async () => {
      try {
        const res = await submitRoomScore(roomData.code, playerId, totalScore, correctCount);
        if (res.leaderboard) {
          setLeaderboard(res.leaderboard);
        }
      } catch (err) {
        console.error("Failed to submit room score:", err);
      }
    };
    syncScore();
  }, [stage, roomData, playerId, totalScore, correctCount]);

  useEffect(() => {
    if (stage !== "results" || !roomData) return undefined;
    const code = roomData.code;
    const interval = setInterval(async () => {
      try {
        const res = await fetchKahootRoom(code);
        if (!res.room) return;
        setLeaderboard(res.room.leaderboard || []);
        if (!isHost && res.room.status === "started" && res.room.round > roundRef.current) {
          roundRef.current = res.room.round;
          setLeaderboard([]);
          setQIndex(0);
          setAnswers([]);
          setStage("playing");
        }
      } catch (err) {
        if (/not found/i.test(err.message || "")) {
          clearInterval(interval);
          setRoomData(null); // host closed the room: keep the final results on screen
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [stage, roomData, isHost]);

  return (
    <div className="space-y-5">
      <AnimatePresence mode="wait">
        {stage === "list" && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <QuizPicker
              quizzes={quizzes}
              loading={loadingList}
              onPick={handlePickQuiz}
              onHostRoom={handleHostRoom}
              onJoinRoom={handleJoinRoom}
              isTa={isTa}
            />
          </motion.div>
        )}

        {stage === "lobby" && activeQuiz && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Lobby
              quiz={activeQuiz}
              nickname={nickname}
              setNickname={setNickname}
              onStart={handleStart}
              onBack={() => setStage("list")}
              isTa={isTa}
            />
          </motion.div>
        )}

        {stage === "roomLobby" && roomData && (
          <motion.div key="roomLobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RoomLobby
              room={roomData}
              isHost={isHost}
              playerId={playerId}
              onStart={handleStartRoomQuiz}
              onLeave={handleLeaveRoom}
              isTa={isTa}
            />
          </motion.div>
        )}

        {stage === "playing" && activeQuiz && (
          <motion.div key={`q-${qIndex}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <QuestionStage
              question={activeQuiz.questions[qIndex]}
              index={qIndex}
              total={activeQuiz.questions.length}
              onAnswer={handleAnswer}
              isTa={isTa}
            />
          </motion.div>
        )}

        {stage === "reveal" && activeQuiz && lastAnswer && (
          <motion.div key={`reveal-${qIndex}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AnswerReveal
              question={activeQuiz.questions[qIndex]}
              selectedIndex={lastAnswer.selectedIndex}
              pointsEarned={lastAnswer.points}
              onNext={handleNext}
              isLast={qIndex === activeQuiz.questions.length - 1}
              isTa={isTa}
            />
          </motion.div>
        )}

        {stage === "results" && activeQuiz && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ResultsScreen
              nickname={nickname || (isTa ? "மாணவர்" : "Player")}
              totalScore={totalScore}
              maxScore={maxScore}
              correctCount={correctCount}
              total={activeQuiz.questions.length}
              onPlayAgain={
                roomData && !isHost
                  ? null
                  : () => {
                      if (isHost && roomData) {
                        handleStartRoomQuiz();
                      } else {
                        handleStart();
                      }
                    }
              }
              waitingNote={
                roomData && !isHost
                  ? isTa
                    ? "ஆசிரியர் மீண்டும் தொடங்கினால் தானாகத் தொடங்கும்..."
                    : "If the host plays again, the next round starts automatically..."
                  : null
              }
              onBackToList={() => {
                if (roomData && playerId) {
                  leaveKahootRoom(roomData.code, playerId);
                }
                setRoomData(null);
                setActiveQuiz(null);
                setStage("list");
                loadQuizzes();
              }}
              isTa={isTa}
              leaderboard={leaderboard}
              playerId={playerId}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KahootPlayView;
