import React, { useState, useEffect, useMemo } from "react";
import { fetchTestQuestions, addTestQuestion, deleteTestQuestion } from "../../api";
import {
  Plus,
  Trash2,
  Tag,
  Layers,
  Check,
  RefreshCw,
  Languages,
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  CheckCircle2,
  FolderOpen,
  X,
  SlidersHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// High-yield syllabus templates for teachers to quick-draft examination questions
const SYLLABUS_TEMPLATES = [
  {
    id: "py-loops",
    label: "Python: Loops & Control Structures",
    subject: "Machine Learning (22IST61)",
    category: "MCQ",
    language: "en",
    question: "Which of the following statements is used to skip the current iteration in a Python loop?",
    options: ["break", "continue", "pass", "return"],
    correctOption: "continue",
    keywords: ["continue"],
    sampleAnswer: "The 'continue' statement stops the current iteration and continues with the next iteration in the loop."
  },
  {
    id: "db-keys",
    label: "DBMS: Primary vs Foreign Key",
    subject: "Database Management (22IST34)",
    category: "2 Marks",
    language: "en",
    question: "Differentiate between a Primary Key and a Foreign Key in Relational Database Management Systems.",
    options: [],
    correctOption: "",
    keywords: ["unique", "foreign key", "primary key", "reference", "null", "integrity"],
    sampleAnswer: "A Primary Key uniquely identifies each record in a table and cannot contain NULL values. A Foreign Key is a field in one table that refers to the Primary Key in another table, establishing a relationship between the two."
  },
  {
    id: "os-sched",
    label: "OS: CPU Scheduling Algorithms",
    subject: "Operating Systems (22IST34)",
    category: "5 Marks",
    language: "en",
    question: "Explain the Round Robin (RR) and Shortest Job First (SJF) CPU scheduling algorithms with turnaround and waiting time parameters.",
    options: [],
    correctOption: "",
    keywords: ["round robin", "time quantum", "preemptive", "sjf", "waiting time", "turnaround time", "burst time", "gantt chart"],
    sampleAnswer: "Round Robin (RR) is a preemptive scheduling algorithm where each process gets executed for a fixed time quantum. Shortest Job First (SJF) selects the process with the shortest burst time. SJF minimizes average waiting time, while RR provides fairness and responsiveness for interactive systems."
  },
  {
    id: "ta-py-loops",
    label: "தமிழ்: பைத்தான் சுழற்சிகள் (MCQ)",
    subject: "Machine Learning (22IST61)",
    category: "MCQ",
    language: "ta",
    question: "பைத்தானில் ஒரு குறிப்பிட்ட எண்ணிக்கையிலான சுழற்சியை இயக்க எந்த சுழற்சி (loop) பயன்படுத்தப்படுகிறது?",
    options: ["while loop", "for loop", "do-while loop", "switch case"],
    correctOption: "for loop",
    keywords: ["for loop"],
    sampleAnswer: "பைத்தானில் வரம்பிற்குள் (range) சுழற்சி செய்ய 'for loop' பயன்படுகிறது."
  }
];

const AdminQuestionManager = ({ language: parentLang = "en", setLanguage: setParentLang }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterLanguage, setFilterLanguage] = useState("all");
  const [expandedCards, setExpandedCards] = useState({});

  // Form Builder State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [category, setCategory] = useState("MCQ");
  const [formLanguage, setFormLanguage] = useState(parentLang);
  const [questionText, setQuestionText] = useState("");
  const [sampleAnswer, setSampleAnswer] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState([]);

  // MCQ specific state
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState("");

  const isTa = parentLang === "ta";

  useEffect(() => {
    setFormLanguage(parentLang);
  }, [parentLang]);

  const loadAllQuestions = async () => {
    setLoading(true);
    try {
      const data = await fetchTestQuestions();
      setQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load test questions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllQuestions();
  }, []);

  // Pre-fill form from a high-yield syllabus template
  const handleApplyTemplate = (tpl) => {
    setCategory(tpl.category);
    setFormLanguage(tpl.language);
    setQuestionText(tpl.question);
    setSampleAnswer(tpl.sampleAnswer || "");
    setKeywords(tpl.keywords || []);
    if (tpl.category === "MCQ") {
      setOptions(tpl.options.length ? [...tpl.options] : ["", "", "", ""]);
      setCorrectOption(tpl.correctOption || "");
    } else {
      setOptions(["", "", "", ""]);
      setCorrectOption("");
    }
    setIsBuilderOpen(true);
  };

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords((prev) => [...prev, trimmed]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (kwToRemove) => {
    setKeywords((prev) => prev.filter((kw) => kw !== kwToRemove));
  };

  const handleOptionChange = (idx, value) => {
    const newOptions = [...options];
    newOptions[idx] = value;
    setOptions(newOptions);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!questionText.trim()) {
      alert(isTa ? "தயவுசெய்து வினா தலைப்பை உள்ளிடவும்." : "Please enter the question prompt.");
      return;
    }

    if (category === "MCQ") {
      const filledOptions = options.filter((o) => o.trim() !== "");
      if (filledOptions.length < 2) {
        alert(isTa ? "MCQ வினாவிற்கு குறைந்தபட்சம் 2 தெரிவுகளை உள்ளிடவும்." : "MCQ requires at least 2 valid choices.");
        return;
      }
      if (!correctOption.trim()) {
        alert(isTa ? "சரியான விடையைத் தேர்ந்தெடுக்கவும்." : "Please select the correct answer key for this MCQ.");
        return;
      }
    } else {
      if (!sampleAnswer.trim()) {
        alert(isTa ? "மதிப்பீட்டு மாதிரி விடையை உள்ளிடவும்." : "Please provide a reference benchmark answer.");
        return;
      }
      if (keywords.length === 0) {
        alert(isTa ? "குறைந்தபட்சம் ஒரு முக்கிய சொல்லைச் சேர்க்கவும்." : "Please add at least one grading keyword.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        question: questionText.trim(),
        category,
        language: formLanguage,
        options: category === "MCQ" ? options.filter((o) => o.trim() !== "") : [],
        correctOption: category === "MCQ" ? correctOption : null,
        sampleAnswer: category !== "MCQ" ? sampleAnswer.trim() : null,
        keywords: category !== "MCQ" ? keywords : []
      };

      await addTestQuestion(payload);

      // Reset form
      setQuestionText("");
      setSampleAnswer("");
      setKeywords([]);
      setKeywordInput("");
      setOptions(["", "", "", ""]);
      setCorrectOption("");
      setIsBuilderOpen(false);

      await loadAllQuestions();
    } catch (err) {
      console.error("Failed to add question:", err);
      alert(isTa ? "வினாவை சேமிக்க முடியவில்லை." : "Failed to save question. Please check server.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (qId) => {
    if (window.confirm(isTa ? "இந்த வினாவை நிச்சயமாக நீக்க விரும்புகிறீர்களா?" : "Are you sure you want to delete this question?")) {
      try {
        await deleteTestQuestion(qId);
        setQuestions((prev) => prev.filter((q) => q.id !== qId));
      } catch (err) {
        console.error("Error deleting question:", err);
      }
    }
  };

  // Card Accordion toggles
  const toggleCard = (id) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all = {};
    questions.forEach((q) => { all[q.id] = true; });
    setExpandedCards(all);
  };

  const collapseAll = () => {
    setExpandedCards({});
  };

  // Filter and Search logic
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesCategory = filterCategory === "All" || q.category === filterCategory;
      const matchesLang =
        filterLanguage === "all" ||
        q.language === filterLanguage ||
        (filterLanguage === "en" && q.language !== "ta") ||
        (filterLanguage === "ta" && q.language === "ta");

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        q.question?.toLowerCase().includes(query) ||
        q.sampleAnswer?.toLowerCase().includes(query) ||
        (q.keywords || []).some((kw) => kw.toLowerCase().includes(query));

      return matchesCategory && matchesLang && matchesSearch;
    });
  }, [questions, filterCategory, filterLanguage, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = questions.length;
    const mcq = questions.filter((q) => q.category === "MCQ").length;
    const twoM = questions.filter((q) => q.category === "2 Marks").length;
    const fiveM = questions.filter((q) => q.category === "5 Marks").length;
    const ta = questions.filter((q) => q.language === "ta").length;
    const en = total - ta;
    return { total, mcq, twoM, fiveM, en, ta };
  }, [questions]);

  return (
    <div className="space-y-5 text-slate-800">

      {/* ─── Faculty Header & Action Bar ───────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                <Layers size={13} className="text-indigo-600" />
                <span>{isTa ? "பல்கலைக்கழக வினா மேலாண்மை" : "Faculty Portal"}</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">Curriculum Standards v2.4</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {isTa ? "பாடத்திட்ட வினா வங்கி" : "Curriculum Question Bank"}
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {isTa
                ? "பல்கலைக்கழக பாடத்திட்ட வினாக்கள், மாதிரி விடைகள் மற்றும் AI மதிப்பீட்டு நெறிமுறைகளை நிர்வகிக்கவும்."
                : "Manage examination questions, configure benchmark model answers, and calibrate automated grading rubrics."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {setParentLang && (
              <button
                type="button"
                onClick={() => setParentLang(parentLang === "en" ? "ta" : "en")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
                title={isTa ? "Switch to English" : "தமிழுக்கு மாற்றவும்"}
              >
                <Languages size={14} className="text-slate-500" />
                <span>{parentLang === "en" ? "தமிழ்" : "English"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={loadAllQuestions}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
              title="Refresh Question Bank"
            >
              <RefreshCw size={13} className={`text-slate-500 ${loading ? "animate-spin text-indigo-600" : ""}`} />
              <span>{isTa ? "புதுப்பி" : "Refresh"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBuilderOpen(!isBuilderOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus size={14} />
              <span>{isBuilderOpen ? (isTa ? "படிவத்தை மூடு" : "Close Editor") : (isTa ? "புதிய வினா சேர்க்க" : "New Question")}</span>
            </button>
          </div>
        </div>

        {/* ─── Executive Metrics Strip ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 mt-5 pt-4 border-t border-slate-100">
          <div className="py-2 sm:py-0 sm:px-3 first:pl-0">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              {isTa ? "மொத்த வினாக்கள்" : "Total Questions"}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
              <span className="text-[11px] text-slate-400 font-medium">in bank</span>
            </div>
          </div>

          <div className="py-2 sm:py-0 sm:px-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              {isTa ? "MCQ வினாக்கள்" : "Multiple Choice (1M)"}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">{stats.mcq}</span>
              <span className="text-[11px] text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded">Objective</span>
            </div>
          </div>

          <div className="py-2 sm:py-0 sm:px-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              {isTa ? "குறுவினா (2 மதிப்பெண்)" : "Short Answer (2M)"}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">{stats.twoM}</span>
              <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">Concept</span>
            </div>
          </div>

          <div className="py-2 sm:py-0 sm:px-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              {isTa ? "நெடுவினா (5 மதிப்பெண்)" : "Essay Answer (5M)"}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">{stats.fiveM}</span>
              <span className="text-[11px] text-purple-600 font-medium bg-purple-50 px-1.5 py-0.5 rounded">Analysis</span>
            </div>
          </div>

          <div className="py-2 sm:py-0 sm:px-3 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              {isTa ? "மொழி விகிதம்" : "Language Coverage"}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm font-bold text-slate-800">
                {stats.en} <span className="text-xs font-normal text-slate-500">EN</span> • {stats.ta} <span className="text-xs font-normal text-slate-500">TA</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Pre-configured Syllabus Templates Toolbar ─────────────────────── */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-indigo-600 shrink-0" />
          <span className="text-xs font-semibold text-slate-700">
            {isTa ? "பாடத்திட்ட முன்மாதிரிகள் (Quick Draft):" : "Syllabus Standard Templates:"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {SYLLABUS_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handleApplyTemplate(tpl)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-slate-700 text-xs font-medium transition-colors shadow-2xs"
            >
              <span>{tpl.label}</span>
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                {tpl.category}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Question Builder / Editor Drawer ──────────────────────────────── */}
      <AnimatePresence>
        {isBuilderOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isTa ? "புதிய வினா உருவாக்கும் களம்" : "Author Examination Question"}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">| {isTa ? "பாடத்திட்ட நெறிமுறை" : "Curriculum Specification"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLivePreview(!showLivePreview)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
                  >
                    {showLivePreview ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>{showLivePreview ? (isTa ? "முன்னோட்டம் மறை" : "Hide Preview") : (isTa ? "மாணவர் பார்வை முன்னோட்டம்" : "Student View Preview")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsBuilderOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Row: Category & Language Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {isTa ? "மதிப்பீட்டு வகை (Category)" : "Assessment Category"}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "MCQ", label: "MCQ (1M)" },
                        { id: "2 Marks", label: isTa ? "2 மதிப்பெண்" : "Short (2M)" },
                        { id: "5 Marks", label: isTa ? "5 மதிப்பெண்" : "Essay (5M)" }
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                            category === cat.id
                              ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {isTa ? "வினா மொழி (Language)" : "Medium of Instruction"}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "en", label: "English" },
                        { id: "ta", label: "தமிழ்" },
                        { id: "both", label: isTa ? "இருமொழி" : "Bilingual" }
                      ].map((lang) => (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => setFormLanguage(lang.id)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                            formLanguage === lang.id
                              ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Question Prompt */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isTa ? "வினா தலைப்பு (Question Prompt)" : "Question Prompt"}
                  </label>
                  <textarea
                    rows={2}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder={isTa ? "மாணவர்கள் விடையளிக்க வேண்டிய வினாவை உள்ளிடவும்..." : "Enter the complete question prompt as specified in curriculum..."}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors resize-none placeholder:text-slate-400"
                  />
                </div>

                {/* MCQ Options Configuration */}
                {category === "MCQ" && (
                  <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800">
                        {isTa ? "தெரிவுகள் மற்றும் சரியான விடைக்குறியீடு" : "Answer Choices (Select radio button for Correct Answer Key)"}
                      </label>
                      <span className="text-[11px] text-slate-500">
                        {isTa ? "குறைந்தபட்சம் 2 தெரிவுகள்" : "Min 2 options required"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {options.map((opt, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        const isCorrect = correctOption === opt && opt.trim().length > 0;
                        return (
                          <div
                            key={idx}
                            className={`flex items-center gap-2 p-2 rounded-lg border transition-colors bg-white ${
                              isCorrect
                                ? "border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500/20"
                                : "border-slate-200"
                            }`}
                          >
                            <span className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center shrink-0 border ${
                              isCorrect
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}>
                              {letter}
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleOptionChange(idx, e.target.value)}
                              placeholder={`${isTa ? "தெரிவு" : "Option"} ${letter}`}
                              className="flex-1 bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
                            />
                            <button
                              type="button"
                              onClick={() => setCorrectOption(opt)}
                              className={`px-2 py-1 rounded text-[10px] font-semibold uppercase transition-colors ${
                                isCorrect
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {isCorrect ? "✓ Key" : "Set Key"}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {correctOption && (
                      <div className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        <span>{isTa ? "தேர்ந்தெடுக்கப்பட்ட விடைக்குறிப்பு:" : "Active Answer Key:"}</span>
                        <span className="font-semibold text-emerald-950 underline">{correctOption}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Sample Reference Model Answer */}
                {category !== "MCQ" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isTa ? "மாதிரி விடைக்குறிப்பு (Reference Model Answer for AI Evaluator)" : "Reference Model Answer (Evaluation Benchmark)"}
                    </label>
                    <textarea
                      rows={3}
                      value={sampleAnswer}
                      onChange={(e) => setSampleAnswer(e.target.value)}
                      placeholder={isTa ? "தானியங்கி மதிப்பீட்டுக்குரிய மாதிரி விடையை உள்ளிடவும்..." : "Enter the textbook ideal benchmark answer for automated semantic comparison..."}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors resize-none placeholder:text-slate-400"
                    />
                  </div>
                )}

                {/* Target Evaluation Keywords */}
                {category !== "MCQ" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Tag size={12} className="text-indigo-600" />
                      <span>{isTa ? "மதிப்பீட்டு முக்கிய சொற்கள் (Grading Keywords)" : "Target Grading Rubric Keywords"}</span>
                    </label>

                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddKeyword();
                          }
                        }}
                        placeholder={isTa ? "முக்கிய சொல்லை எழுதி Enter அழுத்தவும் (எ.கா: foreign key, ACID)..." : "Type keyword and press Enter (e.g., deadlock, foreign key)..."}
                        className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs focus:border-indigo-500 outline-none placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={handleAddKeyword}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        {isTa ? "+ சேர்" : "+ Add"}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg min-h-[38px] items-center">
                      {keywords.length > 0 ? (
                        keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 text-slate-800 rounded text-xs font-medium shadow-2xs"
                          >
                            <span>✓ {kw}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveKeyword(kw)}
                              className="text-slate-400 hover:text-rose-600 ml-0.5 leading-none"
                            >
                              ×
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          {isTa ? "முக்கிய சொற்கள் எதுவும் சேர்க்கப்படவில்லை." : "No target keywords added yet. Press Enter or click '+ Add' above."}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Live Student Preview Card */}
                {showLivePreview && (
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
                      <Eye size={13} />
                      <span>{isTa ? "மாணவர் தேர்வுத்தாள் முன்னோட்டம்" : "Student View Examination Paper Preview"}</span>
                    </div>

                    <div className="bg-white p-3.5 rounded border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                          {category}
                        </span>
                        <span className="text-slate-400">
                          {category === "MCQ" ? "1 Mark" : category === "2 Marks" ? "2 Marks" : "5 Marks"}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900">
                        {questionText || (isTa ? "வினா தலைப்பு இங்கே தோன்றும்..." : "Question prompt will preview here...")}
                      </p>

                      {category === "MCQ" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {options.map((opt, i) => (
                            <div key={i} className="p-2 rounded border border-slate-200 bg-slate-50/50 text-slate-700 flex items-center gap-2">
                              <span className="w-5 h-5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                                {String.fromCharCode(65 + i)}
                              </span>
                              <span>{opt || `Option ${String.fromCharCode(65 + i)}`}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Form Action Controls */}
                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsBuilderOpen(false)}
                    className="px-4 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors"
                  >
                    {isTa ? "ரத்துசெய்" : "Cancel"}
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw size={13} className="animate-spin text-white" />
                        <span>{isTa ? "சேமிக்கிறது..." : "Saving..."}</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>{isTa ? "வினாவை சேமிக்கவும்" : "Save Question to Bank"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Search & Filtering Toolbar ────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isTa ? "வினாக்கள், முக்கிய சொற்கள் அல்லது தலைப்புகளைத் தேடவும்..." : "Search questions, keywords, or topics..."}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50/50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Quick Expand / Collapse Batch Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={expandAll}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors"
              title="Expand all questions"
            >
              <ChevronDown size={13} />
              <span className="hidden sm:inline">{isTa ? "அனைத்தையும் திற" : "Expand All"}</span>
            </button>

            <button
              type="button"
              onClick={collapseAll}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors"
              title="Collapse all questions"
            >
              <ChevronUp size={13} />
              <span className="hidden sm:inline">{isTa ? "அனைத்தையும் சுருக்கு" : "Collapse All"}</span>
            </button>
          </div>
        </div>

        {/* Filter Segmented Controls: Category & Language */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <SlidersHorizontal size={12} className="text-slate-400" />
              <span>{isTa ? "வகை:" : "Type:"}</span>
            </span>

            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/80">
              {["All", "MCQ", "2 Marks", "5 Marks"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    filterCategory === cat
                      ? "bg-white text-slate-900 font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              {isTa ? "மொழி:" : "Lang:"}
            </span>

            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/80">
              {[
                { id: "all", label: isTa ? "அனைத்தும்" : "All" },
                { id: "en", label: "English" },
                { id: "ta", label: "தமிழ்" },
              ].map((lng) => (
                <button
                  key={lng.id}
                  type="button"
                  onClick={() => setFilterLanguage(lng.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    filterLanguage === lng.id
                      ? "bg-white text-slate-900 font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {lng.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Question Repository List ──────────────────────────────────────── */}
      <div className="space-y-2">
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 shadow-xs">
            <RefreshCw size={20} className="animate-spin text-indigo-600 mx-auto mb-2" />
            <p className="font-semibold text-xs text-slate-700">
              {isTa ? "பாடத்திட்ட வினா வங்கியைத் திரட்டுகிறது..." : "Loading curriculum repository..."}
            </p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 shadow-xs space-y-2">
            <FolderOpen size={30} className="text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              {isTa ? "பொருந்தும் வினாக்கள் எதுவும் இல்லை" : "No Questions Match Selected Criteria"}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {isTa ? "வடிகட்டி அளவுகோல்களை மாற்றவும் அல்லது புதிய வினாவை உருவாக்கவும்." : "Try adjusting your search query or filter tags to discover repository entries."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
              <span>
                {isTa ? "காண்பிக்கப்படும் வினாக்கள்" : "Displaying"}:{" "}
                <strong className="text-slate-900">{filteredQuestions.length}</strong> of {questions.length} questions
              </span>
              <span className="text-[11px] text-slate-400">
                {isTa ? "விரிவாக்க அட்டை மீது சொடுக்கவும்" : "Click row to view answer key & rubrics"}
              </span>
            </div>

            <div className="space-y-1.5">
              {filteredQuestions.map((q) => {
                const isExpanded = Boolean(expandedCards[q.id]);
                return (
                  <div
                    key={q.id}
                    className={`bg-white border rounded-xl transition-all shadow-2xs overflow-hidden ${
                      isExpanded
                        ? "border-indigo-300 ring-1 ring-indigo-500/10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {/* Collapsible Row Header */}
                    <div
                      onClick={() => toggleCard(q.id)}
                      className="p-3 sm:p-3.5 cursor-pointer flex items-center justify-between gap-3 select-none"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 border ${
                            q.category === "MCQ"
                              ? "bg-blue-50 text-blue-700 border-blue-200/60"
                              : q.category === "2 Marks"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                              : "bg-purple-50 text-purple-700 border-purple-200/60"
                          }`}
                        >
                          {q.category}
                        </span>

                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium uppercase shrink-0">
                          {q.language === "ta" ? "TA" : "EN"}
                        </span>

                        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                          {q.question}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium">
                          {q.category === "MCQ"
                            ? `${(q.options || []).length} options`
                            : `${(q.keywords || []).length} keywords`}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(q.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title={isTa ? "வினாவை நீக்கு" : "Delete Question"}
                        >
                          <Trash2 size={14} />
                        </button>

                        <div className="text-slate-400">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Drawer Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-3 bg-slate-50/40">
                        {/* Full Question Text */}
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                            {isTa ? "முழு வினா தலைப்பு:" : "Curriculum Question Prompt:"}
                          </span>
                          <p className="text-xs font-semibold text-slate-900 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                            {q.question}
                          </p>
                        </div>

                        {/* MCQ Options Display */}
                        {q.category === "MCQ" && q.options?.length > 0 && (
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                              {isTa ? "விடைக் கட்டமைப்புகள்:" : "Multiple Choice Options:"}
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.options.map((opt, i) => {
                                const isCorrect = opt === q.correctOption;
                                return (
                                  <div
                                    key={i}
                                    className={`p-2 rounded-lg text-xs border flex items-center justify-between ${
                                      isCorrect
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold"
                                        : "bg-white border-slate-200 text-slate-700"
                                    }`}
                                  >
                                    <span className="flex items-center gap-2">
                                      <span className={`w-5 h-5 rounded font-bold text-[10px] flex items-center justify-center border ${
                                        isCorrect
                                          ? "bg-emerald-600 text-white border-emerald-600"
                                          : "bg-slate-100 text-slate-600 border-slate-200"
                                      }`}>
                                        {String.fromCharCode(65 + i)}
                                      </span>
                                      <span>{opt}</span>
                                    </span>
                                    {isCorrect && (
                                      <span className="text-[10px] font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                                        ✓ Correct Key
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Sample Reference Answer */}
                        {q.sampleAnswer && (
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                              {isTa ? "பாடப்புத்தக மாதிரி விடைக்குறிப்பு:" : "Standard Model Benchmark Answer:"}
                            </span>
                            <div className="text-xs text-slate-800 bg-white p-3 rounded-lg border-l-3 border-indigo-500 border-t border-r border-b border-slate-200 leading-relaxed">
                              <p className="whitespace-pre-wrap">{q.sampleAnswer}</p>
                            </div>
                          </div>
                        )}

                        {/* Evaluation Keywords */}
                        {q.keywords?.length > 0 && (
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                              <Tag size={11} className="text-indigo-600" />
                              <span>{isTa ? "மதிப்பீட்டு முக்கிய சொற்கள்:" : "AI Evaluation Rubric Keywords:"}</span>
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {q.keywords.map((kw, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded text-xs font-medium"
                                >
                                  ✓ {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminQuestionManager;
