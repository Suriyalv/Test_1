import React, { useState, useEffect } from "react";
import { fetchTestQuestions, addTestQuestion, deleteTestQuestion } from "../../api";
import { PlusCircle, Trash2, Tag, Layers, Check, RefreshCw, Languages } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AdminQuestionManager = ({ language: parentLang = "en", setLanguage: setParentLang }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All");

  const isTa = parentLang === "ta";

  // Form State
  const [category, setCategory] = useState("2 Marks");
  const [formLanguage, setFormLanguage] = useState(parentLang);
  const [questionText, setQuestionText] = useState("");
  const [sampleAnswer, setSampleAnswer] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState([]);
  
  // MCQ specific state
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState("");

  const loadAllQuestions = async () => {
    setLoading(true);
    try {
      const data = await fetchTestQuestions("All", "all");
      setQuestions(data);
    } catch (err) {
      console.error("Failed to load questions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllQuestions();
  }, []);

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (kwToRemove) => {
    setKeywords(keywords.filter((k) => k !== kwToRemove));
  };

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) {
      alert(isTa ? "தயவுசெய்து வினாவை உள்ளிடவும்." : "Please enter the question prompt.");
      return;
    }

    if (category === "MCQ") {
      const validOptions = options.map((o) => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        alert(isTa ? "MCQ வினாவிற்கு குறைந்தது 2 தெரிவுகளை வழங்கவும்." : "Please provide at least 2 options for MCQ.");
        return;
      }
      if (!correctOption.trim()) {
        alert(isTa ? "சரியான விடையைத் தேர்ந்தெடுக்கவும்." : "Please select the correct option.");
        return;
      }
    } else {
      if (keywords.length === 0) {
        alert(isTa ? "துல்லிய மதிப்பீட்டிற்காக குறைந்தது 1 முக்கிய சொல்லை சேர்க்கவும்." : "Please add at least 1 evaluation keyword.");
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        category,
        language: formLanguage,
        question: questionText,
        sampleAnswer,
        keywords: category === "MCQ" ? [correctOption] : keywords,
        options: category === "MCQ" ? options.filter(Boolean) : [],
        correctOption: category === "MCQ" ? correctOption : "",
        marks: category === "MCQ" ? 1 : category === "2 Marks" ? 2 : 5,
      };

      await addTestQuestion(payload);
      
      // Reset Form
      setQuestionText("");
      setSampleAnswer("");
      setKeywords([]);
      setKeywordInput("");
      setOptions(["", "", "", ""]);
      setCorrectOption("");
      
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
        setQuestions(questions.filter((q) => q.id !== qId));
      } catch (err) {
        console.error("Error deleting question:", err);
      }
    }
  };

  const filteredQuestions = filterCategory === "All" 
    ? questions 
    : questions.filter((q) => q.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1e3a8a] uppercase tracking-wide">
              <Layers size={14} /> {isTa ? "ஆசிரியர் & வினா மேலாண்மை தளம்" : "Faculty & Examination Repository"}
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {isTa ? "பாடத்திட்ட வினா வங்கி களஞ்சியம்" : "Curriculum Question Bank Repository"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isTa ? "பாடத்திட்ட வினாக்கள், முக்கிய சொற்கள் மற்றும் மாதிரி விடைகளை உள்ளிட்டு நிர்வகிக்கலாம்." : "Manage curriculum questions, target keywords, and reference model answers."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {setParentLang && (
            <button
              onClick={() => setParentLang(parentLang === "en" ? "ta" : "en")}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#1e3a8a] rounded-lg text-xs font-bold transition-all"
            >
              <Languages size={14} />
              <span>{parentLang === "en" ? "தமிழ்" : "English"}</span>
            </button>
          )}

          <button
            onClick={loadAllQuestions}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#1e3a8a] border border-slate-200 rounded-lg text-xs font-bold transition-all active:scale-95"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-[#1e3a8a]" : ""} />
            <span>{isTa ? "புதுப்பிக்க" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Creation Form Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
          <PlusCircle size={16} className="text-[#1e3a8a]" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            {isTa ? "புதிய தேர்வு வினாவைச் சேர்க்கவும்" : "Create New Examination Question"}
          </h3>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Row 1: Category & Language */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {isTa ? "வினா பிரிவு" : "Question Category"}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["MCQ", "2 Marks", "5 Marks"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${
                      category === cat
                        ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {isTa ? "மொழி" : "Language"}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "en", label: "English" },
                  { id: "ta", label: "தமிழ்" },
                  { id: "both", label: isTa ? "இருமொழிகள்" : "Bilingual" },
                ].map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setFormLanguage(lang.id)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${
                      formLanguage === lang.id
                        ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {isTa ? "வினா தலைப்பு (Question Prompt)" : "Question Prompt"}
            </label>
            <textarea
              rows={2}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder={isTa ? "வினாவை உள்ளிடவும்..." : "Enter the question prompt..."}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none transition-all"
            />
          </div>

          {/* MCQ Options Field */}
          {category === "MCQ" && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                {isTa ? "பல்வேறு தெரிவுகள் & சரியான விடையைத் தேர்ந்தெடுக்கவும்" : "MCQ Options & Select Correct Answer"}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                    <span className="w-6 h-6 rounded-md bg-[#1e3a8a] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`${isTa ? "தெரிவு" : "Option"} ${String.fromCharCode(65 + idx)}`}
                      className="flex-1 p-1 bg-transparent text-xs font-medium outline-none"
                    />
                    <input
                      type="radio"
                      name="correctOptionRadio"
                      checked={correctOption === opt && opt.length > 0}
                      onChange={() => setCorrectOption(opt)}
                      title={isTa ? "சரியான விடையாக குறிக்கவும்" : "Mark as correct answer"}
                      className="w-4 h-4 accent-[#1e3a8a] cursor-pointer"
                    />
                  </div>
                ))}
              </div>
              {correctOption && (
                <div className="text-xs text-[#1e3a8a] font-bold bg-blue-50 p-2 rounded-md border border-blue-200">
                  ✓ {isTa ? "சரியான விடை:" : "Selected Correct Option:"} <strong>{correctOption}</strong>
                </div>
              )}
            </div>
          )}

          {/* Sample Reference Answer */}
          {category !== "MCQ" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {isTa ? "பாடப்புத்தக மாதிரி விடை (Ideal Reference Model Answer)" : "Ideal Reference Model Answer"}
              </label>
              <textarea
                rows={3}
                value={sampleAnswer}
                onChange={(e) => setSampleAnswer(e.target.value)}
                placeholder={isTa ? "மாதிரி விடையை உள்ளிடவும்..." : "Enter textbook sample answer for evaluation comparison..."}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-sans focus:bg-white focus:border-[#1e3a8a] outline-none transition-all"
              />
            </div>
          )}

          {/* Keyword Generator Section */}
          {category !== "MCQ" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag size={13} className="text-[#1e3a8a]" />
                {isTa ? "மதிப்பீட்டு முக்கிய சொற்கள் (Target Evaluation Keywords)" : "Target Evaluation Keywords"}
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
                  placeholder={isTa ? "முக்கிய சொல்லை உள்ளிட்டு Enter அழுத்தவும்..." : "Type keyword and press Enter..."}
                  className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:border-[#1e3a8a] outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="px-3.5 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-lg text-xs font-bold transition-colors"
                >
                  {isTa ? "+ சேர்" : "+ Add"}
                </button>
              </div>

              {/* Keyword Badges */}
              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg min-h-[36px]">
                {keywords.length > 0 ? (
                  keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 bg-blue-50 text-[#1e3a8a] border border-blue-200 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                    >
                      {kw}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw)}
                        className="text-slate-400 hover:text-red-600 font-bold text-sm leading-none ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    {isTa ? "முக்கிய சொற்கள் எதுவும் சேர்க்கப்படவில்லை." : "No keywords added yet."}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>{isTa ? "சேமிக்கிறது..." : "Saving..."}</span>
                </>
              ) : (
                <>
                  <Check size={14} className="text-white" />
                  <span>{isTa ? "வினாவை சேமி (Save Question)" : "Save Question to Bank"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Questions List */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              {isTa ? "பதிவேற்றப்பட்ட வினாக்கள்" : "Uploaded Questions"} ({filteredQuestions.length})
            </h3>
            <p className="text-xs text-slate-500">{isTa ? "வினா வகையை தேர்ந்தெடுத்து வடிகட்டலாம்" : "Filter by question category"}</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {["All", "MCQ", "2 Marks", "5 Marks"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                  filterCategory === cat
                    ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-[#1e3a8a]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-[#1e3a8a]" />
            <span>{isTa ? "தரவுகளை ஏற்றுகிறது..." : "Loading question bank data..."}</span>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs font-medium">
            {isTa ? "இந்த பிரிவில் வினாக்கள் எதுவும் பதிவிடப்படவில்லை." : "No questions found for this category."}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredQuestions.map((q) => (
                <motion.div
                  key={q.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-slate-50 border border-slate-200 hover:border-blue-200 rounded-xl p-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#1e3a8a] text-white text-[10px] font-bold rounded uppercase">
                          {q.category}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-50 text-[#1e3a8a] border border-blue-200 text-[10px] font-bold rounded uppercase">
                          {q.language === "ta" ? "தமிழ்" : q.language === "en" ? "English" : "Bilingual"}
                        </span>
                        <span className="text-[11px] text-slate-500 font-semibold">
                          {q.marks} {q.marks === 1 ? (isTa ? "மதிப்பெண்" : "Mark") : (isTa ? "மதிப்பெண்கள்" : "Marks")}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {q.question}
                      </h4>

                      {q.category === "MCQ" && q.options?.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {q.options.map((opt, i) => (
                            <div
                              key={i}
                              className={`p-2 rounded-lg text-xs border ${
                                opt === q.correctOption
                                  ? "bg-blue-50 border-blue-300 font-bold text-[#1e3a8a]"
                                  : "bg-white border-slate-200 text-slate-700"
                              }`}
                            >
                              {String.fromCharCode(65 + i)}. {opt}
                              {opt === q.correctOption && " ✓"}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.sampleAnswer && (
                        <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed font-sans">
                          <strong className="text-slate-900 font-bold">{isTa ? "மாதிரி விடை: " : "Reference Answer: "}</strong>
                          {q.sampleAnswer}
                        </div>
                      )}

                      {q.keywords?.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          <span className="text-[11px] font-bold text-slate-500 mr-1">{isTa ? "முக்கிய சொற்கள்:" : "Keywords:"}</span>
                          {q.keywords.map((kw, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded text-[10px] font-bold"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={isTa ? "வினாவை நீக்கு" : "Delete Question"}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminQuestionManager;


