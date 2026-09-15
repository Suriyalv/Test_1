import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchTestQuestions, evaluateTestAnswer } from "../../api";
import EvaluationResultCard from "./EvaluationResultCard";
import FloatingMascotBot from "../FloatingMascotBot";
import sounds from "../../utils/soundEffects";
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
  Award,
  Layers,
  Volume2,
  VolumeX,
  HelpCircle,
  Flame,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const StudentTestView = ({ language = "en", setLanguage }) => {
  const [category, setCategory] = useState("All");
  const [localLanguage, setLocalLanguage] = useState(language);
  const currentLang = setLanguage ? language : localLanguage;
  const changeLang = setLanguage ? setLanguage : setLocalLanguage;

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Map of questionKey -> { userAnswer, selectedMcqOption, evaluationResult }
  const [answers, setAnswers] = useState({});

  // Active question Answer state
  const [userAnswer, setUserAnswer] = useState("");
  const [selectedMcqOption, setSelectedMcqOption] = useState("");
  const [inputMode, setInputMode] = useState("typing"); // "typing" | "voice"
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [showHint, setShowHint] = useState(false);

  // Audio Speech synthesis for question reading
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Evaluation State
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  // Helper to generate consistent key for each question
  const getQKey = useCallback((q, idx) => {
    return q && q.id != null ? String(q.id) : `q_${idx}`;
  }, []);

  // Synchronous refs for event listeners & recognition callbacks
  const currentQuestion = questions[currentIndex];
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const currentQuestionRef = useRef(currentQuestion);
  currentQuestionRef.current = currentQuestion;
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const userAnswerRef = useRef(userAnswer);
  userAnswerRef.current = userAnswer;
  const selectedMcqOptionRef = useRef(selectedMcqOption);
  selectedMcqOptionRef.current = selectedMcqOption;
  const evaluationResultRef = useRef(evaluationResult);
  evaluationResultRef.current = evaluationResult;

  // Speech Recognition Ref
  const recognitionRef = useRef(null);
  const initialTextRef = useRef("");
  const resultRef = useRef(null);

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
          const finalVal = base ? `${base} ${session}` : session;
          setUserAnswer(finalVal);
          const currQ = currentQuestionRef.current;
          const currIdx = currentIndexRef.current;
          const qKey = currQ && currQ.id != null ? String(currQ.id) : `q_${currIdx}`;
          setAnswers((prev) => ({
            ...prev,
            [qKey]: {
              ...prev[qKey],
              userAnswer: finalVal,
            },
          }));
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
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
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
    setAnswers({});
    setShowHint(false);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
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

  // Keyboard shortcut listener for MCQ: press A, B, C, D
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
      if (!currentQuestion || currentQuestion.category !== "MCQ") return;

      const key = e.key.toUpperCase();
      const options = currentQuestion.options || [];
      let targetIndex = -1;

      if (key === "A" || key === "1") targetIndex = 0;
      else if (key === "B" || key === "2") targetIndex = 1;
      else if (key === "C" || key === "3") targetIndex = 2;
      else if (key === "D" || key === "4") targetIndex = 3;

      if (targetIndex >= 0 && targetIndex < options.length) {
        sounds.playPop();
        setSelectedMcqOption(options[targetIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQuestion]);

  // Scroll to evaluation result automatically
  useEffect(() => {
    if (evaluationResult && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [evaluationResult]);

  // Read question aloud
  const toggleSpeakQuestion = () => {
    if (!window.speechSynthesis || !currentQuestion) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentQuestion.question);
    utterance.lang = currentLang === "ta" ? "ta-IN" : "en-US";
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

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
      sounds.playClick();
    } else {
      try {
        initialTextRef.current = userAnswer;
        recognitionRef.current.lang = currentLang === "ta" ? "ta-IN" : "en-US";
        recognitionRef.current.start();
        setIsRecording(true);
        sounds.playPop();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setIsRecording(false);
      }
    }
  };

  // Select MCQ Option
  const handleSelectOption = useCallback((opt) => {
    sounds.playPop();
    setSelectedMcqOption(opt);
    const currQ = currentQuestionRef.current;
    const currIdx = currentIndexRef.current;
    const qKey = getQKey(currQ, currIdx);
    setAnswers((prev) => ({
      ...prev,
      [qKey]: {
        ...prev[qKey],
        selectedMcqOption: opt,
      },
    }));
  }, [getQKey]);

  // Handle Textarea Answer Change
  const handleTextAnswerChange = (val) => {
    setUserAnswer(val);
    const currQ = currentQuestionRef.current;
    const currIdx = currentIndexRef.current;
    const qKey = getQKey(currQ, currIdx);
    setAnswers((prev) => ({
      ...prev,
      [qKey]: {
        ...prev[qKey],
        userAnswer: val,
      },
    }));
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

      const currQ = currentQuestionRef.current;
      const currIdx = currentIndexRef.current;
      const qKey = getQKey(currQ, currIdx);
      setAnswers((prev) => ({
        ...prev,
        [qKey]: {
          ...prev[qKey],
          userAnswer: answerToSubmit,
          selectedMcqOption: currQ?.category === "MCQ" ? selectedMcqOption : prev[qKey]?.selectedMcqOption,
          evaluationResult: res,
        },
      }));
      sounds.playSuccess();
    } catch (err) {
      console.error("Evaluation error:", err);
      alert(currentLang === "ta" ? "மதிப்பீடு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்." : "Evaluation failed. Please try again.");
    } finally {
      setEvaluating(false);
    }
  };

  // Navigate between questions and preserve/restore previous answers
  const navigateToQuestion = (targetIdx) => {
    if (targetIdx < 0 || targetIdx >= questions.length || targetIdx === currentIndex) return;
    sounds.playClick();

    // 1. Snapshot and commit current question's state into answers
    const currQ = currentQuestionRef.current;
    const currIdx = currentIndexRef.current;
    const currKey = getQKey(currQ, currIdx);

    const updatedAnswers = {
      ...answersRef.current,
      [currKey]: {
        ...answersRef.current[currKey],
        userAnswer: userAnswerRef.current,
        selectedMcqOption: selectedMcqOptionRef.current,
        evaluationResult: evaluationResultRef.current,
      },
    };
    setAnswers(updatedAnswers);

    // 2. Stop audio/speech if running
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    // 3. Update current index
    setCurrentIndex(targetIdx);

    // 4. Restore target question's saved state
    const targetQ = questions[targetIdx];
    const targetKey = getQKey(targetQ, targetIdx);
    const savedState = updatedAnswers[targetKey];

    setUserAnswer(savedState?.userAnswer || "");
    setSelectedMcqOption(savedState?.selectedMcqOption || "");
    setEvaluationResult(savedState?.evaluationResult || null);
    setShowHint(false);
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      navigateToQuestion(currentIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      navigateToQuestion(currentIndex - 1);
    }
  };

  const handleJumpQuestion = (idx) => {
    navigateToQuestion(idx);
  };

  const isTa = currentLang === "ta";
  const wordCount = userAnswer.trim() ? userAnswer.trim().split(/\s+/).length : 0;
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* ─── Interactive Filter & HUD Control Bar ──────────────────────────── */}
      <div className="bg-white border-2 border-[#e5e5e5] p-3 sm:p-4 rounded-3xl shadow-[0_4px_0_0_#e5e5e5] flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        
        {/* Left: Interactive 3D Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <Zap size={14} className="text-[#1cb0f6]" />
            {isTa ? "பிரிவு:" : "Mode:"}
          </span>
          {[
            { id: "All", label: isTa ? "அனைத்தும்" : "All Trials", icon: Layers, badge: "All" },
            { id: "MCQ", label: isTa ? "தேர்வு வினா" : "Quick MCQ", icon: Sparkles, badge: "1 Mark" },
            { id: "2 Marks", label: isTa ? "2 மதிப்பெண்" : "Concept (2M)", icon: BookOpen, badge: "2 Marks" },
            { id: "5 Marks", label: isTa ? "5 மதிப்பெண்" : "Deep Dive (5M)", icon: Award, badge: "5 Marks" }
          ].map((cat) => {
            const IconComponent = cat.icon;
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  sounds.playPop();
                  setCategory(cat.id);
                }}
                className={`btn-3d flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  isActive
                    ? "btn-3d-blue"
                    : "btn-3d-white text-slate-600 hover:text-slate-900"
                }`}
              >
                <IconComponent size={14} className={isActive ? "text-white" : "text-[#1cb0f6]"} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Gamified XP Badge & Language Toggle */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 font-black text-xs shadow-xs"
            title="Reward for completing assessment"
          >
            <Flame size={14} className="fill-amber-500 text-amber-500 animate-pulse" />
            <span>+25 XP</span>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              changeLang(currentLang === "en" ? "ta" : "en");
            }}
            className="btn-3d btn-3d-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-[#1cb0f6]"
            title={currentLang === "en" ? "தமிழுக்கு மாற்றவும்" : "Switch to English"}
          >
            <Languages size={14} />
            <span>{currentLang === "en" ? "English (EN)" : "தமிழ்"}</span>
          </button>
        </div>
      </div>

      {/* ─── Main Question & Assessment Hub ─────────────────────────────────── */}
      {loading ? (
        <div className="bg-white border-2 border-[#e5e5e5] rounded-3xl p-12 text-center text-slate-500 shadow-[0_6px_0_0_#e5e5e5]">
          <RefreshCw size={24} className="animate-spin text-[#1cb0f6] mx-auto mb-3" />
          <p className="font-black text-sm text-slate-700">
            {isTa ? "வினாக்களைத் தயார் செய்கிறது..." : "Summoning trial challenges..."}
          </p>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white border-2 border-[#e5e5e5] rounded-3xl p-12 text-center text-slate-500 shadow-[0_6px_0_0_#e5e5e5]">
          <BookOpen size={36} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-black text-slate-800 mb-1">
            {isTa ? "வினாக்கள் எதுவும் இல்லை" : "No Trials in this Category"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isTa
              ? "இந்த பிரிவில் வினாக்கள் எதுவும் கிடைக்கவில்லை. வேறு பிரிவைத் தேர்ந்தெடுக்கவும்."
              : "No questions found for this filter. Try selecting 'All Trials' to view everything."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          
          {/* ─── Interactive Quest Progress & Stepper ──────────────────────── */}
          <div className="bg-white border-2 border-[#e5e5e5] p-3.5 sm:p-4 rounded-2xl shadow-xs space-y-2.5">
            <div className="flex items-center justify-between text-xs font-black">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 uppercase tracking-wider">
                  {isTa ? "தேர்வு முன்னேற்றம்" : "Quest Progress"}
                </span>
                <span className="text-[#1cb0f6]">
                  {currentIndex + 1} / {questions.length}
                </span>
              </div>
              <span className="text-slate-500 font-bold">
                {progressPercent}% {isTa ? "முடிந்தது" : "Complete"}
              </span>
            </div>

            {/* Glowing animated progress track */}
            <div className="w-full bg-[#f0f2f5] h-3.5 rounded-full overflow-hidden p-0.5 border border-[#e5e5e5] shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-[#1cb0f6] to-[#007AFF] rounded-full shadow-sm"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>

            {/* Clickable Question Navigator Dots */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {questions.map((q, qIdx) => {
                const qKey = getQKey(q, qIdx);
                const qAnswer = answers[qKey];
                const isAnswered =
                  q.category === "MCQ"
                    ? Boolean(qAnswer?.selectedMcqOption || (qIdx === currentIndex && selectedMcqOption))
                    : Boolean(qAnswer?.userAnswer?.trim() || (qIdx === currentIndex && userAnswer.trim()));
                const isEvaluated = Boolean(
                  qAnswer?.evaluationResult || (qIdx === currentIndex && evaluationResult)
                );

                return (
                  <button
                    key={qIdx}
                    onClick={() => handleJumpQuestion(qIdx)}
                    className={`relative w-8 h-8 rounded-xl text-xs font-black transition-all flex items-center justify-center border-2 ${
                      qIdx === currentIndex
                        ? "bg-[#1cb0f6] text-white border-[#1899d6] shadow-sm scale-110 z-10"
                        : isEvaluated
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:border-emerald-400"
                        : isAnswered
                        ? "bg-sky-50 text-[#1cb0f6] border-sky-300 hover:border-[#1cb0f6]"
                        : "bg-[#f7f7f7] text-slate-500 border-[#e5e5e5] hover:border-[#1cb0f6] hover:text-[#1cb0f6]"
                    }`}
                    title={`${isTa ? "வினா" : "Question"} ${qIdx + 1}${
                      isEvaluated
                        ? ` (${isTa ? "மதிப்பீடு செய்யப்பட்டது" : "Evaluated"})`
                        : isAnswered
                        ? ` (${isTa ? "விடையளிக்கப்பட்டது" : "Answered"})`
                        : ""
                    }`}
                  >
                    {qIdx + 1}
                    {isAnswered && qIdx !== currentIndex && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white shadow-xs" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── Interactive Question Card ─────────────────────────────────── */}
          <div className="bg-white border-2 border-[#e5e5e5] rounded-3xl p-6 sm:p-8 shadow-[0_8px_0_0_#e5e5e5] space-y-5">
            
            {/* Question Header Meta */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#f0f2f5]">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider border-2 ${
                  currentQuestion.category === "MCQ"
                    ? "bg-sky-50 text-[#1cb0f6] border-sky-200"
                    : currentQuestion.category === "2 Marks"
                    ? "bg-emerald-50 text-[#58cc02] border-emerald-200"
                    : "bg-purple-50 text-[#af70e6] border-purple-200"
                }`}>
                  {currentQuestion.category}
                </span>

                <span className="text-xs font-black text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl">
                  {currentQuestion.marks} {isTa ? "மதிப்பெண்" : (currentQuestion.marks === 1 ? "Mark" : "Marks")}
                </span>
              </div>

              {/* Interactive Audio Speaker for Question */}
              <button
                type="button"
                onClick={toggleSpeakQuestion}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border-2 transition-all ${
                  isSpeaking
                    ? "bg-emerald-500 text-white border-emerald-600 animate-pulse shadow-sm"
                    : "bg-[#f7f7f7] text-slate-600 border-[#e5e5e5] hover:text-[#1cb0f6] hover:border-[#1cb0f6]"
                }`}
                title={isTa ? "வினாவை வாசிக்கவும்" : "Listen to Question"}
              >
                {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                <span className="hidden sm:inline">
                  {isSpeaking ? (isTa ? "நிறுத்து" : "Stop") : (isTa ? "வாசி" : "Listen")}
                </span>
              </button>
            </div>

            {/* Question Prompt */}
            <div className="bg-[#f9fafb] p-5 rounded-2xl border-2 border-[#e5e5e5] shadow-inner">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                {currentQuestion.question}
              </h3>
            </div>

            {/* ─── MCQ Interactive Option Tiles (Screenshot 1) ─────────────── */}
            {currentQuestion.category === "MCQ" ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#1cb0f6]" />
                    <span>{isTa ? "சரியான விடையைத் தேர்ந்தெடுக்கவும்:" : "Select the correct option:"}</span>
                  </label>
                  <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                    {isTa ? "விசைப்பலகை குறுக்குவழிகள்: [A] [B] [C] [D]" : "Keyboard shortcuts: [A] [B] [C] [D]"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {currentQuestion.options?.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const isSelected = selectedMcqOption === opt;
                    return (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.015, translateY: -2 }}
                        whileTap={{ scale: 0.985, translateY: 2 }}
                        type="button"
                        onClick={() => handleSelectOption(opt)}
                        className={`group p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer relative ${
                          isSelected
                            ? "bg-sky-50 border-[#1cb0f6] shadow-[0_4px_0_0_#1899d6] text-sky-950 font-black"
                            : "bg-white border-[#e5e5e5] shadow-[0_4px_0_0_#e5e5e5] hover:border-[#1cb0f6]/60 text-slate-800 hover:shadow-[0_4px_0_0_#1cb0f6]/25 font-bold"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 pr-2">
                          <span
                            className={`w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center shrink-0 border-2 transition-all ${
                              isSelected
                                ? "bg-[#1cb0f6] text-white border-[#1899d6] shadow-sm"
                                : "bg-[#f7f7f7] text-slate-600 border-[#e5e5e5] group-hover:border-[#1cb0f6]/50 group-hover:text-[#1cb0f6]"
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="text-[14.5px] leading-snug">{opt}</span>
                        </div>

                        {/* Interactive Selection Check Ring */}
                        <div className="shrink-0 flex items-center">
                          {isSelected ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-6 h-6 rounded-full bg-[#1cb0f6] text-white flex items-center justify-center shadow-sm"
                            >
                              <CheckCircle2 size={16} strokeWidth={3} />
                            </motion.div>
                          ) : (
                            <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {letter}
                            </span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ─── Subjective / Descriptive Interactive Input (Screenshot 2) ─── */
              <div className="space-y-3.5 pt-2">
                {/* Input Mode Selector Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#f0f2f5] pb-3">
                  <div className="flex items-center gap-1 bg-[#f7f7f7] p-1 rounded-2xl border border-[#e5e5e5] shadow-inner">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setInputMode("typing");
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        inputMode === "typing"
                          ? "bg-white text-slate-900 shadow-sm border border-[#e5e5e5]"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Type size={14} className={inputMode === "typing" ? "text-[#1cb0f6]" : ""} />
                      <span>{isTa ? "தட்டச்சு" : "Typing"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setInputMode("voice");
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        inputMode === "voice"
                          ? "bg-white text-rose-600 shadow-sm border border-[#e5e5e5]"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Mic size={14} className={inputMode === "voice" ? "text-rose-500" : ""} />
                      <span>{isTa ? "குரல் வழி" : "Live Voice"}</span>
                    </button>
                  </div>

                  {/* Speech Dictation Button */}
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`btn-3d flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                      isRecording
                        ? "btn-3d-rose animate-pulse"
                        : "btn-3d-white text-[#1cb0f6] hover:text-[#007AFF]"
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff size={15} />
                        <span>{isTa ? "நிறுத்து" : "Stop Recording"}</span>
                      </>
                    ) : (
                      <>
                        <Mic size={15} />
                        <span>{isTa ? "பேசி விடை கூறவும்" : "Speak Answer"}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Live Voice Waveform Visualizer Banner */}
                {isRecording && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 text-rose-600 font-black text-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      <span>{isTa ? "குரலைக் கேட்கிறது... தெளிவாகப் பேசவும்" : "Listening live... speak your answer clearly"}</span>
                    </div>

                    {/* Animated Audio Waveform Bars */}
                    <div className="flex items-center gap-1 h-6">
                      <div className="w-1 bg-rose-500 rounded-full animate-wave-1" />
                      <div className="w-1 bg-rose-500 rounded-full animate-wave-2" />
                      <div className="w-1 bg-rose-500 rounded-full animate-wave-3" />
                      <div className="w-1 bg-rose-500 rounded-full animate-wave-4" />
                      <div className="w-1 bg-rose-500 rounded-full animate-wave-5" />
                    </div>
                  </motion.div>
                )}

                {/* Answer Textarea Console */}
                <div className="relative">
                  <textarea
                    rows={5}
                    value={userAnswer}
                    onChange={(e) => handleTextAnswerChange(e.target.value)}
                    placeholder={
                      isTa
                        ? "உங்கள் விளக்க விடையை இங்கே விரிவாக எழுதவும் அல்லது மேலே உள்ள குரல் பொத்தானைப் பயன்படுத்தவும்..."
                        : "Type or speak your answer with key concepts, definitions, and code syntax..."
                    }
                    className="w-full p-4 bg-[#f9fafb] border-2 border-[#e5e5e5] rounded-2xl text-[14.5px] font-semibold text-slate-900 focus:bg-white focus:border-[#1cb0f6] focus:ring-4 focus:ring-[#1cb0f6]/15 outline-none transition-all resize-none shadow-inner"
                  />

                  {/* Word Count Indicator */}
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mt-1 px-1">
                    <span>
                      {wordCount} {isTa ? "சொற்கள்" : (wordCount === 1 ? "word" : "words")}
                    </span>
                    {wordCount > 15 && (
                      <span className="text-[#58cc02] font-black">
                        ✓ {isTa ? "நல்ல விளக்கம்" : "Detailed response"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Socratic Hint Drawer */}
                {currentQuestion.keywords && currentQuestion.keywords.length > 0 && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setShowHint(!showHint);
                      }}
                      className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1.5 transition-colors"
                    >
                      <HelpCircle size={14} />
                      <span>{showHint ? (isTa ? "குறிப்பை மறை" : "Hide Socratic Clues") : (isTa ? "குறிப்பு தேவையா?" : "Need a clue?")}</span>
                    </button>

                    <AnimatePresence>
                      {showHint && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 p-3 bg-amber-50 border-2 border-amber-200 rounded-xl text-xs text-amber-900 space-y-1"
                        >
                          <p className="font-black">
                            {isTa ? "விடைக்கான முக்கிய கருத்துகள்:" : "Key concepts to remember in your answer:"}
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {currentQuestion.keywords.map((kw, kIdx) => (
                              <span key={kIdx} className="px-2 py-0.5 rounded-md bg-white border border-amber-300 font-bold text-[11px]">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {/* ─── Bottom Navigation & Evaluate Actions ─────────────────────── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t-2 border-[#f0f2f5]">
              {/* Prev / Next 3D Buttons */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePrevQuestion}
                  disabled={currentIndex === 0}
                  className="btn-3d btn-3d-white flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black disabled:opacity-40 flex items-center justify-center gap-1.5 text-slate-700"
                >
                  <ChevronLeft size={16} strokeWidth={3} />
                  <span>{isTa ? "முந்தையது" : "Prev"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextQuestion}
                  disabled={currentIndex === questions.length - 1}
                  className="btn-3d btn-3d-white flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black disabled:opacity-40 flex items-center justify-center gap-1.5 text-slate-700"
                >
                  <span>{isTa ? "அடுத்தது" : "Next"}</span>
                  <ChevronRight size={16} strokeWidth={3} />
                </button>
              </div>

              {/* Big 3D Evaluate Answer Action Button */}
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={evaluating}
                className="btn-3d btn-3d-blue w-full sm:w-auto px-7 py-3 rounded-2xl font-black text-sm text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {evaluating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin text-white" />
                    <span>{isTa ? "மதிப்பிடுகிறது..." : "Analyzing Answer..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="animate-bounce-pop" />
                    <span>{isTa ? "மதிப்பீடு செய்க" : "Evaluate Answer"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ─── Evaluation Result Card (Anchored with ref) ────────────────── */}
          <div ref={resultRef}>
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
        </div>
      )}

      {/* ─── Floating Mascot Bot with Live Question Context ────────────────── */}
      <FloatingMascotBot
        language={currentLang}
        currentQuestion={currentQuestion?.question || ""}
        currentCategory={currentQuestion?.category || ""}
      />
    </div>
  );
};

export default StudentTestView;
