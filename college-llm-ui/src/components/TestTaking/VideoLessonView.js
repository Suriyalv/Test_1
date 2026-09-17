import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  fetchVideoLessons,
  fetchVideoCheckpointQuestion,
  fetchVideoFinalQuiz,
  submitVideoAnswer,
} from "../../api";
import { logActivity } from "../../activity";
import { useSetMascotTestQuestion } from "../../mascotContext";
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
  Lightbulb,
  Target,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  // All lessons, and the one the student picked (null = show the lesson list).
  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const lesson = useMemo(
    () => lessons.find((l) => l.id === selectedLessonId) || null,
    [lessons, selectedLessonId]
  );
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
        const list = data.lessons || [];
        if (!list.length) {
          setLessonError(isTa ? "வீடியோ பாடம் எதுவும் இல்லை." : "There is no video lesson yet.");
        }
        // Language changes refetch the list; the picked lesson stays picked.
        setLessons(list);
      })
      .catch((err) => {
        console.error("Error loading video lessons:", err);
        if (!cancelled) {
          setLessonError(
            isTa
              ? "சேவையகத்தைத் தொடர்பு கொள்ள முடியவில்லை. backend இயங்குகிறதா எனச் சரிபார்க்கவும்."
              : "Cannot connect to the server. Please try again."
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
          : "Could not make the question. Please try again."
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
          : "Could not make the final questions. Please try again."
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

  // Publishes the on-screen checkpoint/final question to the one global
  // mascot instance (mounted once in App.js) so Ark gives clues here too,
  // same as the Test module — clears itself once there's no question showing.
  useSetMascotTestQuestion(
    currentQuestion?.question || "",
    currentQuestion?.conceptTitle || "",
    // The correct index stays on the server here, so the options alone let the
    // hint API keep Ark from naming any of them.
    currentQuestion?.options || []
  );

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
      logActivity("video", phase === "final" ? "final_quiz_answered" : "checkpoint_answered", {
        conceptId: currentQuestion.conceptId,
        correct: data.correct,
      });
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
      const correctCount = finalResults.filter((r) => r.correct).length;
      logActivity("video", "final_quiz_completed", {
        lessonId: lesson?.id,
        accuracy: finalResults.length ? Math.round((correctCount / finalResults.length) * 100) : 0,
      });
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

  const resetLessonProgress = () => {
    answeredRef.current = [];
    askedRef.current = [];
    phaseRef.current = "intro";
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
    setPhase("intro");
  };

  const openLesson = (lessonId) => {
    resetLessonProgress();
    setSelectedLessonId(lessonId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backToLessonList = () => {
    if (playerRef.current && playerRef.current.pauseVideo) playerRef.current.pauseVideo();
    resetLessonProgress();
    setSelectedLessonId(null);
  };

  const lessonIndex = lessons.findIndex((l) => l.id === selectedLessonId);
  const nextLesson = lessonIndex >= 0 ? lessons[lessonIndex + 1] : null;

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

  if (lessonError && !lessons.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-xs">
        <Video size={30} className="text-[#0284c7] mx-auto mb-2 opacity-70" />
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          {isTa ? "வீடியோ பாடம் கிடைக்கவில்லை" : "Video lesson not available"}
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">{lessonError}</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="text-[10px] font-bold text-[#0284c7] uppercase tracking-wide">
              {isTa ? "வீடியோ பாடங்கள்" : "Video Lessons"}
            </div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              {isTa ? "ஒரு வீடியோவைத் தேர்ந்தெடுங்கள்" : "Pick a video to watch"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isTa
                ? "ஒவ்வொரு பகுதிக்குப் பிறகும் வீடியோ நின்று, ஒரு வினா கேட்கும்."
                : "The video stops after each part and asks you a question."}
            </p>
          </div>
          <button
            onClick={() => changeLang(currentLang === "en" ? "ta" : "en")}
            className="flex items-center gap-1.5 px-3 py-1 bg-brand-50 hover:bg-brand-100 border border-brand-200 text-[#0284c7] rounded-lg text-xs font-bold transition-all active:scale-95"
          >
            <Languages size={14} />
            <span>{currentLang === "en" ? "English (EN)" : "தமிழ் (TA)"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lessons.map((item, i) => (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => openLesson(item.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.05, 0.25) }}
              whileHover={{ y: -3 }}
              className="group text-left bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-lg hover:border-brand-300 transition-all"
            >
              <div className="relative aspect-video bg-slate-200">
                <img
                  src={`https://i.ytimg.com/vi/${item.youtubeId}/hqdefault.jpg`}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 group-hover:bg-slate-900/35 transition-colors">
                  <PlayCircle size={42} className="text-white drop-shadow" />
                </div>
                <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums">
                  <Clock size={10} />
                  {formatTime(item.duration)}
                </span>
              </div>
              <div className="p-3.5">
                <div className="text-[10px] font-bold text-[#0284c7] uppercase tracking-wide">{item.subject}</div>
                <h3 className="mt-0.5 text-sm font-extrabold text-slate-900 leading-snug">{item.title}</h3>
                {item.description && (
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.description}</p>
                )}
                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                  <ListChecks size={13} className="text-[#0284c7]" />
                  {item.concepts.length} {isTa ? "வினா நிறுத்தங்கள்" : item.concepts.length === 1 ? "question stop" : "question stops"}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Lesson header */}
      <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-start gap-2.5">
          <button
            onClick={backToLessonList}
            title={isTa ? "எல்லா வீடியோக்களும்" : "All videos"}
            className="flex h-8 shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 hover:text-[#0284c7] active:scale-95"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">{isTa ? "எல்லா வீடியோக்களும்" : "All videos"}</span>
          </button>
          <div className="w-8 h-8 shrink-0 rounded-lg bg-brand-50 text-[#0284c7] border border-brand-100 flex items-center justify-center">
            <Video size={16} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#0284c7] uppercase tracking-wide">
              {lesson.subject}
            </div>
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight leading-snug">
              {lesson.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600">
            {totalConcepts} {isTa ? "பகுதிகள்" : "parts"}
          </span>
          <button
            onClick={() => changeLang(currentLang === "en" ? "ta" : "en")}
            className="flex items-center gap-1.5 px-3 py-1 bg-brand-50 hover:bg-brand-100 border border-brand-200 text-[#0284c7] rounded-lg text-xs font-bold transition-all active:scale-95"
          >
            <Languages size={14} />
            <span>{currentLang === "en" ? "English (EN)" : "தமிழ் (TA)"}</span>
          </button>
        </div>
      </div>

      {/* Player + concept rail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-slate-900 border border-slate-200 rounded-xl overflow-hidden shadow-xs relative">
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
                  className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px] flex flex-col items-center justify-center text-center px-6 pointer-events-none"
                >
                  <PauseCircle size={30} className="text-white/90 mb-2" />
                  <p className="text-white font-bold text-sm">
                    {phase === "final"
                      ? (isTa ? "இறுதி மதிப்பாய்வு" : "Final Review")
                      : (isTa ? "வீடியோ இடைநிறுத்தப்பட்டது" : "Video paused for a question")}
                  </p>
                  <p className="text-white/70 text-xs mt-1 max-w-sm">
                    {phase === "final"
                      ? (isTa
                          ? "அனைத்து கருத்துகளையும் பற்றிய வினாக்களுக்கு விடையளிக்கவும்."
                          : "Answer one question on each topic to finish the lesson.")
                      : (isTa
                          ? "கீழே உள்ள வினாவிற்கு விடையளித்ததும் வீடியோ தொடரும்."
                          : "Answer the question below. Then the video will play again.")}
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
                  <Sparkles size={26} className="text-brand-300 mb-2" />
                  <p className="text-white font-bold text-sm sm:text-base">
                    {isTa ? "பார்த்து, யோசித்து, விடையளிக்கவும்" : "Watch, think, answer"}
                  </p>
                  <p className="text-white/70 text-xs mt-1.5 max-w-md leading-relaxed">
                    {isTa
                      ? `ஒவ்வொரு கருத்தும் விளக்கப்பட்ட பிறகு வீடியோ தானாக நிற்கும், AI ஒரு வினா கேட்கும். விடையளித்ததும் வீடியோ தொடரும். இறுதியில் ${totalConcepts} கருத்துகளும் மீண்டும் கேட்கப்படும்.`
                      : `The video stops after each topic. The AI asks you one question. Answer it, and the video plays again. At the end, you get one more question on each of the ${totalConcepts} topics.`}
                  </p>
                  <button
                    onClick={startWatching}
                    disabled={!playerReady}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#0ba5ec] hover:bg-[#026aa2] disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-xs"
                  >
                    <PlayCircle size={16} />
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
          <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
              <span>
                {isTa ? "கருத்து முன்னேற்றம்" : "Your progress"}:{" "}
                <span className="text-[#0284c7] font-extrabold">{answeredCount}</span> / {totalConcepts}
              </span>
              <span className="tabular-nums">
                {formatTime(elapsed)} / {formatTime(lesson.duration)}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0284c7] rounded-full transition-all duration-300"
                style={{ width: `${totalConcepts ? (answeredCount / totalConcepts) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Concept checklist */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-100">
            <ListChecks size={14} className="text-[#0284c7]" />
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
              {isTa ? "பாட கருத்துகள்" : "Topics in this lesson"}
            </h3>
          </div>

          <ol className="space-y-1.5">
            {lesson.concepts.map((concept) => {
              const scored = checkpointResults.find((r) => r.conceptId === concept.id);
              const isActive = activeConcept && activeConcept.id === concept.id;
              const isDone = Boolean(scored);

              return (
                <li
                  key={concept.id}
                  className={`flex items-start gap-2 p-2 rounded-lg border text-xs transition-all ${
                    isActive
                      ? "bg-brand-50 border-[#0284c7]"
                      : isDone
                      ? "bg-slate-50 border-slate-200"
                      : "bg-white border-slate-100"
                  }`}
                >
                  <span className="shrink-0 mt-0.5">
                    {isDone ? (
                      scored.correct ? (
                        <CheckCircle2 size={14} className="text-emerald-600" />
                      ) : (
                        <XCircle size={14} className="text-red-500" />
                      )
                    ) : isActive ? (
                      <PauseCircle size={14} className="text-[#0284c7]" />
                    ) : (
                      <Lock size={13} className="text-slate-300" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className={`font-semibold leading-snug ${isDone || isActive ? "text-slate-900" : "text-slate-500"}`}>
                      {concept.title}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium tabular-nums mt-0.5">
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
            className="bg-white border-2 border-[#0284c7] rounded-xl p-5 sm:p-6 shadow-xs"
          >
            {/* Card header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#0284c7] text-white rounded text-[11px] font-bold uppercase">
                  {phase === "final"
                    ? (isTa ? "இறுதி மதிப்பாய்வு" : "Final Review")
                    : (isTa ? "கருத்து சோதனை" : "Quick Check")}
                </span>
                {currentQuestion && (
                  <span className="text-xs font-semibold text-[#0284c7] bg-brand-50 border border-brand-100 px-2 py-0.5 rounded">
                    {currentQuestion.conceptTitle}
                  </span>
                )}
              </div>

              <div className="text-xs font-bold text-slate-500">
                {phase === "final" ? (
                  <>
                    {isTa ? "வினா:" : "Question:"}{" "}
                    <span className="text-[#0284c7] font-extrabold">{finalIndex + 1}</span> /{" "}
                    {finalQuestions.length || "…"}
                  </>
                ) : (
                  <>
                    {isTa ? "சோதனை:" : "Checkpoint:"}{" "}
                    <span className="text-[#0284c7] font-extrabold">{answeredCount + 1}</span> / {totalConcepts}
                  </>
                )}
              </div>
            </div>

            {/* Body */}
            {questionLoading || finalLoading ? (
              <div className="py-8 text-center">
                <RefreshCw size={20} className="animate-spin text-[#0284c7] mx-auto mb-2" />
                <p className="font-medium text-xs text-slate-600">
                  {phase === "final"
                    ? (isTa ? "இறுதி வினாக்களை AI உருவாக்குகிறது..." : "The AI is making the final questions...")
                    : (isTa ? "இந்தக் கருத்தில் இருந்து AI வினா உருவாக்குகிறது..." : "The AI is making a question on this topic...")}
                </p>
              </div>
            ) : questionError ? (
              <div className="py-6 text-center">
                <XCircle size={22} className="text-red-500 mx-auto mb-2" />
                <p className="text-xs text-slate-600 mb-3">{questionError}</p>
                <button
                  onClick={handleRetryQuestion}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#026aa2] text-white rounded-lg text-xs font-bold transition-all active:scale-95"
                >
                  <RefreshCw size={14} />
                  <span>{isTa ? "மீண்டும் முயற்சிக்க" : "Try again"}</span>
                </button>
              </div>
            ) : currentQuestion ? (
              <>
                <div className="mb-5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                    {currentQuestion.question}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentQuestion.options.map((option, i) => {
                    const isPicked = selectedIndex === i;
                    const isRightAnswer = result && result.correctIndex === i;
                    const isWrongPick = result && isPicked && !result.correct;

                    let optionClass = "bg-white text-slate-800 border-slate-200 hover:border-brand-300";
                    if (result) {
                      if (isRightAnswer) optionClass = "bg-emerald-50 text-emerald-900 border-emerald-500";
                      else if (isWrongPick) optionClass = "bg-red-50 text-red-900 border-red-400";
                      else optionClass = "bg-white text-slate-400 border-slate-200";
                    } else if (isPicked) {
                      optionClass = "bg-brand-50 text-[#0284c7] border-[#0284c7] shadow-xs";
                    }

                    let badgeClass = "bg-slate-100 text-slate-700";
                    if (result) {
                      if (isRightAnswer) badgeClass = "bg-emerald-600 text-white";
                      else if (isWrongPick) badgeClass = "bg-red-500 text-white";
                    } else if (isPicked) {
                      badgeClass = "bg-[#0284c7] text-white";
                    }

                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={Boolean(result) || submitting}
                        onClick={() => setSelectedIndex(i)}
                        className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all flex items-start gap-2.5 disabled:cursor-default ${optionClass}`}
                      >
                        <span className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center shrink-0 ${badgeClass}`}>
                          {OPTION_LABELS[i]}
                        </span>
                        <span className="leading-relaxed pt-0.5">{option}</span>
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
                      className={`mt-4 p-3.5 rounded-lg border ${
                        result.correct
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-amber-50 border-amber-200"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {result.correct ? (
                          <CheckCircle2 size={15} className="text-emerald-600" />
                        ) : (
                          <XCircle size={15} className="text-amber-600" />
                        )}
                        <span className={`text-xs font-extrabold ${result.correct ? "text-emerald-800" : "text-amber-800"}`}>
                          {result.correct
                            ? (isTa ? "சரியான விடை!" : "Correct!")
                            : (isTa ? "சரியான விடை அல்ல" : "Not quite")}
                        </span>
                      </div>

                      {result.correct ? (
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {result.conceptBoundary}
                        </p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {result.misconceptionNote && (
                            <div className="rounded-md border border-amber-200 bg-white/60 p-2.5">
                              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-700">
                                <Lightbulb size={12} />
                                {isTa ? "ஏன் இது சரியாகத் தோன்றியது" : "Why you may have picked this"}
                              </p>
                              <p className="text-xs leading-relaxed text-slate-700">{result.misconceptionNote}</p>
                            </div>
                          )}
                          <div className="rounded-md border border-brand-200 bg-white/60 p-2.5">
                            <p className="mb-1 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#0284c7]">
                              <Target size={12} />
                              {isTa ? "உண்மையான கருத்து எல்லை" : "The right idea"}
                            </p>
                            <p className="text-xs leading-relaxed text-slate-700">{result.conceptBoundary}</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-400 font-medium">
                    {result
                      ? phase === "final"
                        ? (isTa ? "அடுத்த வினாவிற்குச் செல்லவும்." : "Move on to the next question.")
                        : (isTa ? "வீடியோவைத் தொடர பொத்தானை அழுத்தவும்." : "Press Continue to play the video.")
                      : (isTa ? "விடையளித்த பிறகே வீடியோ தொடரும்." : "The video will wait until you answer.")}
                  </p>

                  {!result ? (
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={selectedIndex === null || submitting}
                      className="flex items-center gap-2 px-4 py-2 bg-[#0284c7] hover:bg-[#026aa2] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-xs transition-all active:scale-95 shadow-xs"
                    >
                      {submitting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      <span>{isTa ? "விடையைச் சமர்ப்பி" : "Submit answer"}</span>
                    </button>
                  ) : phase === "final" ? (
                    <button
                      onClick={handleNextFinalQuestion}
                      className="flex items-center gap-2 px-4 py-2 bg-[#0284c7] hover:bg-[#026aa2] text-white rounded-lg font-bold text-xs transition-all active:scale-95 shadow-xs"
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
                      onClick={handleResumeVideo}
                      className="flex items-center gap-2 px-4 py-2 bg-[#0ba5ec] hover:bg-[#026aa2] text-white rounded-lg font-bold text-xs transition-all active:scale-95 shadow-xs"
                    >
                      <PlayCircle size={15} />
                      <span>{isTa ? "வீடியோவைத் தொடர்" : "Continue video"}</span>
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
              <span>{isTa ? "ஒட்டுமொத்த துல்லியம்" : "Overall score"}</span>
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
            {isTa ? "கருத்து வாரியான செயல்திறன்" : "Topic by topic"}
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
                      <span className="text-red-500">{isTa ? "மீண்டும் படிக்கவும்" : "Study this again"}</span>
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
            {nextLesson ? (
              <button
                onClick={() => openLesson(nextLesson.id)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-all active:scale-95 shadow-xs"
              >
                <ArrowRight size={14} />
                <span>{isTa ? "அடுத்த வீடியோ" : "Next video"}</span>
              </button>
            ) : (
              <button
                onClick={backToLessonList}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-all active:scale-95 shadow-xs"
              >
                <ListChecks size={14} />
                <span>{isTa ? "எல்லா வீடியோக்களும்" : "All videos"}</span>
              </button>
            )}
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
