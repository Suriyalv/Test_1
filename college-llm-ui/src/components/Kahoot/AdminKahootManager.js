import React, { useState, useEffect, useCallback } from "react";
import {
  fetchKahootQuizzes,
  addKahootQuiz,
  deleteKahootQuiz,
  fetchKahootQuiz,
  addKahootQuestion,
  deleteKahootQuestion,
  updateKahootQuestion,
  reorderKahootQuestions,
} from "../../api";
import { KAHOOT_TILES } from "./kahootTheme";
import {
  PlusCircle,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Image as ImageIcon,
  Check,
  Trophy,
  Timer,
  ChevronLeft,
  ListChecks,
  GripVertical,
  Edit3,
  Save,
  X,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100";
const labelClass = "mb-1.5 block text-xs font-bold text-slate-700";

/* ── Quiz creation form ──────────────────────────────────────────────────────── */
const QuizCreateForm = ({ onCreated, isTa }) => {
  const [title, setTitle] = useState("");
  const [titleTa, setTitleTa] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await addKahootQuiz({ title: title.trim(), titleTa: titleTa.trim(), description: description.trim() });
      setTitle("");
      setTitleTa("");
      setDescription("");
      onCreated();
    } catch (err) {
      console.error("Failed to create quiz:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={isTa ? "வினாடி வினா தலைப்பு (ஆங்கிலம்)" : "Quiz title (English)"}
        className={inputClass}
      />
      <input
        type="text"
        value={titleTa}
        onChange={(e) => setTitleTa(e.target.value)}
        placeholder={isTa ? "தலைப்பு (தமிழ்) - விருப்பம்" : "Title (Tamil) - optional"}
        className={inputClass}
      />
      <div className="flex gap-2">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={isTa ? "குறுவிவரம்" : "Short description"}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0284c7] px-4 py-2 text-xs font-bold text-white transition-all hover:bg-[#026aa2] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? <RefreshCw size={14} className="animate-spin" /> : <PlusCircle size={14} />}
          {isTa ? "உருவாக்கு" : "Create"}
        </button>
      </div>
    </form>
  );
};

/* ── Question builder for the currently open quiz ────────────────────────────── */
const QuestionForm = ({ quizId, onAdded, isTa }) => {
  const [question, setQuestion] = useState("");
  const [questionTa, setQuestionTa] = useState("");
  const [image, setImage] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [timeLimit, setTimeLimit] = useState(20);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [imgBroken, setImgBroken] = useState(false);

  const handleOptionChange = (i, value) => {
    const updated = [...options];
    updated[i] = value;
    setOptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!question.trim()) {
      setError(isTa ? "வினாவை உள்ளிடவும்." : "Please enter the question.");
      return;
    }
    if (options.some((o) => !o.trim())) {
      setError(isTa ? "அனைத்து 4 தெரிவுகளையும் நிரப்பவும்." : "Please fill in all 4 answer options.");
      return;
    }

    setSubmitting(true);
    try {
      await addKahootQuestion(quizId, {
        question: question.trim(),
        questionTa: questionTa.trim(),
        image: image.trim(),
        options: options.map((o) => o.trim()),
        correctIndex,
        timeLimit: Number(timeLimit) || 20,
      });
      setQuestion("");
      setQuestionTa("");
      setImage("");
      setOptions(["", "", "", ""]);
      setCorrectIndex(0);
      setTimeLimit(20);
      onAdded();
    } catch (err) {
      console.error("Failed to add question:", err);
      setError(err.message || (isTa ? "வினாவைச் சேர்க்க முடியவில்லை." : "Could not add the question."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{isTa ? "வினா (ஆங்கிலம்)" : "Question (English)"}</label>
          <textarea
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={isTa ? "வினாவை உள்ளிடவும்..." : "Enter the quiz question..."}
            className={`${inputClass} resize-y`}
          />
        </div>
        <div>
          <label className={labelClass}>{isTa ? "வினா (தமிழ்) - விருப்பம்" : "Question (Tamil) - optional"}</label>
          <textarea
            rows={2}
            value={questionTa}
            onChange={(e) => setQuestionTa(e.target.value)}
            placeholder={isTa ? "தமிழில் வினா..." : "Optional Tamil translation..."}
            className={`${inputClass} resize-y`}
          />
        </div>
      </div>

      {/* Image paste field + preview */}
      <div>
        <label className={labelClass}>
          <span className="inline-flex items-center gap-1.5">
            <ImageIcon size={13} /> {isTa ? "வினாவிற்கான படத்தின் URL ஐ ஒட்டவும்" : "Paste an image URL for this question"}
          </span>
        </label>
        <input
          type="url"
          value={image}
          onChange={(e) => {
            setImage(e.target.value);
            setImgBroken(false);
          }}
          placeholder="https://example.com/question-image.jpg"
          className={inputClass}
        />
        {image.trim() && !imgBroken && (
          <img
            src={image.trim()}
            alt=""
            onError={() => setImgBroken(true)}
            className="mt-2 h-32 w-full rounded-lg border border-slate-200 object-cover"
          />
        )}
      </div>

      {/* Options with colour tiles matching the play view */}
      <div>
        <label className={labelClass}>
          {isTa ? "4 தெரிவுகள் & சரியான விடையைத் தேர்ந்தெடுக்கவும்" : "4 Answer Options & Correct Answer"}
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {options.map((opt, i) => {
            const tile = KAHOOT_TILES[i];
            const Icon = tile.icon;
            return (
              <div
                key={i}
                className={`flex items-center gap-2 rounded-lg border p-2 transition-all ${
                  correctIndex === i ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white"
                }`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white ${tile.bg}`}>
                  <Icon size={14} className="fill-white/90" />
                </span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  placeholder={`${isTa ? "தெரிவு" : "Option"} ${i + 1}`}
                  className="flex-1 bg-transparent p-1 text-xs font-medium outline-none"
                />
                <button
                  type="button"
                  onClick={() => setCorrectIndex(i)}
                  title={isTa ? "சரியான விடையாக குறிக்கவும்" : "Mark as correct answer"}
                  className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold transition-all ${
                    correctIndex === i
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {correctIndex === i ? <Check size={12} /> : isTa ? "சரி" : "Correct"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time limit */}
      <div className="max-w-[220px]">
        <label className={labelClass}>
          <span className="inline-flex items-center gap-1.5">
            <Timer size={13} /> {isTa ? "நேர வரம்பு (வினாடிகள்)" : "Time Limit (seconds)"}
          </span>
        </label>
        <input
          type="number"
          min={5}
          max={120}
          value={timeLimit}
          onChange={(e) => setTimeLimit(e.target.value)}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex items-center justify-center gap-2 rounded-xl bg-[#0284c7] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition-all hover:bg-[#026aa2] active:scale-95 disabled:opacity-50"
      >
        {submitting ? <RefreshCw size={14} className="animate-spin" /> : <PlusCircle size={14} />}
        {isTa ? "வினாவைச் சேர்" : "Add Question to Quiz"}
      </button>
    </form>
  );
};

/* ── Edit Question Modal ─────────────────────────────────────────────────── */
const EditQuestionModal = ({ quizId, question, onClose, onSaved, isTa }) => {
  const [questionText, setQuestionText] = useState(question.question || "");
  const [image, setImage] = useState(question.image || "");
  const [imgBroken, setImgBroken] = useState(false);
  const [options, setOptions] = useState([...(question.options || ["", "", "", ""])]);
  const [correctIndex, setCorrectIndex] = useState(question.correctIndex ?? 0);
  const [timeLimit, setTimeLimit] = useState(question.timeLimit || 20);
  const [explanation, setExplanation] = useState(question.explanation || "");
  const [saving, setSaving] = useState(false);

  const handleOptionChange = (idx, val) => {
    setOptions((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) {
      alert(isTa ? "வினா உரையை உள்ளிடவும்" : "Please enter the question text");
      return;
    }
    if (options.some((o) => !o.trim())) {
      alert(isTa ? "அனைத்து 4 தெரிவுகளையும் நிரப்பவும்" : "Please fill in all 4 answer options");
      return;
    }

    setSaving(true);
    try {
      await updateKahootQuestion(quizId, question.id, {
        question: questionText.trim(),
        image: image.trim(),
        options: options.map((o) => o.trim()),
        correctIndex,
        timeLimit: parseInt(timeLimit, 10) || 20,
        explanation: explanation.trim(),
      });
      onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to update question:", err);
      alert(err.message || "Failed to update question");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Edit3 size={18} className="text-[#0284c7]" />
            <h3 className="text-base font-extrabold text-slate-900">
              {isTa ? "வினாவைத் திருத்து" : "Edit Question"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className={labelClass}>
              {isTa ? "வினா உரை" : "Question Text"} *
            </label>
            <textarea
              rows={2}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>
              <span className="inline-flex items-center gap-1.5">
                <ImageIcon size={13} /> {isTa ? "பட URL (விருப்பத்தேர்வு)" : "Image URL (optional)"}
              </span>
            </label>
            <input
              type="url"
              value={image}
              onChange={(e) => {
                setImage(e.target.value);
                setImgBroken(false);
              }}
              placeholder="https://..."
              className={inputClass}
            />
            {image.trim() && !imgBroken && (
              <img
                src={image.trim()}
                alt=""
                onError={() => setImgBroken(true)}
                className="mt-2 h-28 w-full rounded-lg border border-slate-200 object-cover"
              />
            )}
          </div>

          <div>
            <label className={labelClass}>
              {isTa ? "4 தெரிவுகள் & சரியான விடை" : "4 Answer Options & Correct Answer"} *
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {options.map((opt, i) => {
                const tile = KAHOOT_TILES[i % KAHOOT_TILES.length];
                const Icon = tile.icon;
                const isCorrect = correctIndex === i;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2 rounded-lg border p-2 transition-all ${
                      isCorrect ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white"
                    }`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white ${tile.bg}`}>
                      <Icon size={14} className="fill-white/90" />
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 bg-transparent p-1 text-xs font-medium outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setCorrectIndex(i)}
                      className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold transition-all ${
                        isCorrect ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {isCorrect ? <Check size={12} /> : isTa ? "சரி" : "Correct"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>
                <span className="inline-flex items-center gap-1.5">
                  <Timer size={13} /> {isTa ? "நேர வரம்பு (வினாடிகள்)" : "Time Limit (seconds)"}
                </span>
              </label>
              <input
                type="number"
                min={5}
                max={120}
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                {isTa ? "விளக்கம் (விருப்பத்தேர்வு)" : "Explanation (optional)"}
              </label>
              <input
                type="text"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder={isTa ? "விளக்கம்..." : "Why is this the correct answer?"}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
            >
              {isTa ? "ரத்து" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-[#0284c7] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#026aa2] disabled:opacity-50"
            >
              {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
              {isTa ? "சேமி" : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

/* ── Editing one quiz: its question list + the add-question form ────────────── */
const QuizEditor = ({ quizSummary, onBack, isTa }) => {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const loadQuiz = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchKahootQuiz(quizSummary.id, "en");
      setQuiz(data.quiz);
    } catch (err) {
      console.error("Failed to load quiz:", err);
    } finally {
      setLoading(false);
    }
  }, [quizSummary.id]);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  const handleDeleteQuestion = async (qid) => {
    if (!window.confirm(isTa ? "இந்த வினாவை நீக்கவா?" : "Delete this question?")) return;
    try {
      await deleteKahootQuestion(quizSummary.id, qid);
      loadQuiz();
    } catch (err) {
      console.error("Failed to delete question:", err);
    }
  };

  const handleDragStart = (e, idx) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${idx}`);
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIdx !== idx) {
      setDragOverIdx(idx);
    }
  };

  const handleDrop = async (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    const updated = [...quiz.questions];
    const [moved] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, moved);

    setQuiz((prev) => ({ ...prev, questions: updated }));
    setDraggedIdx(null);
    setDragOverIdx(null);

    try {
      await reorderKahootQuestions(quizSummary.id, updated.map((q) => q.id));
    } catch (err) {
      console.error("Failed to reorder questions:", err);
      loadQuiz();
    }
  };

  const handleMove = async (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= quiz.questions.length) return;

    const updated = [...quiz.questions];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;

    setQuiz((prev) => ({ ...prev, questions: updated }));

    try {
      await reorderKahootQuestions(quizSummary.id, updated.map((q) => q.id));
    } catch (err) {
      console.error("Failed to move question:", err);
      loadQuiz();
    }
  };

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#0284c7]"
      >
        <ChevronLeft size={14} /> {isTa ? "அனைத்து வினாடி வினாக்கள்" : "All Quizzes"}
      </button>

      {/* Edit Question Modal */}
      <AnimatePresence>
        {editingQuestion && (
          <EditQuestionModal
            quizId={quizSummary.id}
            question={editingQuestion}
            onClose={() => setEditingQuestion(null)}
            onSaved={loadQuiz}
            isTa={isTa}
          />
        )}
      </AnimatePresence>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <PlusCircle size={16} className="text-[#0284c7]" />
          <h3 className="text-sm font-bold text-slate-900 sm:text-base">
            {isTa ? `"${quizSummary.title}" — வினா சேர்` : `Add a Question to "${quizSummary.title}"`}
          </h3>
        </div>
        <QuestionForm quizId={quizSummary.id} onAdded={loadQuiz} isTa={isTa} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ListChecks size={16} className="text-[#0284c7]" />
            <h3 className="text-sm font-bold text-slate-900 sm:text-base">
              {isTa ? "வினாக்கள்" : "Questions"} ({quiz?.questions?.length || 0})
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            {isTa ? "வரிசையை மாற்ற இழுக்கவும்" : "Drag handle to reorder questions"}
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <RefreshCw size={16} className="mx-auto mb-2 animate-spin text-[#0284c7]" />
            {isTa ? "ஏற்றுகிறது..." : "Loading..."}
          </div>
        ) : !quiz?.questions?.length ? (
          <p className="py-6 text-center text-xs text-slate-400">
            {isTa ? "இன்னும் வினாக்கள் சேர்க்கப்படவில்லை." : "No questions added yet."}
          </p>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {quiz.questions.map((q, idx) => (
                <motion.li
                  key={q.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragLeave={() => setDragOverIdx(null)}
                  onDrop={(e) => handleDrop(e, idx)}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 transition-all ${
                    dragOverIdx === idx
                      ? "border-[#0284c7] ring-2 ring-[#0284c7]/40 bg-sky-50 shadow-md scale-[1.01]"
                      : draggedIdx === idx
                      ? "opacity-40 border-dashed border-slate-300 bg-slate-100"
                      : "border-slate-200 bg-slate-50/80 hover:bg-slate-50 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  {/* Drag Grip Handle */}
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragEnd={() => {
                      setDraggedIdx(null);
                      setDragOverIdx(null);
                    }}
                    className="self-center cursor-grab active:cursor-grabbing p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                    title={isTa ? "இழுத்து எந்த இடத்திற்கும் நகர்த்தவும்" : "Drag to any position"}
                  >
                    <GripVertical size={18} />
                  </div>

                  {q.image ? (
                    <img src={q.image} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-400">
                      <ImageIcon size={18} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-700">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {q.timeLimit}s
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-bold text-slate-900">{q.question}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {q.options.map((opt, i) => (
                        <span
                          key={i}
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            i === q.correctIndex
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                              : "bg-white text-slate-500 border border-slate-200"
                          }`}
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions: Reorder arrows, Edit, Delete */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, -1)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-20"
                      title={isTa ? "மேலே நகர்த்து" : "Move up"}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === quiz.questions.length - 1}
                      onClick={() => handleMove(idx, 1)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-20"
                      title={isTa ? "கீழே நகர்த்து" : "Move down"}
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingQuestion(q)}
                      className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-sky-50 hover:text-[#0284c7]"
                      title={isTa ? "திருத்து" : "Edit question"}
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title={isTa ? "நீக்கு" : "Delete"}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
};

/* ── Top-level: quiz list + create form, or drill into a quiz ───────────────── */
const AdminKahootManager = ({ language = "en" }) => {
  const isTa = language === "ta";
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingQuiz, setEditingQuiz] = useState(null);

  const loadQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchKahootQuizzes("en");
      setQuizzes(data.quizzes || []);
    } catch (err) {
      console.error("Failed to load quizzes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const handleDeleteQuiz = async (quiz) => {
    if (!window.confirm(isTa ? `"${quiz.title}" வினாடி வினாவை நீக்கவா?` : `Delete the quiz "${quiz.title}"?`)) return;
    try {
      await deleteKahootQuiz(quiz.id);
      setQuizzes((prev) => prev.filter((q) => q.id !== quiz.id));
    } catch (err) {
      console.error("Failed to delete quiz:", err);
    }
  };

  if (editingQuiz) {
    return <QuizEditor quizSummary={editingQuiz} onBack={() => { setEditingQuiz(null); loadQuizzes(); }} isTa={isTa} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#0284c7]">
            <ShieldCheck size={14} /> {isTa ? "ஆசிரியர் வினாடி வினா மேலாண்மை" : "Faculty Live Quiz Management"}
          </div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
            {isTa ? "வினாடி வினா உருவாக்கி" : "Live Quiz Builder"}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {isTa
              ? "படங்களுடன் கூடிய வேகமான, Kahoot பாணி வினாடி வினாக்களை உருவாக்கவும்."
              : "Build fast-paced, Kahoot-style quizzes with an image on every question."}
          </p>
        </div>
        <button
          onClick={loadQuizzes}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 hover:text-[#0284c7] active:scale-95"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-[#0284c7]" : ""} />
          {isTa ? "புதுப்பிக்க" : "Refresh"}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <PlusCircle size={16} className="text-[#0284c7]" />
          <h3 className="text-sm font-bold text-slate-900 sm:text-base">
            {isTa ? "புதிய வினாடி வினாவை உருவாக்கு" : "Create a New Quiz"}
          </h3>
        </div>
        <QuizCreateForm onCreated={loadQuizzes} isTa={isTa} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Trophy size={16} className="text-[#0284c7]" />
          <h3 className="text-sm font-bold text-slate-900 sm:text-base">
            {isTa ? "உள்ள வினாடி வினாக்கள்" : "Existing Quizzes"} ({quizzes.length})
          </h3>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {isTa ? "இன்னும் வினாடி வினாக்கள் இல்லை." : "No quizzes yet. Create one above."}
          </p>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {quizzes.map((quiz) => (
                <motion.li
                  key={quiz.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-brand-200 hover:bg-white"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0284c7] to-[#0ba5ec] text-white">
                    <Trophy size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{quiz.title}</p>
                    <p className="text-xs text-slate-500">
                      {quiz.questionCount} {isTa ? "வினாக்கள்" : "questions"}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingQuiz(quiz)}
                    className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#0284c7] transition-all hover:bg-brand-50 active:scale-95"
                  >
                    {isTa ? "வினாக்களை நிர்வகி" : "Manage Questions"}
                  </button>
                  <button
                    onClick={() => handleDeleteQuiz(quiz)}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    title={isTa ? "நீக்கு" : "Delete"}
                  >
                    <Trash2 size={15} />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminKahootManager;
