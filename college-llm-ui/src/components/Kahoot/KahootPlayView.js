import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchKahootQuizzes, fetchKahootQuiz } from "../../api";
import { KAHOOT_TILES, scoreForAnswer } from "./kahootTheme";
import { useSetMascotTestQuestion } from "../../mascotContext";
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

/* ── Stage 1: pick a quiz from the catalogue ─────────────────────────────────── */
const QuizPicker = ({ quizzes, loading, onPick, isTa }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
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
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {quizzes.map((quiz, i) => (
        <motion.button
          key={quiz.id}
          type="button"
          onClick={() => onPick(quiz)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.2) }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.97 }}
          className="group flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs transition-all hover:border-[#0284c7]/40 hover:shadow-lg"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0284c7] to-[#0ba5ec] text-white shadow-sm transition-transform group-hover:scale-110">
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
          <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-[#0284c7] transition-colors group-hover:bg-[#0284c7] group-hover:text-white">
            <Play size={13} />
            <span>{isTa ? "தொடங்கு" : "Start Quiz"}</span>
          </div>
        </motion.button>
      ))}
    </div>
  );
};

/* ── Stage 2: lobby / get-ready screen ───────────────────────────────────────── */
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

/* ── Stage 3: one live question — image, timer bar, 4 colour tiles ──────────── */
const QuestionStage = ({ question, index, total, onAnswer, isTa }) => {
  const timeLimit = question.timeLimit || 20;

  // While this question is on screen Ark switches to clue-only mode; it clears
  // itself when the stage unmounts (i.e. on the answer reveal).
  useSetMascotTestQuestion(
    question.question,
    question.type || "",
    question.options,
    question.options?.[question.correctIndex] || ""
  );
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const startRef = useRef(Date.now());
  const answeredRef = useRef(false);
  const [imgBroken, setImgBroken] = useState(false);

  const submit = useCallback(
    (index_) => {
      if (answeredRef.current) return;
      answeredRef.current = true;
      const takenSec = (Date.now() - startRef.current) / 1000;
      onAnswer(index_, takenSec);
    },
    [onAnswer]
  );

  useEffect(() => {
    answeredRef.current = false;
    startRef.current = Date.now();
    setTimeLeft(timeLimit);
    setImgBroken(false);

    const interval = setInterval(() => {
      const remaining = Math.max(0, timeLimit - (Date.now() - startRef.current) / 1000);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        submit(null); // time's up, no option selected
      }
    }, 100);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, timeLimit]);

  const pct = Math.max(0, (timeLeft / timeLimit) * 100);
  const urgent = pct < 25;

  return (
    <div className="space-y-4">
      {/* Progress + timer */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
        <span>
          {isTa ? "வினா" : "Question"} {index + 1} / {total}
        </span>
        <span className={`flex items-center gap-1 ${urgent ? "text-red-600" : "text-[#0284c7]"}`}>
          <Timer size={13} />
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

      {/* Answer tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {question.options.map((opt, i) => {
          const tile = KAHOOT_TILES[i % KAHOOT_TILES.length];
          const Icon = tile.icon;
          return (
            <motion.button
              key={i}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => submit(i)}
              className={`flex items-center gap-3 rounded-xl px-4 py-4 text-left text-sm font-bold text-white shadow-md transition-colors active:scale-95 ${tile.bg} ${tile.hoverBg}`}
            >
              <Icon size={20} className="shrink-0 fill-white/90" />
              <span className="leading-snug">{opt}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

/* ── Reveal screen after each question ───────────────────────────────────────── */
const AnswerReveal = ({ question, selectedIndex, pointsEarned, onNext, isLast, isTa }) => {
  const isCorrect = selectedIndex === question.correctIndex;
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
      <button
        onClick={onNext}
        className="mx-auto flex items-center justify-center gap-2 rounded-xl bg-[#0284c7] px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#026aa2] active:scale-95"
      >
        {isLast ? (isTa ? "முடிவுகளைப் பார்" : "See Results") : isTa ? "அடுத்த வினா" : "Next Question"}
      </button>
    </motion.div>
  );
};

/* ── Final score / podium screen ─────────────────────────────────────────────── */
const ResultsScreen = ({ nickname, totalScore, maxScore, correctCount, total, onPlayAgain, onBackToList, isTa }) => {
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

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={onPlayAgain}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0284c7] py-2.5 text-sm font-bold text-white shadow-xs transition-all hover:bg-[#026aa2] active:scale-95"
        >
          <RefreshCw size={14} /> {isTa ? "மீண்டும் விளையாடு" : "Play Again"}
        </button>
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

  const [stage, setStage] = useState("list"); // list | lobby | playing | reveal | results
  const [quizzes, setQuizzes] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [nickname, setNickname] = useState("");

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

  const handlePickQuiz = async (quiz) => {
    try {
      const data = await fetchKahootQuiz(quiz.id, language);
      setActiveQuiz(data.quiz);
      setStage("lobby");
    } catch (err) {
      console.error("Failed to load quiz:", err);
    }
  };

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
    }
  };

  const totalScore = answers.reduce((sum, a) => sum + a.points, 0);
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const maxScore = activeQuiz ? activeQuiz.questions.length * 1000 : 0;

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {stage === "list" && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <QuizPicker quizzes={quizzes} loading={loadingList} onPick={handlePickQuiz} isTa={isTa} />
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
          <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
              onPlayAgain={handleStart}
              onBackToList={() => {
                setActiveQuiz(null);
                setStage("list");
                loadQuizzes();
              }}
              isTa={isTa}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KahootPlayView;
