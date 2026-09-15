import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchVideoLessons,
  fetchVideoCheckpointQuestion,
  fetchVideoFinalQuiz,
  submitVideoAnswer,
} from "../../api";
import {
  Video,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCw,
  ListChecks,
  Trophy,
  RotateCcw,
  ArrowRight,
  Languages,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import sounds from "../../utils/soundEffects";

const YT_API_SRC = "https://www.youtube.com/iframe_api";
let ytApiPromise = null;

/** Loads the YouTube IFrame API once per page and resolves with window.YT. */
const loadYouTubeApi = () => {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previousCallback === "function") previousCallback();
        resolve(window.YT);
      };
      if (!document.querySelector(`script[src="${YT_API_SRC}"]`)) {
        const script = document.createElement("script");
        script.src = YT_API_SRC;
        document.head.appendChild(script);
      }
    });
  }
  return ytApiPromise;
};

const formatTime = (seconds) => {
  const s = Math.max(0, Math.floor(seconds || 0));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

const OPTION_LABELS = ["A", "B", "C", "D"];

const VideoLessonView = ({ language = "en", setLanguage }) => {
  const [localLanguage, setLocalLanguage] = useState(language);
  const currentLang = setLanguage ? language : localLanguage;
  const changeLang = setLanguage ? setLanguage : setLocalLanguage;
  const isTa = currentLang === "ta";

  const [lesson, setLesson] = useState(null);
  const [loadingLesson, setLoadingLesson] = useState(true);
  const [lessonError, setLessonError] = useState("");

  // "intro" | "watching" | "checkpoint" | "final" | "report"
  const [phase, setPhase] = useState("intro");
  const [playerReady, setPlayerReady] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Checkpoint state
  const [activeConcept, setActiveConcept] = useState(null);
  const [question, setQuestion] = useState(null);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Final review state
  const [finalQuestions, setFinalQuestions] = useState([]);
  const [finalIndex, setFinalIndex] = useState(0);
  const [finalLoading, setFinalLoading] = useState(false);

  // Scoring
  const [checkpointResults, setCheckpointResults] = useState([]); // { conceptId, conceptTitle, correct }
  const [finalResults, setFinalResults] = useState([]);           // { conceptId, conceptTitle, correct }

  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const questionCardRef = useRef(null);

  // Refs mirror state that the polling interval reads, so the interval never
  // closes over a stale render.
  const phaseRef = useRef(phase);
  const answeredRef = useRef([]);       // concept ids already checkpointed
  const askedRef = useRef([]);          // question texts, so the LLM avoids repeats
  const lessonRef = useRef(null);
  const openFinalReviewRef = useRef(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { lessonRef.current = lesson; }, [lesson]);

  // ─── Load the lesson catalogue ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoadingLesson(true);
    setLessonError("");

    fetchVideoLessons(currentLang)
      .then((data) => {
        if (cancelled) return;
        const first = (data.lessons || [])[0];
        if (!first) {
          setLessonError(isTa ? "வீடியோ பாடம் எதுவும் இல்லை." : "No video lesson is configured yet.");
        }
        setLesson(first || null);
      })
      .catch((err) => {
        console.error("Error loading video lessons:", err);
        if (!cancelled) {
          setLessonError(
            isTa
              ? "சேவையகத்தைத் தொடர்பு கொள்ள முடியவில்லை. backend இயங்குகிறதா எனச் சரிபார்க்கவும்."
              : "Could not reach the server. Please check that the backend is running."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingLesson(false);
      });

    return () => { cancelled = true; };
  }, [currentLang, isTa]);

  // ─── Checkpoint question fetch ─────────────────────────────────────────────
  const openCheckpoint = useCallback(async (concept) => {
    phaseRef.current = "checkpoint"; // set now so the next poll tick cannot re-fire
    setPhase("checkpoint");
    setActiveConcept(concept);
    setQuestion(null);
    setSelectedIndex(null);
    setResult(null);
    setQuestionError("");
    setQuestionLoading(true);

    try {
      const data = await fetchVideoCheckpointQuestion({
        lessonId: lessonRef.current.id,
        conceptId: concept.id,
        language: currentLang,
        askedQuestions: askedRef.current,
      });
      askedRef.current = [...askedRef.current, data.question];
      setQuestion(data);
    } catch (err) {
      console.error("Checkpoint question error:", err);
      setQuestionError(
        isTa
          ? "கேள்வியை உருவாக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்."
          : "Could not prepare the question. Please try again."
      );
    } finally {
      setQuestionLoading(false);
    }
  }, [currentLang, isTa]);

  // ─── Final review fetch ────────────────────────────────────────────────────
  const openFinalReview = useCallback(async () => {
    phaseRef.current = "final"; // set now so the next poll tick cannot re-fire
    setPhase("final");
    setFinalQuestions([]);
    setFinalIndex(0);
    setSelectedIndex(null);
    setResult(null);
    setQuestionError("");
    setFinalLoading(true);

    try {
      const data = await fetchVideoFinalQuiz({
        lessonId: lessonRef.current.id,
        language: currentLang,
        askedQuestions: askedRef.current,
      });
      setFinalQuestions(data.questions || []);
    } catch (err) {
      console.error("Final quiz error:", err);
      setQuestionError(
        isTa
          ? "இறுதி மதிப்பாய்வை உருவாக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்."
          : "Could not prepare the final review. Please try again."
      );
    } finally {
      setFinalLoading(false);
    }
  }, [currentLang, isTa]);

  // The player's ENDED handler is created once, so it reaches the review through
  // a ref rather than pinning a stale copy of the callback.
  useEffect(() => { openFinalReviewRef.current = openFinalReview; }, [openFinalReview]);

  // ─── Create the player once the lesson and the API are both ready ──────────
  // Keyed on the video id alone: toggling the language refetches the lesson for
  // its localized text, and the student should not lose their place for that.
  const youtubeId = lesson ? lesson.youtubeId : null;

  useEffect(() => {
    if (!youtubeId || !containerRef.current) return;

    let destroyed = false;

    // The API replaces its target element with an iframe, so give it a host node
    // of our own rather than one React is tracking.
    const host = document.createElement("div");
    host.className = "w-full h-full";
    containerRef.current.appendChild(host);

    loadYouTubeApi().then((YT) => {
      if (destroyed) return;

      playerRef.current = new YT.Player(host, {
        videoId: youtubeId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => {
            if (!destroyed) setPlayerReady(true);
          },
          onStateChange: (event) => {
            // Running past the teaching content goes straight to the review.
            if (event.data === YT.PlayerState.ENDED && phaseRef.current === "watching") {
              openFinalReviewRef.current();
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
      playerRef.current = null;
      if (host.parentNode) host.parentNode.removeChild(host);
      setPlayerReady(false);
    };
  }, [youtubeId]);

  // ─── Watch the clock and stop at every concept boundary ────────────────────
  useEffect(() => {
    if (!playerReady || !lesson) return;

    const timer = setInterval(() => {
      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== "function") return;

      const time = player.getCurrentTime();
      setElapsed(time);

      if (phaseRef.current !== "watching") return;

      // Ask about the earliest concept the student has watched but not answered.
      // Seeking forward past several checkpoints therefore still asks them in order.
      const dueConcept = lesson.concepts.find(
        (c) => time >= c.pauseAt && !answeredRef.current.includes(c.id)
      );

      if (dueConcept) {
        player.pauseVideo();
        openCheckpoint(dueConcept);
        return;
      }

      if (time >= lesson.contentEnd) {
        player.pauseVideo();
        openFinalReview();
      }
    }, 250);

    return () => clearInterval(timer);
  }, [playerReady, lesson, openCheckpoint, openFinalReview]);

  // Bring the question into view whenever the video stops for one.
  useEffect(() => {
    if ((phase === "checkpoint" || phase === "final") && questionCardRef.current) {
      questionCardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [phase, finalIndex, questionLoading, finalLoading]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  const startWatching = () => {
    setPhase("watching");
    if (playerRef.current) playerRef.current.playVideo();
  };

  const currentQuestion = phase === "final" ? finalQuestions[finalIndex] : question;

  const handleSubmitAnswer = async () => {
    if (selectedIndex === null || !currentQuestion) return;

    setSubmitting(true);
    try {
      const data = await submitVideoAnswer({
        questionId: currentQuestion.questionId,
        selectedIndex,
        language: currentLang,
      });
      setResult(data);

      const record = {
        conceptId: currentQuestion.conceptId,
        conceptTitle: currentQuestion.conceptTitle,
        correct: data.correct,
      };
      if (phase === "final") {
        setFinalResults((prev) => [...prev, record]);
      } else {
        setCheckpointResults((prev) => [...prev, record]);
      }
    } catch (err) {
      console.error("Answer submission error:", err);
      setQuestionError(
        isTa ? "விடையைச் சரிபார்க்க முடியவில்லை." : "Could not check your answer. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResumeVideo = () => {
    if (activeConcept) {
      answeredRef.current = [...answeredRef.current, activeConcept.id];
    }
    setQuestion(null);
    setActiveConcept(null);
    setSelectedIndex(null);
    setResult(null);
    setPhase("watching");
    if (playerRef.current) playerRef.current.playVideo();
  };

  const handleNextFinalQuestion = () => {
    setSelectedIndex(null);
    setResult(null);
    if (finalIndex < finalQuestions.length - 1) {
      setFinalIndex((prev) => prev + 1);
    } else {
      setPhase("report");
    }
  };

  const handleRetryQuestion = () => {
    setQuestionError("");
    if (phase === "final") {
      openFinalReview();
    } else if (activeConcept) {
      openCheckpoint(activeConcept);
    }
  };

  const handleRestartLesson = () => {
    answeredRef.current = [];
    askedRef.current = [];
    setCheckpointResults([]);
    setFinalResults([]);
    setFinalQuestions([]);
    setFinalIndex(0);
    setQuestion(null);
    setActiveConcept(null);
    setSelectedIndex(null);
    setResult(null);
    setQuestionError("");
    setElapsed(0);
    setPhase("watching");
    if (playerRef.current) {
      playerRef.current.seekTo(0, true);
      playerRef.current.playVideo();
    }
  };

  // ─── Derived values ────────────────────────────────────────────────────────
  const answeredCount = checkpointResults.length;
  const totalConcepts = lesson ? lesson.concepts.length : 0;
  const checkpointScore = checkpointResults.filter((r) => r.correct).length;
  const finalScore = finalResults.filter((r) => r.correct).length;
  const totalScore = checkpointScore + finalScore;
  const totalPossible = checkpointResults.length + finalResults.length;
  const percentage = totalPossible ? Math.round((totalScore / totalPossible) * 100) : 0;

  // ─── Loading / error shells ────────────────────────────────────────────────
  if (loadingLesson) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 shadow-xs">
        <RefreshCw size={20} className="animate-spin text-[#0284c7] mx-auto mb-2" />
        <p className="font-medium text-xs text-slate-600">
          {isTa ? "வீடியோ பாடத்தை ஏற்றுகிறது..." : "Loading video lesson..."}
        </p>
      </div>
    );
  }

  if (lessonError || !lesson) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-xs">
        <Video size={30} className="text-[#0284c7] mx-auto mb-2 opacity-70" />
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          {isTa ? "வீடியோ பாடம் கிடைக்கவில்லை" : "Video Lesson Unavailable"}
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">{lessonError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Lesson header */}
      <div className="bg-white border-2 border-[#e5e5e5] p-3.5 sm:p-4 rounded-2xl shadow-[0_4px_0_0_#e5e5e5] flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-sky-50 text-[#1cb0f6] border-2 border-sky-200 flex items-center justify-center shadow-xs">
            <Video size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black text-[#1cb0f6] uppercase tracking-wider">
              {lesson.subject}
            </div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-snug">
              {lesson.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="px-2.5 py-1 bg-sky-50 border border-sky-200 rounded-xl text-xs font-black text-[#1cb0f6]">
            {totalConcepts} {isTa ? "கருத்துகள்" : "concepts"}
          </span>
          <button
            onClick={() => {
              sounds.playClick();
              changeLang(currentLang === "en" ? "ta" : "en");
            }}
            className="btn-3d btn-3d-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-[#1cb0f6]"
          >
            <Languages size={14} />
            <span>{currentLang === "en" ? "English (EN)" : "தமிழ் (TA)"}</span>
          </button>
        </div>
      </div>

      {/* Player + concept rail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl overflow-hidden shadow-md relative">
            <div className="aspect-video w-full">
              <div ref={containerRef} className="w-full h-full" />
            </div>

            {/* Paused-for-a-question veil */}
            <AnimatePresence>
              {(phase === "checkpoint" || phase === "final") && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 bg-slate-900/85 backdrop-blur-[2px] flex flex-col items-center justify-center text-center px-6 pointer-events-none"
                >
                  <PauseCircle size={36} className="text-[#1cb0f6] mb-2 animate-bounce-pop" />
                  <p className="text-white font-black text-base sm:text-lg">
                    {phase === "final"
                      ? (isTa ? "இறுதி மதிப்பாய்வு" : "Final Assessment Review")
                      : (isTa ? "வீடியோ இடைநிறுத்தப்பட்டது" : "Interactive Checkpoint Paused")}
                  </p>
                  <p className="text-white/80 text-xs mt-1 max-w-sm font-semibold">
                    {phase === "final"
                      ? (isTa
                          ? "அனைத்து கருத்துகளையும் பற்றிய வினாக்களுக்கு விடையளிக்கவும்."
                          : "Answer one question on every concept to complete the quest.")
                      : (isTa
                          ? "கீழே உள்ள வினாவிற்கு விடையளித்ததும் வீடியோ தொடரும்."
                          : "The lesson continues as soon as you evaluate your answer below.")}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Start gate */}
            <AnimatePresence>
              {phase === "intro" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-center px-6"
                >
                  <Sparkles size={28} className="text-amber-400 mb-2 animate-bounce-pop" />
                  <p className="text-white font-black text-base sm:text-lg">
                    {isTa ? "பார்த்து, யோசித்து, விடையளிக்கவும்" : "Watch, Think, and Answer"}
                  </p>
                  <p className="text-white/75 text-xs mt-1.5 max-w-md leading-relaxed font-semibold">
                    {isTa
                      ? `ஒவ்வொரு கருத்தும் விளக்கப்பட்ட பிறகு வீடியோ தானாக நிற்கும், AI ஒரு வினா கேட்கும். விடையளித்ததும் வீடியோ தொடரும். இறுதியில் ${totalConcepts} கருத்துகளும் மீண்டும் கேட்கப்படும்.`
                      : `After each concept the video pauses on its own and the AI tests your active recall. Answer, and the video continues smoothly.`}
                  </p>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      startWatching();
                    }}
                    disabled={!playerReady}
                    className="btn-3d btn-3d-blue mt-5 flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-sm text-white shadow-lg disabled:opacity-50"
                  >
                    <PlayCircle size={18} />
                    <span>
                      {playerReady
                        ? (isTa ? "பாடத்தைத் தொடங்கு" : "Start the lesson")
                        : (isTa ? "ஏற்றுகிறது..." : "Loading player...")}
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div className="bg-white border-2 border-[#e5e5e5] rounded-2xl px-4 py-3 shadow-[0_3px_0_0_#e5e5e5]">
            <div className="flex items-center justify-between text-xs font-black text-slate-500 mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#1cb0f6]" />
                {isTa ? "கருத்து முன்னேற்றம்" : "Concept Progress"}:{" "}
                <span className="text-[#1cb0f6] font-black">{answeredCount}</span> / {totalConcepts}
              </span>
              <span className="tabular-nums font-mono text-slate-400">
                {formatTime(elapsed)} / {formatTime(lesson.duration)}
              </span>
            </div>
            <div className="h-2.5 w-full bg-[#f0f2f5] rounded-full overflow-hidden p-0.5 border border-[#e5e5e5] shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#1cb0f6] to-[#007AFF] rounded-full transition-all duration-300"
                style={{ width: `${totalConcepts ? (answeredCount / totalConcepts) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Concept checklist */}
        <div className="bg-white border-2 border-[#e5e5e5] rounded-2xl p-4 shadow-[0_4px_0_0_#e5e5e5]">
          <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b-2 border-[#f0f2f5]">
            <ListChecks size={16} className="text-[#1cb0f6]" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              {isTa ? "பாட கருத்துகள்" : "Lesson Concepts"}
            </h3>
          </div>

          <ol className="space-y-2">
            {lesson.concepts.map((concept) => {
              const scored = checkpointResults.find((r) => r.conceptId === concept.id);
              const isActive = activeConcept && activeConcept.id === concept.id;
              const isDone = Boolean(scored);

              return (
                <li
                  key={concept.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border-2 text-xs transition-all ${
                    isActive
                      ? "bg-sky-50 border-[#1cb0f6] shadow-[0_2px_0_0_#1899d6]"
                      : isDone
                      ? "bg-emerald-50/60 border-emerald-200"
                      : "bg-[#f9fafb] border-[#e5e5e5]"
                  }`}
                >
                  <span className="shrink-0 mt-0.5">
                    {isDone ? (
                      scored.correct ? (
                        <CheckCircle2 size={15} className="text-[#58cc02]" />
                      ) : (
                        <XCircle size={15} className="text-rose-500" />
                      )
                    ) : isActive ? (
                      <PauseCircle size={15} className="text-[#1cb0f6]" />
                    ) : (
                      <Lock size={14} className="text-slate-300" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className={`font-black leading-snug ${isDone || isActive ? "text-slate-900" : "text-slate-500"}`}>
                      {concept.title}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold tabular-nums mt-0.5 font-mono">
                      {formatTime(concept.start)} – {formatTime(concept.end)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Question card (checkpoint + final review share it) */}
      <AnimatePresence mode="wait">
        {(phase === "checkpoint" || phase === "final") && (
          <motion.div
            key={`${phase}-${finalIndex}-${currentQuestion ? currentQuestion.questionId : "pending"}`}
            ref={questionCardRef}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-white border-2 border-[#e5e5e5] rounded-3xl p-6 sm:p-7 shadow-[0_8px_0_0_#e5e5e5]"
          >
            {/* Card header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-[#f0f2f5] mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-[#1cb0f6] text-white rounded-xl text-[11px] font-black uppercase tracking-wider shadow-xs">
                  {phase === "final"
                    ? (isTa ? "இறுதி மதிப்பாய்வு" : "Final Review")
                    : (isTa ? "கருத்து சோதனை" : "Concept Check")}
                </span>
                {currentQuestion && (
                  <span className="text-xs font-black text-[#1cb0f6] bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-xl">
                    {currentQuestion.conceptTitle}
                  </span>
                )}
              </div>

              <div className="text-xs font-black text-slate-500">
                {phase === "final" ? (
                  <>
                    {isTa ? "வினா:" : "Question:"}{" "}
                    <span className="text-[#1cb0f6] font-extrabold">{finalIndex + 1}</span> /{" "}
                    {finalQuestions.length || "…"}
                  </>
                ) : (
                  <>
                    {isTa ? "சோதனை:" : "Checkpoint:"}{" "}
                    <span className="text-[#1cb0f6] font-extrabold">{answeredCount + 1}</span> / {totalConcepts}
                  </>
                )}
              </div>
            </div>

            {/* Body */}
            {questionLoading || finalLoading ? (
              <div className="py-8 text-center">
                <RefreshCw size={24} className="animate-spin text-[#1cb0f6] mx-auto mb-2" />
                <p className="font-black text-xs text-slate-600">
                  {phase === "final"
                    ? (isTa ? "இறுதி வினாக்களை AI உருவாக்குகிறது..." : "The AI is preparing the final challenges...")
                    : (isTa ? "இந்தக் கருத்தில் இருந்து AI வினா உருவாக்குகிறது..." : "The AI is crafting a challenge on this concept...")}
                </p>
              </div>
            ) : questionError ? (
              <div className="py-6 text-center">
                <XCircle size={24} className="text-rose-500 mx-auto mb-2" />
                <p className="text-xs text-slate-600 mb-3 font-semibold">{questionError}</p>
                <button
                  onClick={handleRetryQuestion}
                  className="btn-3d btn-3d-white inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-[#1cb0f6]"
                >
                  <RefreshCw size={14} />
                  <span>{isTa ? "மீண்டும் முயற்சிக்க" : "Try again"}</span>
                </button>
              </div>
            ) : currentQuestion ? (
              <>
                <div className="mb-5 bg-[#f9fafb] p-4 rounded-2xl border-2 border-[#e5e5e5] shadow-inner">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-relaxed">
                    {currentQuestion.question}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQuestion.options.map((option, i) => {
                    const isPicked = selectedIndex === i;
                    const isRightAnswer = result && result.correctIndex === i;
                    const isWrongPick = result && isPicked && !result.correct;

                    let optionClass = "bg-white text-slate-800 border-[#e5e5e5] shadow-[0_4px_0_0_#e5e5e5] hover:border-[#1cb0f6]/60";
                    if (result) {
                      if (isRightAnswer) optionClass = "bg-emerald-50 text-emerald-900 border-emerald-500 shadow-[0_4px_0_0_#46a302]";
                      else if (isWrongPick) optionClass = "bg-rose-50 text-rose-900 border-rose-400 shadow-[0_4px_0_0_#d93838]";
                      else optionClass = "bg-white text-slate-400 border-slate-200 shadow-none";
                    } else if (isPicked) {
                      optionClass = "bg-sky-50 text-sky-950 border-[#1cb0f6] shadow-[0_4px_0_0_#1899d6] font-black";
                    }

                    let badgeClass = "bg-[#f7f7f7] text-slate-700 border-[#e5e5e5]";
                    if (result) {
                      if (isRightAnswer) badgeClass = "bg-[#58cc02] text-white border-[#46a302]";
                      else if (isWrongPick) badgeClass = "bg-rose-500 text-white border-rose-600";
                    } else if (isPicked) {
                      badgeClass = "bg-[#1cb0f6] text-white border-[#1899d6]";
                    }

                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={Boolean(result) || submitting}
                        onClick={() => {
                          sounds.playPop();
                          setSelectedIndex(i);
                        }}
                        className={`p-3.5 rounded-2xl border-2 text-left text-xs font-bold transition-all flex items-start gap-3 disabled:cursor-default cursor-pointer ${optionClass}`}
                      >
                        <span className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center shrink-0 border ${badgeClass}`}>
                          {OPTION_LABELS[i]}
                        </span>
                        <span className="leading-relaxed pt-1 font-semibold">{option}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Verdict */}
                <AnimatePresence>
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`mt-4 p-4 rounded-2xl border-2 ${
                        result.correct
                          ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                          : "bg-amber-50 border-amber-300 text-amber-900"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {result.correct ? (
                          <CheckCircle2 size={18} className="text-[#58cc02]" />
                        ) : (
                          <XCircle size={18} className="text-amber-600" />
                        )}
                        <span className="text-xs font-black">
                          {result.correct
                            ? (isTa ? "சரியான விடை! அருமை!" : "Correct! Excellent recall!")
                            : (isTa ? "சரியான விடை அல்ல" : "Not quite, but good effort!")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">{result.explanation}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-3 border-t-2 border-[#f0f2f5]">
                  <p className="text-[11px] text-slate-400 font-bold">
                    {result
                      ? phase === "final"
                        ? (isTa ? "அடுத்த வினாவிற்குச் செல்லவும்." : "Move on to the next trial.")
                        : (isTa ? "வீடியோவைத் தொடர பொத்தானை அழுத்தவும்." : "Press continue to resume the lesson.")
                      : (isTa ? "விடையளித்த பிறகே வீடியோ தொடரும்." : "The video stays paused until you answer.")}
                  </p>

                  {!result ? (
                    <button
                      onClick={() => {
                        sounds.playClick();
                        handleSubmitAnswer();
                      }}
                      disabled={selectedIndex === null || submitting}
                      className="btn-3d btn-3d-blue flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs text-white shadow-md disabled:opacity-50"
                    >
                      {submitting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      <span>{isTa ? "விடையைச் சமர்ப்பி" : "Submit answer"}</span>
                    </button>
                  ) : phase === "final" ? (
                    <button
                      onClick={() => {
                        sounds.playClick();
                        handleNextFinalQuestion();
                      }}
                      className="btn-3d btn-3d-green flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs text-white shadow-md"
                    >
                      <span>
                        {finalIndex < finalQuestions.length - 1
                          ? (isTa ? "அடுத்த வினா" : "Next question")
                          : (isTa ? "முடிவுகளைப் பார்" : "See my results")}
                      </span>
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        sounds.playClick();
                        handleResumeVideo();
                      }}
                      className="btn-3d btn-3d-green flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs text-white shadow-md"
                    >
                      <span>{isTa ? "தொடர்க" : "Continue video"}</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final report */}
      {phase === "report" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
            <Trophy size={17} className="text-[#0284c7]" />
            <h3 className="text-sm font-extrabold text-slate-900">
              {isTa ? "பாட முடிவு அறிக்கை" : "Lesson Report"}
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {[
              {
                label: isTa ? "மொத்த மதிப்பெண்" : "Total score",
                value: `${totalScore}/${totalPossible}`,
              },
              {
                label: isTa ? "வீடியோ சோதனைகள்" : "During video",
                value: `${checkpointScore}/${checkpointResults.length}`,
              },
              {
                label: isTa ? "இறுதி மதிப்பாய்வு" : "Final review",
                value: `${finalScore}/${finalResults.length}`,
              },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                <div className="text-lg font-extrabold text-[#0284c7] tabular-nums">{stat.value}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
              <span>{isTa ? "ஒட்டுமொத்த துல்லியம்" : "Overall accuracy"}</span>
              <span className="text-[#0284c7] font-extrabold tabular-nums">{percentage}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  percentage >= 70 ? "bg-emerald-500" : percentage >= 40 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Per-concept breakdown */}
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide mb-2">
            {isTa ? "கருத்து வாரியான செயல்திறன்" : "Concept-by-concept"}
          </h4>
          <div className="space-y-1.5">
            {lesson.concepts.map((concept) => {
              const duringVideo = checkpointResults.find((r) => r.conceptId === concept.id);
              const atTheEnd = finalResults.find((r) => r.conceptId === concept.id);
              const bothRight = duringVideo && atTheEnd && duringVideo.correct && atTheEnd.correct;
              const bothWrong = duringVideo && atTheEnd && !duringVideo.correct && !atTheEnd.correct;

              return (
                <div
                  key={concept.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-200 bg-slate-50"
                >
                  <span className="text-xs font-semibold text-slate-800 min-w-0">{concept.title}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    {[
                      { tag: isTa ? "சோதனை" : "check", entry: duringVideo },
                      { tag: isTa ? "இறுதி" : "final", entry: atTheEnd },
                    ].map(({ tag, entry }) => (
                      <span key={tag} className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{tag}</span>
                        {entry ? (
                          entry.correct ? (
                            <CheckCircle2 size={14} className="text-emerald-600" />
                          ) : (
                            <XCircle size={14} className="text-red-500" />
                          )
                        ) : (
                          <span className="text-[10px] text-slate-300 font-bold">—</span>
                        )}
                      </span>
                    ))}
                  </div>
                  <span className="hidden sm:block text-[10px] font-bold w-24 text-right shrink-0">
                    {bothRight ? (
                      <span className="text-emerald-600">{isTa ? "நன்கு புரிந்தது" : "Solid"}</span>
                    ) : bothWrong ? (
                      <span className="text-red-500">{isTa ? "மீண்டும் படிக்கவும்" : "Revise this"}</span>
                    ) : (
                      <span className="text-amber-600">{isTa ? "கவனம் தேவை" : "Almost there"}</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
            <button
              onClick={handleRestartLesson}
              className="flex items-center gap-2 px-4 py-2 bg-[#0284c7] hover:bg-[#026aa2] text-white rounded-lg font-bold text-xs transition-all active:scale-95 shadow-xs"
            >
              <RotateCcw size={14} />
              <span>{isTa ? "பாடத்தை மீண்டும் பார்" : "Watch the lesson again"}</span>
            </button>
            <a
              href={lesson.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#0284c7] border border-slate-200 rounded-lg font-bold text-xs transition-all"
            >
              <Video size={14} />
              <span>{isTa ? "YouTube-இல் திற" : "Open on YouTube"}</span>
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default VideoLessonView;
