import React from "react";
import { CheckCircle2, AlertCircle, Sparkles, BookOpen, Tag, Award, ChevronRight, Trophy, Flame } from "lucide-react";
import { motion } from "framer-motion";

const EvaluationResultCard = ({ result, sampleAnswer, language = "en", onNextQuestion }) => {
  if (!result) return null;

  const {
    accuracy = 0,
    matchedKeywords = [],
    missedKeywords = [],
    keyPointsCovered = [],
    missedPoints = [],
    overallFeedback = "",
  } = result;

  const isTa = language === "ta";

  // Score styling
  const scoreColor = accuracy >= 75 ? "#58cc02" : accuracy >= 50 ? "#ffc800" : "#ff4b4b";
  const isGreat = accuracy >= 75;
  const isGood = accuracy >= 50 && accuracy < 75;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="bg-white text-slate-900 border-2 border-[#e5e5e5] rounded-3xl p-6 sm:p-7 shadow-[0_8px_0_0_#e5e5e5] mt-6 space-y-6"
    >
      {/* Celebratory Assessment Banner */}
      <div className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row items-center justify-between gap-3 ${
        isGreat
          ? "bg-emerald-50 border-emerald-300 text-emerald-900"
          : isGood
          ? "bg-amber-50 border-amber-300 text-amber-900"
          : "bg-rose-50 border-rose-300 text-rose-900"
      }`}>
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-2xl bg-white border-2 border-current flex items-center justify-center shrink-0 shadow-sm">
            {isGreat ? (
              <Trophy size={20} className="text-[#58cc02]" />
            ) : isGood ? (
              <Sparkles size={20} className="text-amber-500" />
            ) : (
              <AlertCircle size={20} className="text-rose-500" />
            )}
          </div>
          <div>
            <h4 className="font-black text-sm sm:text-base">
              {isGreat
                ? (isTa ? "அற்புதம்! சிறப்பான விடை!" : "Outstanding Trial Performance!")
                : isGood
                ? (isTa ? "நன்று! நல்ல முயற்சி!" : "Good Effort! Concepts Covered")
                : (isTa ? "முயற்சி செய்க! கருத்துகளைக் கற்றுக்கொள்ளுங்கள்" : "Keep Going! Review & Practice")}
            </h4>
            <p className="text-xs font-bold opacity-80">
              {isTa ? "தானியங்கி விடை மதிப்பாய்வு அறிக்கை" : "Automated AI Evaluation Breakdown"}
            </p>
          </div>
        </div>

        {/* XP Reward Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border-2 border-current font-black text-xs shadow-xs shrink-0">
          <Flame size={15} className="fill-amber-500 text-amber-500" />
          <span>{isGreat ? "+50 XP" : isGood ? "+25 XP" : "+10 XP"}</span>
        </div>
      </div>

      {/* Header Section & Radial Gauge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#f0f2f5]">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#1cb0f6]">
            <Sparkles size={13} className="text-[#1cb0f6]" />
            <span>{isTa ? "மதிப்பீட்டு விபரம்" : "Trial Diagnostics"}</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            {isTa ? "விடைத்தாள் மதிப்பாய்வு முடிவுகள்" : "Detailed Assessment Sheet"}
          </h3>
        </div>

        {/* Radial Accuracy Gauge */}
        <div className="flex items-center gap-3.5 px-4 py-2.5 rounded-2xl bg-[#f9fafb] border-2 border-[#e5e5e5] justify-between shadow-inner">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {isTa ? "துல்லியம்" : "Accuracy"}
            </span>
            <span className="text-2xl font-black text-slate-900">
              {accuracy}%
            </span>
          </div>

          <div className="relative w-11 h-11 flex items-center justify-center">
            <svg className="w-11 h-11 transform -rotate-90">
              <circle
                cx="22"
                cy="22"
                r="16"
                stroke="#e5e5e5"
                strokeWidth="3.5"
                fill="transparent"
              />
              <circle
                cx="22"
                cy="22"
                r="16"
                stroke={scoreColor}
                strokeWidth="3.5"
                strokeDasharray={100.5}
                strokeDashoffset={100.5 - (100.5 * accuracy) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <span className="absolute text-[10px] font-black text-slate-800">
              {accuracy}%
            </span>
          </div>
        </div>
      </div>

      {/* Keywords Breakdown Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Matched Keywords */}
        <div className="bg-[#f9fafb] border-2 border-[#e5e5e5] rounded-2xl p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center gap-1.5">
            <Tag size={14} className="text-[#58cc02]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
              {isTa ? "பொருந்திய முக்கிய சொற்கள்" : "Matched Keywords"} ({matchedKeywords.length})
            </h4>
          </div>
          {matchedKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {matchedKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-black flex items-center gap-1 shadow-xs"
                >
                  ✓ {kw}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic font-medium">
              {isTa ? "முக்கிய சொற்கள் பொருந்தவில்லை." : "No keywords matched yet."}
            </p>
          )}
        </div>

        {/* Missed Keywords */}
        <div className="bg-[#f9fafb] border-2 border-[#e5e5e5] rounded-2xl p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={14} className="text-amber-500" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
              {isTa ? "விடுபட்டவை" : "Missed Keywords"} ({missedKeywords.length})
            </h4>
          </div>
          {missedKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {missedKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold"
                >
                  ✕ {kw}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#58cc02] font-black">
              {isTa ? "அனைத்து முக்கிய சொற்களும் உள்ளன!" : "✓ All key terms covered!"}
            </p>
          )}
        </div>
      </div>

      {/* Points Covered vs Missed Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Points Covered */}
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-[#58cc02]" />
            <span>{isTa ? "சரியான கருத்துகள்" : "Key Points Mastered"}</span>
          </h4>
          {keyPointsCovered.length > 0 ? (
            <ul className="space-y-2">
              {keyPointsCovered.map((pt, i) => (
                <li
                  key={i}
                  className="text-xs text-slate-800 bg-[#f9fafb] p-3 rounded-xl border-2 border-[#e5e5e5] flex items-start gap-2 font-medium"
                >
                  <span className="text-[#58cc02] font-black">•</span>
                  <span className="leading-relaxed">{pt}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">
              {isTa ? "குறிப்பிடும்படியான கருத்துகள் இல்லை." : "No specific points matched."}
            </p>
          )}
        </div>

        {/* Missed Points */}
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <AlertCircle size={15} className="text-amber-500" />
            <span>{isTa ? "மேம்படுத்த வேண்டியவை" : "Areas to Improve"}</span>
          </h4>
          {missedPoints.length > 0 ? (
            <ul className="space-y-2">
              {missedPoints.map((pt, i) => (
                <li
                  key={i}
                  className="text-xs text-slate-800 bg-[#f9fafb] p-3 rounded-xl border-2 border-[#e5e5e5] flex items-start gap-2 font-medium"
                >
                  <span className="text-amber-500 font-black">→</span>
                  <span className="leading-relaxed">{pt}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#58cc02] font-black">
              {isTa ? "முக்கிய கருத்துகள் அனைத்தும் உள்ளன!" : "✓ No core points missed!"}
            </p>
          )}
        </div>
      </div>

      {/* Overall Feedback */}
      {overallFeedback && (
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Award size={14} className="text-[#1cb0f6]" />
            <span>{isTa ? "மதிப்பீட்டுக் குறிப்பு" : "Socratic Feedback Remarks"}</span>
          </h4>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-[#f9fafb] p-4 rounded-2xl border-2 border-[#e5e5e5] font-semibold shadow-inner">
            {overallFeedback}
          </p>
        </div>
      )}

      {/* Reference Sample Answer Expander */}
      {sampleAnswer && (
        <div className="pt-2">
          <details className="group">
            <summary className="cursor-pointer text-xs font-black text-[#1cb0f6] flex items-center gap-1.5 hover:text-[#007AFF] transition-colors select-none">
              <BookOpen size={14} />
              <span>{isTa ? "பாடப்புத்தக மாதிரி விடை (Reference Answer)" : "View Official Syllabus Benchmark"}</span>
            </summary>
            <div className="mt-2.5 p-4 bg-[#f9fafb] rounded-2xl border-2 border-[#e5e5e5] text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap shadow-inner">
              {sampleAnswer}
            </div>
          </details>
        </div>
      )}

      {/* Action Next Question */}
      {onNextQuestion && (
        <div className="pt-3 flex justify-end border-t-2 border-[#f0f2f5]">
          <button
            onClick={onNextQuestion}
            className="btn-3d btn-3d-green px-6 py-2.5 rounded-xl font-black text-xs text-white shadow-md flex items-center gap-2"
          >
            <span>{isTa ? "அடுத்த சவால்" : "Next Challenge"}</span>
            <ChevronRight size={16} strokeWidth={3} />
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default EvaluationResultCard;
