import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchTestQuestions, evaluateTestAnswer } from "../../api";
import EvaluationResultCard from "./EvaluationResultCard";
import FloatingMascotBot from "../FloatingMascotBot";
import {
  Mic,
  MicOff,
  Type,
  Languages,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  RefreshCw,
  Maximize,
  ShieldAlert,
  LogOut,
} from "lucide-react";

/* ── Fullscreen helpers — vendor-prefixed for older Safari/iOS ──────────────── */
const requestFullscreen = () => {
  const el = document.documentElement;
  const req =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.msRequestFullscreen;
  if (req) req.call(el).catch(() => {});
};

const exitFullscreen = () => {
  const isFs =
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement;
  if (!isFs) return;
  const exit =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.msExitFullscreen;
  if (exit) exit.call(document).catch(() => {});
};

const isInFullscreen = () =>
  !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
  );

const StudentTestView = ({ language = "en", setLanguage }) => {
  const [category, setCategory] = useState("All");
  const [localLanguage, setLocalLanguage] = useState(language);
  const currentLang = setLanguage ? language : localLanguage;
  const changeLang = setLanguage ? setLanguage : setLocalLanguage;

  // Anti-cheating: the test only shows once the student explicitly starts it
  // (a real click, so the browser allows the fullscreen request), and any
  // attempt to leave fullscreen or switch away from the tab afterwards is
  // flagged with a warning.
  const [testStarted, setTestStarted] = useState(false);
  const [violations, setViolations] = useState(0);
  // Set to the reason ("fullscreen" | "visibility") while the blocking
  // violation prompt is up. The student only ever gets two ways out of it:
  // go back to full screen and continue, or leave the test module entirely.
  const [violationReason, setViolationReason] = useState(null);
  const testStartedRef = useRef(false);
  const promptOpenRef = useRef(false);

  useEffect(() => {
    testStartedRef.current = testStarted;
  }, [testStarted]);

  useEffect(() => {
    promptOpenRef.current = !!violationReason;
  }, [violationReason]);

  const handleStartTest = () => {
    requestFullscreen();
    setTestStarted(true);
  };

  const handleContinueInFullScreen = () => {
    requestFullscreen();
    setViolationReason(null);
  };

  const handleExitTest = () => {
    exitFullscreen();
    setViolationReason(null);
    setTestStarted(false);
  };

  useEffect(() => {
    const flag = (reason) => {
      // Don't stack a second prompt on top of one already waiting on the student.
      if (promptOpenRef.current) return;
      setViolations((v) => v + 1);
      setViolationReason(reason);
    };

    const onFullscreenChange = () => {
      if (testStartedRef.current && !isInFullscreen()) flag("fullscreen");
    };

    const onVisibilityChange = () => {
      if (testStartedRef.current && document.hidden) flag("visibility");
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("msfullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      document.removeEventListener("msfullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  // Leave fullscreen behind if the student navigates away from this view.
  useEffect(() => {
    return () => exitFullscreen();
  }, []);

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Answer state
  const [userAnswer, setUserAnswer] = useState("");
  const [selectedMcqOption, setSelectedMcqOption] = useState("");
  const [inputMode, setInputMode] = useState("typing"); // "typing" | "voice"
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Evaluation State
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  // Speech Recognition Ref
  const recognitionRef = useRef(null);
  const initialTextRef = useRef("");

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
    } else {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (event) => {
        let fullSessionTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          fullSessionTranscript += event.results[i][0].transcript;
        }

        const base = initialTextRef.current ? initialTextRef.current.trim() : "";
        const session = fullSessionTranscript.trim();

        if (session) {
          setUserAnswer(base ? `${base} ${session}` : session);
        }
      };

      rec.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Update speech language when language toggles
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = currentLang === "ta" ? "ta-IN" : "en-US";
    }
  }, [currentLang]);

  // Load questions
  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setEvaluationResult(null);
    setUserAnswer("");
    setSelectedMcqOption("");
    try {
      const data = await fetchTestQuestions(category, currentLang);
      setQuestions(data);
      setCurrentIndex(0);
    } catch (err) {
      console.error("Error loading test questions:", err);
    } finally {
      setLoading(false);
    }
  }, [category, currentLang]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const currentQuestion = questions[currentIndex];

  // Toggle Voice Recording
  const toggleRecording = () => {
    if (!speechSupported) {
      alert(currentLang === "ta"
        ? "உங்கள் உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை. Chrome அல்லது Edge-ஐப் பயன்படுத்தவும்."
        : "Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        initialTextRef.current = userAnswer;
        recognitionRef.current.lang = currentLang === "ta" ? "ta-IN" : "en-US";
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setIsRecording(false);
      }
    }
  };

  // Submit Answer for Evaluation
  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;

    const answerToSubmit =
      currentQuestion.category === "MCQ" ? selectedMcqOption : userAnswer;

    if (!answerToSubmit.trim()) {
      alert(
        currentLang === "ta"
          ? "தயவுசெய்து விடையை பதிவு செய்து பின்னர் சமர்ப்பிக்கவும்."
          : "Please provide an answer before submitting."
      );
      return;
    }

    setEvaluating(true);
    setEvaluationResult(null);

    try {
      const payload = {
        questionId: currentQuestion.id,
        category: currentQuestion.category,
        question: currentQuestion.question,
        sampleAnswer: currentQuestion.sampleAnswer,
        keywords: currentQuestion.keywords || [],
        userAnswer: answerToSubmit,
        language: currentLang,
        correctOption: currentQuestion.correctOption || "",
      };

      const res = await evaluateTestAnswer(payload);
      setEvaluationResult(res);
    } catch (err) {
      console.error("Evaluation error:", err);
      alert(currentLang === "ta" ? "மதிப்பீடு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்." : "Evaluation failed. Please try again.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer("");
      setSelectedMcqOption("");
      setEvaluationResult(null);
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setUserAnswer("");
      setSelectedMcqOption("");
      setEvaluationResult(null);
    }
  };

  const isTa = currentLang === "ta";

  // Anti-cheating gate: nothing about the test renders until the student
  // explicitly starts it, since that click is what lets the browser grant
  // full-screen.
  if (!testStarted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xs">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-cyan-600 text-white shadow-pop">
          <Maximize size={26} />
        </div>
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
          {isTa ? "தேர்வு முழுத்திரையில் தொடங்கும்" : "This test runs in full screen"}
        </h2>
        <p className="max-w-md text-xs text-slate-500 sm:text-sm">
          {isTa
            ? "நேர்மையான தேர்வை உறுதி செய்ய, முழுத்திரையில் தொடங்கும். முழுத்திரையிலிருந்து வெளியேறுவது அல்லது தாவலை மாற்றுவது ஏமாற்ற முயற்சியாகக் குறிக்கப்படும்."
            : "To keep the test fair, it opens in full-screen mode. Exiting full screen or switching tabs during the test will be flagged as a possible attempt to cheat."}
        </p>
        <button
          type="button"
          onClick={handleStartTest}
          className="mt-1 flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 px-6 py-2.5 text-sm font-bold text-white shadow-pop transition-all hover:brightness-110 active:scale-95"
        >
          <Maximize size={16} />
          {isTa ? "தேர்வைத் தொடங்கு" : "Start Test"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Violation prompt — blocks the test until the student picks one of
          exactly two ways forward: go back to full screen, or leave the test. */}
      {violationReason && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/80 p-4"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <ShieldAlert size={24} />
            </div>
            <h2 className="mt-3 text-base font-extrabold tracking-tight text-slate-900">
              {isTa ? "ஏமாற்ற முயற்சி கண்டறியப்பட்டது" : "Possible cheating attempt flagged"}
            </h2>
            <p className="mt-2 text-xs text-slate-500 sm:text-sm">
              {violationReason === "fullscreen"
                ? isTa
                  ? "நீங்கள் முழுத்திரையிலிருந்து வெளியேறிவிட்டீர்கள்."
                  : "You exited full-screen mode."
                : isTa
                  ? "நீங்கள் தேர்வு தாவலை விட்டு வெளியேறினீர்கள்."
                  : "You switched away from the test tab or window."}
              {" "}
              {isTa
                ? `இது பதிவு செய்யப்பட்டுள்ளது (மொத்த குறிப்புகள்: ${violations}). தொடர, முழுத்திரைக்குத் திரும்பவும் அல்லது தேர்வை விட்டு வெளியேறவும்.`
                : `This has been recorded (total flags: ${violations}). To continue, return to full screen — or leave the test.`}
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleExitTest}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
              >
                <LogOut size={15} />
                {isTa ? "தேர்வை விட்டு வெளியேறு" : "Exit Test"}
              </button>
              <button
                type="button"
                onClick={handleContinueInFullScreen}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-pop transition-all hover:brightness-110 active:scale-95"
              >
                <Maximize size={15} />
                {isTa ? "முழுத்திரையில் தொடர்" : "Continue in Full Screen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Controls Bar */}
      <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">

        {/* Left: Category Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1">
            {isTa ? "வகை:" : "Filter:"}
          </span>
          {[
            { id: "All", label: isTa ? "அனைத்தும்" : "All" },
            { id: "MCQ", label: "MCQ" },
            { id: "2 Marks", label: isTa ? "2 மதிப்பெண்" : "2 Marks" },
            { id: "5 Marks", label: isTa ? "5 மதிப்பெண்" : "5 Marks" }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                category === cat.id
                  ? "bg-[#0284c7] text-white border-[#0284c7] shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-[#0284c7]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Right: Violation Flag & Language Toggle */}
        <div className="flex items-center gap-2">
          {violations > 0 && (
            <span
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600"
              title={isTa ? "ஏமாற்ற முயற்சிகள் கண்டறியப்பட்டன" : "Possible cheating attempts flagged"}
            >
              <ShieldAlert size={14} />
              {violations}
            </span>
          )}
          <button
            onClick={() => changeLang(currentLang === "en" ? "ta" : "en")}
            className="flex items-center gap-1.5 px-3 py-1 bg-brand-50 hover:bg-brand-100 border border-brand-200 text-[#0284c7] rounded-lg text-xs font-bold transition-all active:scale-95"
          >
            <Languages size={14} />
            <span>{currentLang === "en" ? "English (EN)" : "தமிழ் (TA)"}</span>
          </button>
        </div>
      </div>

      {/* Main Question & Answer Interface */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 shadow-xs">
          <RefreshCw size={20} className="animate-spin text-[#0284c7] mx-auto mb-2" />
          <p className="font-medium text-xs text-slate-600">
            {isTa ? "வினாக்களை ஏற்றுகிறது..." : "Loading questions..."}
          </p>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 shadow-xs">
          <BookOpen size={30} className="text-[#0284c7] mx-auto mb-2 opacity-70" />
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            {isTa ? "வினாக்கள் எதுவும் இல்லை" : "No Questions Available"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isTa
              ? "இந்த பிரிவில் வினாக்கள் எதுவும் இல்லை. ஆசிரியர் போர்ட்டலில் புதிய வினாக்களைச் சேர்க்கலாம்."
              : "No questions found for this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Question Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
            
            {/* Header: Category & Counter */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#0284c7] text-white rounded text-[11px] font-bold uppercase">
                  {currentQuestion.category}
                </span>
                <span className="text-xs font-semibold text-[#0284c7] bg-brand-50 border border-brand-100 px-2 py-0.5 rounded">
                  {currentQuestion.marks} {isTa ? "மதிப்பெண்" : (currentQuestion.marks === 1 ? "Mark" : "Marks")}
                </span>
              </div>

              <div className="text-xs font-bold text-slate-500">
                {isTa ? "வினா:" : "Question:"} <span className="text-[#0284c7] font-extrabold">{currentIndex + 1}</span> / {questions.length}
              </div>
            </div>

            {/* Question Text */}
            <div className="mb-5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                {currentQuestion.question}
              </h3>
            </div>

            {/* Answer Input Section */}
            {currentQuestion.category === "MCQ" ? (
              <div className="space-y-2.5 my-4">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {isTa ? "சரியான விடையைத் தேர்ந்தெடுக்கவும்:" : "Select correct option:"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentQuestion.options?.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedMcqOption(opt)}
                      className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                        selectedMcqOption === opt
                          ? "bg-brand-50 text-[#0284c7] border-[#0284c7] shadow-xs"
                          : "bg-white text-slate-800 border-slate-200 hover:border-brand-300"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center shrink-0 ${
                            selectedMcqOption === opt
                              ? "bg-[#0284c7] text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span>{opt}</span>
                      </span>
                      {selectedMcqOption === opt && (
                        <CheckCircle2 size={16} className="text-[#0284c7] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 my-4">
                {/* Input Mode Selector & Voice Button */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setInputMode("typing")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                        inputMode === "typing"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600"
                      }`}
                    >
                      <Type size={13} />
                      <span>{isTa ? "தட்டச்சு" : "Typing"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInputMode("voice")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                        inputMode === "voice"
                          ? "bg-[#0284c7] text-white shadow-xs"
                          : "text-slate-600"
                      }`}
                    >
                      <Mic size={13} />
                      <span>{isTa ? "குரல்" : "Voice"}</span>
                    </button>
                  </div>

                  {/* Speech mic toggle button */}
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isRecording
                        ? "bg-red-600 text-white animate-pulse"
                        : "bg-brand-50 hover:bg-brand-100 text-[#0284c7] border border-brand-200"
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff size={14} />
                        <span>{isTa ? "நிறுத்து" : "Stop"}</span>
                      </>
                    ) : (
                      <>
                        <Mic size={14} />
                        <span>{isTa ? "பேசி விடை கூறவும்" : "Speak Answer"}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Answer Textarea */}
                <div className="relative">
                  <textarea
                    rows={4}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder={
                      isTa
                        ? "உங்கள் விடையை இங்கே எழுதவும் அல்லது குரல் மூலம் பேசவும்..."
                        : "Type or speak your answer..."
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7] outline-none transition-all"
                  />

                  {isRecording && (
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs animate-pulse">
                      <span>{isTa ? "கேட்கிறது..." : "Listening..."}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePrevQuestion}
                  disabled={currentIndex === 0}
                  className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1"
                >
                  <ChevronLeft size={15} />
                  <span>{isTa ? "முந்தையது" : "Prev"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextQuestion}
                  disabled={currentIndex === questions.length - 1}
                  className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1"
                >
                  <span>{isTa ? "அடுத்தது" : "Next"}</span>
                  <ChevronRight size={15} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={evaluating}
                className="w-full sm:w-auto px-5 py-2 bg-[#0284c7] hover:bg-[#026aa2] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {evaluating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin text-white" />
                    <span>{isTa ? "மதிப்பிடுகிறது..." : "Evaluating..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>{isTa ? "மதிப்பீடு செய்க" : "Evaluate Answer"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Evaluation Report Component */}
          {evaluationResult && (
            <EvaluationResultCard
              result={evaluationResult}
              sampleAnswer={currentQuestion.sampleAnswer}
              language={currentLang}
              onNextQuestion={
                currentIndex < questions.length - 1 ? handleNextQuestion : null
              }
            />
          )}
        </div>
      )}

      {/* Floating Cartoon Mascot Bot with Current Question Context */}
      <FloatingMascotBot
        language={currentLang}
        currentQuestion={currentQuestion?.question || ""}
        currentCategory={currentQuestion?.category || ""}
      />
    </div>
  );
};

export default StudentTestView;





