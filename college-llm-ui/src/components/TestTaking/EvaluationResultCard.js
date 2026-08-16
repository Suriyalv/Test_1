import React from "react";
import { CheckCircle2, AlertCircle, Sparkles, BookOpen, Tag, Award, ChevronRight } from "lucide-react";
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
  const scoreColor = accuracy >= 75 ? "#1e3a8a" : accuracy >= 50 ? "#d97706" : "#dc2626";
  const scoreBadgeBg = accuracy >= 75 ? "bg-blue-50 text-[#1e3a8a] border-blue-200" : accuracy >= 50 ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-red-50 text-red-800 border-red-200";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white text-slate-900 border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs mt-5"
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div>
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1e3a8a] uppercase tracking-wide">
              <Sparkles size={11} className="text-[#2563eb]" />
              {isTa ? "தானியங்கி விடை மதிப்பீடு" : "AI Evaluation"}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              {isTa ? "விடைத்தாள் மதிப்பாய்வு முடிவுகள்" : "Answer Assessment Sheet"}
            </h3>
          </div>
        </div>

        {/* Score Radial Badge */}
        <div className={`flex items-center gap-3 px-3.5 py-2 rounded-lg border ${scoreBadgeBg} justify-between min-w-[160px]`}>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">
              {isTa ? "துல்லியம்" : "Accuracy"}
            </span>
            <span className="text-xl sm:text-2xl font-black">
              {accuracy}%
            </span>
          </div>

          {/* Simple Radial Gauge */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="w-10 h-10 transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="15"
                stroke="currentColor"
                strokeWidth="3"
                className="opacity-20"
                fill="transparent"
              />
              <circle
                cx="20"
                cy="20"
                r="15"
                stroke={scoreColor}
                strokeWidth="3"
                strokeDasharray={94.2}
                strokeDashoffset={94.2 - (94.2 * accuracy) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <span className="absolute text-[9px] font-bold">
              {accuracy}%
            </span>
          </div>
        </div>
      </div>

      {/* Keywords Breakdown Section */}
      <div className="py-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Matched Keywords */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Tag size={13} className="text-blue-600" />
            <h4 className="text-xs font-bold text-blue-900 uppercase">
              {isTa ? "பொருந்திய முக்கிய சொற்கள்" : "Matched Keywords"} ({matchedKeywords.length})
            </h4>
          </div>
          {matchedKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {matchedKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-blue-600 text-white rounded text-[11px] font-semibold"
                >
                  ✓ {kw}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              {isTa ? "முக்கிய சொற்கள் பொருந்தவில்லை." : "No keywords matched."}
            </p>
          )}
        </div>

        {/* Missed Keywords */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertCircle size={13} className="text-slate-400" />
            <h4 className="text-xs font-bold text-slate-700 uppercase">
              {isTa ? "விடுபட்டவை" : "Missed Keywords"} ({missedKeywords.length})
            </h4>
          </div>
          {missedKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {missedKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-white text-slate-700 rounded text-[11px] font-medium border border-slate-300"
                >
                  ✕ {kw}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-blue-700 font-semibold">
              {isTa ? "அனைத்து முக்கிய சொற்களும் உள்ளன!" : "All keywords covered!"}
            </p>
          )}
        </div>
      </div>

      {/* Points Covered vs Missed Points */}
      <div className="py-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Points Covered */}
        <div>
          <h4 className="text-xs font-bold uppercase text-blue-900 mb-2 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-blue-600" />
            {isTa ? "சரியான கருத்துகள்" : "Key Points Covered"}
          </h4>
          {keyPointsCovered.length > 0 ? (
            <ul className="space-y-1">
              {keyPointsCovered.map((pt, i) => (
                <li
                  key={i}
                  className="text-xs text-slate-800 bg-blue-50/60 p-2 rounded-lg border border-blue-200 flex items-start gap-1.5"
                >
                  <span className="text-blue-600 font-bold">•</span>
                  <span className="leading-relaxed">{pt}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">
              {isTa ? "குறிப்பிடும்படியான கருத்துகள் இல்லை." : "No significant points matched."}
            </p>
          )}
        </div>

        {/* Missed Points */}
        <div>
          <h4 className="text-xs font-bold uppercase text-slate-700 mb-2 flex items-center gap-1.5">
            <AlertCircle size={14} className="text-amber-600" />
            {isTa ? "மேம்படுத்த வேண்டியவை" : "Suggested Improvements"}
          </h4>
          {missedPoints.length > 0 ? (
            <ul className="space-y-1">
              {missedPoints.map((pt, i) => (
                <li
                  key={i}
                  className="text-xs text-slate-800 bg-amber-50/60 p-2 rounded-lg border border-amber-200 flex items-start gap-1.5"
                >
                  <span className="text-amber-700 font-bold">→</span>
                  <span className="leading-relaxed">{pt}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-blue-700 font-semibold">
              {isTa ? "முக்கிய கருத்துகள் அனைத்தும் உள்ளன!" : "No key points missed!"}
            </p>
          )}
        </div>
      </div>

      {/* Overall Feedback */}
      {overallFeedback && (
        <div className="pt-3 pb-1">
          <h4 className="text-xs font-bold uppercase text-slate-600 mb-1 flex items-center gap-1">
            <Award size={13} className="text-blue-600" />
            {isTa ? "மதிப்பீட்டுக் குறிப்பு" : "Evaluation Remarks"}
          </h4>
          <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
            {overallFeedback}
          </p>
        </div>
      )}

      {/* Reference Answer Toggle */}
      {sampleAnswer && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100">
          <details className="group">
            <summary className="cursor-pointer text-xs font-bold text-blue-700 flex items-center gap-1.5 hover:text-blue-800 transition-colors">
              <BookOpen size={13} />
              <span>{isTa ? "பாடப்புத்தக மாதிரி விடை (Reference Answer)" : "View Official Sample Answer"}</span>
            </summary>
            <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {sampleAnswer}
            </div>
          </details>
        </div>
      )}

      {/* Action Next Question */}
      {onNextQuestion && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onNextQuestion}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1 active:scale-95"
          >
            <span>{isTa ? "அடுத்த வினா" : "Next Question"}</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default EvaluationResultCard;


