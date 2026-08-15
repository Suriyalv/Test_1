import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchTestQuestions, evaluateTestAnswer } from "../../api";
import EvaluationResultCard from "./EvaluationResultCard";
import {
  Mic,
  MicOff,
  Type,
  Languages,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  RefreshCw,
} from "lucide-react";

const StudentTestView = () => {
  const [category, setCategory] = useState("All");
  const [language, setLanguage] = useState("en"); // "en" | "ta"
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
      recognitionRef.current.lang = language === "ta" ? "ta-IN" : "en-US";
    }
  }, [language]);

  // Load questions
  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setEvaluationResult(null);
    setUserAnswer("");
    setSelectedMcqOption("");
    try {
      const data = await fetchTestQuestions(category, language);
      setQuestions(data);
      setCurrentIndex(0);
    } catch (err) {
      console.error("Error loading test questions:", err);
    } finally {
      setLoading(false);
    }
  }, [category, language]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const currentQuestion = questions[currentIndex];

  // Toggle Voice Recording
  const toggleRecording = () => {
    if (!speechSupported) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        initialTextRef.current = userAnswer;
        recognitionRef.current.lang = language === "ta" ? "ta-IN" : "en-US";
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
        language === "ta"
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
        language: language,
        correctOption: currentQuestion.correctOption || "",
      };

      const res = await evaluateTestAnswer(payload);
      setEvaluationResult(res);
    } catch (err) {
      console.error("Evaluation error:", err);
      alert("Evaluation failed. Please try again.");
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

  const isTa = language === "ta";

  return (
    <div className="space-y-6">
      {/* Test Controls Bar */}
      <div className="bg-black text-white p-5 rounded-2xl border-2 border-blue-600 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Left: Category Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-2">
            {isTa ? "பிரிவு:" : "Category:"}
          </span>
          {["All", "MCQ", "2 Marks", "5 Marks"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                category === cat
                  ? "bg-blue-600 text-white border-blue-400 shadow-md"
                  : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Right: Language Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLanguage(language === "en" ? "ta" : "en")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-950/80 hover:bg-blue-900 border border-blue-600/50 text-blue-300 rounded-xl text-xs font-bold transition-all"
          >
            <Languages size={16} className="text-blue-400" />
            <span>{language === "en" ? "English → தமிழ்" : "தமிழ் → English"}</span>
          </button>
        </div>
      </div>

      {/* Main Question & Answer Interface */}
      {loading ? (
        <div className="bg-white border border-black rounded-2xl p-12 text-center text-gray-500">
          <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="font-semibold text-sm">
            {isTa ? "வினாக்களை ஏற்றுகிறது..." : "Loading test questions..."}
          </p>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white border border-gray-300 rounded-2xl p-12 text-center text-gray-500">
          <BookOpen size={32} className="text-blue-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-black mb-1">
            {isTa ? "வினாக்கள் எதுவும் கிடைக்கவில்லை" : "No Questions Available"}
          </h3>
          <p className="text-xs text-gray-500">
            {isTa
              ? "இந்த பிரிவில் வினாக்கள் எதுவும் பதிவிடப்படவில்லை. நிர்வாகி போர்ட்டலில் வினாக்களை சேர்க்கவும்."
              : "No test questions found for this filter. Use the Admin Portal to add questions."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Question Card */}
          <div className="bg-white border border-black rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden">
            {/* Header: Progress & Category */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-black text-white rounded-lg text-xs font-bold uppercase tracking-wider">
                  {currentQuestion.category}
                </span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                  {currentQuestion.marks} {currentQuestion.marks === 1 ? "Mark" : "Marks"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                <span>
                  {isTa ? "கேள்வி" : "Question"} {currentIndex + 1} / {questions.length}
                </span>
              </div>
            </div>

            {/* Question Text Prompt */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-black leading-relaxed">
                {currentQuestion.question}
              </h3>
            </div>

            {/* Answer Input Section */}
            {currentQuestion.category === "MCQ" ? (
              /* MCQ Choices */
              <div className="space-y-3 my-6">
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
                  {isTa ? "சரியான விடையைத் தேர்ந்தெடுக்கவும்:" : "Select your answer:"}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentQuestion.options?.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedMcqOption(opt)}
                      className={`p-4 rounded-xl border text-left text-sm font-semibold transition-all flex items-center justify-between ${
                        selectedMcqOption === opt
                          ? "bg-black text-white border-black shadow-md ring-2 ring-blue-600"
                          : "bg-gray-50 text-gray-800 border-gray-200 hover:border-black"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                            selectedMcqOption === opt
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span>{opt}</span>
                      </span>
                      {selectedMcqOption === opt && (
                        <CheckCircle size={18} className="text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Descriptive Answer (Voice or Typing) */
              <div className="space-y-4 my-6">
                {/* Input Mode Selector & Voice Button */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInputMode("typing")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        inputMode === "typing"
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <Type size={14} />
                      <span>{isTa ? "தட்டச்சு" : "Typing"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInputMode("voice")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        inputMode === "voice"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <Mic size={14} />
                      <span>{isTa ? "குரல் வழி" : "Voice Input"}</span>
                    </button>
                  </div>

                  {/* Speech mic toggle button */}
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isRecording
                        ? "bg-blue-600 text-white animate-pulse shadow-lg shadow-blue-500/30"
                        : "bg-gray-100 hover:bg-gray-200 text-black border border-gray-300"
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff size={16} />
                        <span>{isTa ? "பதிவை நிறுத்த" : "Stop Voice Recording"}</span>
                      </>
                    ) : (
                      <>
                        <Mic size={16} className="text-blue-600" />
                        <span>
                          {isTa
                            ? "பேசி விடையை பதிவு செய்க"
                            : `Speak Answer (${language === "ta" ? "தமிழ்" : "English"})`}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* Answer Textarea */}
                <div className="relative">
                  <textarea
                    rows={6}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder={
                      isTa
                        ? "உங்கள் விடையை இங்கே தட்டச்சு செய்யவும் அல்லது மேலே உள்ள 'பேசி விடையை பதிவு செய்க' பொத்தானைப் பயன்படுத்தி குரல் மூலம் கூறவும்..."
                        : "Type your answer here or click the 'Speak Answer' button to answer using your voice..."
                    }
                    className="w-full p-4 bg-gray-50 border border-gray-300 rounded-xl text-sm leading-relaxed text-black focus:bg-white focus:border-black focus:ring-2 focus:ring-blue-600 outline-none transition-all font-sans"
                  />

                  {/* Recording Status Pulse Overlay */}
                  {isRecording && (
                    <div className="absolute top-3 right-3 flex items-center gap-2 bg-black text-white px-3 py-1 rounded-full text-xs font-bold border border-blue-500 animate-pulse">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      <span>{isTa ? "குரலை பதிவு செய்கிறது..." : "Listening to voice..."}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Actions: Navigation & Evaluate Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevQuestion}
                  disabled={currentIndex === 0}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-black font-semibold text-xs rounded-xl transition-all flex items-center gap-1"
                >
                  <ChevronLeft size={16} />
                  <span>{isTa ? "முந்தைய" : "Previous"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextQuestion}
                  disabled={currentIndex === questions.length - 1}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-black font-semibold text-xs rounded-xl transition-all flex items-center gap-1"
                >
                  <span>{isTa ? "அடுத்த" : "Next"}</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={evaluating}
                className="w-full sm:w-auto px-8 py-3 bg-black hover:bg-zinc-900 text-white font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 border border-blue-600"
              >
                {evaluating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin text-blue-400" />
                    <span>{isTa ? "LLM சரிபார்க்கிறது..." : "LLM Evaluating Answer..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="text-blue-400" />
                    <span>{isTa ? "பதிலைச் சரிபார்க்க (LLM)" : "Evaluate & Check Accuracy"}</span>
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
              language={language}
              onNextQuestion={
                currentIndex < questions.length - 1 ? handleNextQuestion : null
              }
            />
          )}
        </div>
      )}
    </div>
  );
};

export default StudentTestView;
