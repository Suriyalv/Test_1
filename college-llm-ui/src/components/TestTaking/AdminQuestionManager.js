import React, { useState, useEffect } from "react";
import { fetchTestQuestions, addTestQuestion, deleteTestQuestion } from "../../api";
import { PlusCircle, Trash2, Tag, Layers, Check, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AdminQuestionManager = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All");

  // Form State
  const [category, setCategory] = useState("2 Marks");
  const [language, setLanguage] = useState("en");
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
      alert("Please enter the question text.");
      return;
    }

    if (category === "MCQ") {
      const validOptions = options.map((o) => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        alert("Please provide at least 2 options for an MCQ.");
        return;
      }
      if (!correctOption.trim()) {
        alert("Please select or enter the correct option.");
        return;
      }
    } else {
      if (keywords.length === 0) {
        alert("Please add at least 1 keyword for automated accuracy evaluation.");
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        category,
        language,
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
      alert("Failed to save question. Please check backend connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (qId) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
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
    <div className="space-y-8">
      {/* Top Header Banner */}
      <div className="bg-black text-white p-6 rounded-2xl border-2 border-blue-600 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Layers size={16} /> Admin Portal
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            Question & Answer Repository
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Post questions with keywords, target sample answers, and category specifications.
          </p>
        </div>
        <button
          onClick={loadAllQuestions}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-blue-400 border border-blue-600/40 rounded-xl text-xs font-semibold transition-all"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Creation Form Section */}
      <div className="bg-white border border-black rounded-2xl p-6 md:p-8 shadow-lg">
        <div className="flex items-center gap-2 pb-4 border-b border-gray-200 mb-6">
          <PlusCircle size={20} className="text-blue-600" />
          <h3 className="text-lg font-bold text-black">Create New Test Question</h3>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Row 1: Category & Language */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
                Question Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["MCQ", "2 Marks", "5 Marks"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                      category === cat
                        ? "bg-black text-white border-black shadow-md"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-black"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
                Target Language
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "en", label: "English" },
                  { id: "ta", label: "Tamil (தமிழ்)" },
                  { id: "both", label: "Bilingual" },
                ].map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setLanguage(lang.id)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                      language === lang.id
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-600"
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
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
              Question Prompt / வினா
            </label>
            <textarea
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter the question text in English or Tamil..."
              className="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
            />
          </div>

          {/* MCQ Options Field */}
          {category === "MCQ" && (
            <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-5 space-y-4">
              <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider">
                Multiple Choice Options
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="flex-1 p-2.5 bg-white border border-blue-200 rounded-lg text-xs font-medium focus:border-blue-600 outline-none"
                    />
                    <input
                      type="radio"
                      name="correctOptionRadio"
                      checked={correctOption === opt && opt.length > 0}
                      onChange={() => setCorrectOption(opt)}
                      title="Set as correct answer"
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
              {correctOption && (
                <div className="text-xs text-blue-700 font-medium">
                  ✓ Correct Answer set to: <strong>{correctOption}</strong>
                </div>
              )}
            </div>
          )}

          {/* Sample Reference Answer */}
          {category !== "MCQ" && (
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
                Ideal Reference Answer / மாதிரி விடை
              </label>
              <textarea
                rows={4}
                value={sampleAnswer}
                onChange={(e) => setSampleAnswer(e.target.value)}
                placeholder="Enter complete ideal model answer..."
                className="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono focus:bg-white focus:border-black outline-none transition-all"
              />
            </div>
          )}

          {/* Keyword Generator Section */}
          {category !== "MCQ" && (
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2 flex items-center gap-2">
                <Tag size={14} className="text-blue-600" />
                Required Keywords for Accuracy Check / முக்கிய சொற்கள்
              </label>

              <div className="flex items-center gap-2 mb-3">
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
                  placeholder="Type keyword and press Enter or Click Add..."
                  className="flex-1 p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                >
                  + Add Keyword
                </button>
              </div>

              {/* Keyword Badges */}
              <div className="flex flex-wrap gap-2 min-h-[36px] p-3 bg-gray-50 border border-gray-200 rounded-xl">
                {keywords.length > 0 ? (
                  keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-black text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm"
                    >
                      {kw}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw)}
                        className="text-gray-400 hover:text-white font-bold text-sm leading-none ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic">
                    No keywords added yet. Keywords are used by LLM to measure student answer accuracy.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-black hover:bg-zinc-900 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 border border-blue-600/50"
            >
              {submitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Saving Question...</span>
                </>
              ) : (
                <>
                  <Check size={16} className="text-blue-400" />
                  <span>Save Question to Repository</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Questions List */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-6">
          <div>
            <h3 className="text-lg font-bold text-black">
              Existing Questions ({filteredQuestions.length})
            </h3>
            <p className="text-xs text-gray-500">Filter by question category below</p>
          </div>

          <div className="flex gap-2">
            {["All", "MCQ", "2 Marks", "5 Marks"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  filterCategory === cat
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-blue-600" />
            <span>Loading question repository...</span>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm font-medium">
            No questions found in this category.
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredQuestions.map((q) => (
                <motion.div
                  key={q.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-gray-50 border border-gray-200 hover:border-black rounded-xl p-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-black text-white text-[10px] font-bold rounded-md uppercase">
                          {q.category}
                        </span>
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md uppercase">
                          {q.language === "ta" ? "தமிழ்" : q.language === "en" ? "English" : "Bilingual"}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          {q.marks} {q.marks === 1 ? "Mark" : "Marks"}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-black leading-snug">
                        {q.question}
                      </h4>

                      {q.category === "MCQ" && q.options?.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          {q.options.map((opt, i) => (
                            <div
                              key={i}
                              className={`p-2 rounded-lg text-xs border ${
                                opt === q.correctOption
                                  ? "bg-blue-50 border-blue-500 font-bold text-blue-900"
                                  : "bg-white border-gray-200 text-gray-700"
                              }`}
                            >
                              {String.fromCharCode(65 + i)}. {opt}
                              {opt === q.correctOption && " ✓"}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.sampleAnswer && (
                        <div className="text-xs text-gray-600 bg-white p-3 rounded-lg border border-gray-200 font-mono">
                          <strong className="text-black font-sans">Sample Answer: </strong>
                          {q.sampleAnswer}
                        </div>
                      )}

                      {q.keywords?.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-xs font-bold text-gray-500 mr-1">Keywords:</span>
                          {q.keywords.map((kw, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-blue-900 text-white rounded text-[10px] font-medium"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-2 text-gray-400 hover:text-black hover:bg-gray-200 rounded-lg transition-colors"
                      title="Delete Question"
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
