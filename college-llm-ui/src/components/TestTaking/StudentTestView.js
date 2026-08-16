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
} from "lucide-react";

const StudentTestView = ({ language = "en", setLanguage }) => {
  const [category, setCategory] = useState("All");
  const [localLanguage, setLocalLanguage] = useState(language);
  const currentLang = setLanguage ? language : localLanguage;
  const changeLang = setLanguage ? setLanguage : setLocalLanguage;

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

  return (
    <div className="space-y-5">
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
                  ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-[#1e3a8a]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Right: Language Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeLang(currentLang === "en" ? "ta" : "en")}
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#1e3a8a] rounded-lg text-xs font-bold transition-all active:scale-95"
          >
            <Languages size={14} />
            <span>{currentLang === "en" ? "English (EN)" : "தமிழ் (TA)"}</span>
          </button>
        </div>
      </div>

      {/* Main Question & Answer Interface */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 shadow-xs">
          <RefreshCw size={20} className="animate-spin text-[#1e3a8a] mx-auto mb-2" />
          <p className="font-medium text-xs text-slate-600">
            {isTa ? "வினாக்களை ஏற்றுகிறது..." : "Loading questions..."}
          </p>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 shadow-xs">
          <BookOpen size={30} className="text-[#1e3a8a] mx-auto mb-2 opacity-70" />
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
                <span className="px-2 py-0.5 bg-[#1e3a8a] text-white rounded text-[11px] font-bold uppercase">
                  {currentQuestion.category}
                </span>
                <span className="text-xs font-semibold text-[#1e3a8a] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                  {currentQuestion.marks} {isTa ? "மதிப்பெண்" : (currentQuestion.marks === 1 ? "Mark" : "Marks")}
                </span>
              </div>

              <div className="text-xs font-bold text-slate-500">
                {isTa ? "வினா:" : "Question:"} <span className="text-[#1e3a8a] font-extrabold">{currentIndex + 1}</span> / {questions.length}
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
                          ? "bg-blue-50 text-[#1e3a8a] border-[#1e3a8a] shadow-xs"
                          : "bg-white text-slate-800 border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center shrink-0 ${
                            selectedMcqOption === opt
                              ? "bg-[#1e3a8a] text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span>{opt}</span>
                      </span>
                      {selectedMcqOption === opt && (
                        <CheckCircle2 size={16} className="text-[#1e3a8a] shrink-0" />
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
                          ? "bg-[#1e3a8a] text-white shadow-xs"
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
                        : "bg-blue-50 hover:bg-blue-100 text-[#1e3a8a] border border-blue-200"
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
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none transition-all"
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
                className="w-full sm:w-auto px-5 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
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





