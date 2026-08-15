import React from "react";
import { CheckCircle2, AlertCircle, Sparkles, BookOpen, Tag } from "lucide-react";
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black text-white border-2 border-blue-600 rounded-2xl p-6 shadow-2xl shadow-blue-950/40 mt-6 relative overflow-hidden"
    >
      {/* Glow highlight top bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-600/40 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles size={14} className="text-blue-400" />
            {isTa ? "LLM மதிப்பீடு பகுப்பாய்வு" : "LLM Evaluation Report"}
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {isTa ? "பதில் பகுப்பாய்வு முடிவு" : "Answer Assessment Results"}
          </h3>
        </div>

        {/* Score Radial Badge */}
        <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4 min-w-[200px] justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-zinc-400 font-medium">
              {isTa ? "துல்லிய மதிப்பெண்" : "Accuracy Score"}
            </span>
            <span className="text-3xl font-extrabold text-blue-400">
              {accuracy}%
            </span>
          </div>

          {/* Simple Radial Gauge */}
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="4"
                className="text-zinc-800"
                fill="transparent"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={138}
                strokeDashoffset={138 - (138 * accuracy) / 100}
                className="text-blue-500 transition-all duration-1000 ease-out"
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-xs font-bold text-white">
              {accuracy}%
            </span>
          </div>
        </div>
      </div>

      {/* Keywords Breakdown Section */}
      <div className="py-6 border-b border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matched Keywords */}
        <div className="bg-zinc-900/60 border border-blue-900/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={16} className="text-blue-400" />
            <h4 className="text-sm font-semibold text-blue-300">
              {isTa ? "பொருந்திய முக்கிய சொற்கள்" : "Matched Keywords"} ({matchedKeywords.length})
            </h4>
          </div>
          {matchedKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {matchedKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-blue-600 text-white rounded-md text-xs font-medium border border-blue-400 shadow-sm"
                >
                  ✓ {kw}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-400 font-mono italic">
              {isTa ? "முக்கிய சொற்கள் எதுவும் பொருந்திவரவில்லை." : "No target keywords matched in your response."}
            </p>
          )}
        </div>

        {/* Missed Keywords */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-zinc-400" />
            <h4 className="text-sm font-semibold text-zinc-300">
              {isTa ? "விடுபட்ட முக்கிய சொற்கள்" : "Missed Keywords"} ({missedKeywords.length})
            </h4>
          </div>
          {missedKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {missedKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-black text-zinc-300 rounded-md text-xs font-medium border border-dashed border-zinc-700"
                >
                  ✕ {kw}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-blue-400 font-mono">
              {isTa ? "அருமை! எல்லா முக்கிய சொற்களும் இடம்பெற்றுள்ளன." : "Great job! All target keywords were covered."}
            </p>
          )}
        </div>
      </div>

      {/* Points Covered vs Missed Points Suggestions */}
      <div className="py-6 border-b border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Points Covered */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-blue-400" />
            {isTa ? "சரியாக பெறப்பட்ட கருத்துகள்" : "Key Concepts Covered"}
          </h4>
          {keyPointsCovered.length > 0 ? (
            <ul className="space-y-2">
              {keyPointsCovered.map((pt, i) => (
                <li
                  key={i}
                  className="text-xs text-zinc-300 bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 flex items-start gap-2"
                >
                  <span className="text-blue-400 font-bold">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-400">
              {isTa ? "குறிப்பிடும்படியான கருத்துகள் எதுவும் இல்லை." : "No significant points matched."}
            </p>
          )}
        </div>

        {/* Missed Points & Improvement Suggestions */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <AlertCircle size={18} className="text-blue-500" />
            {isTa ? "விடுபட்ட கருத்துகள் & பரிந்துரைகள்" : "Missed Points & Suggested Additions"}
          </h4>
          {missedPoints.length > 0 ? (
            <ul className="space-y-2">
              {missedPoints.map((pt, i) => (
                <li
                  key={i}
                  className="text-xs text-blue-200 bg-blue-950/40 p-2.5 rounded-lg border border-blue-800/60 flex items-start gap-2"
                >
                  <span className="text-blue-400 font-bold">→</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-400">
              {isTa ? "முக்கிய கருத்துகள் எதுவும் விடுபடவில்லை!" : "No key points were missed!"}
            </p>
          )}
        </div>
      </div>

      {/* Overall Feedback */}
      {overallFeedback && (
        <div className="pt-6 pb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            {isTa ? "ஆசிரியரின் மதிப்பீட்டுக் குறிப்பு" : "Evaluator Feedback"}
          </h4>
          <p className="text-sm text-zinc-200 leading-relaxed bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
            {overallFeedback}
          </p>
        </div>
      )}

      {/* Reference Answer Toggle / Display */}
      {sampleAnswer && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <details className="group">
            <summary className="cursor-pointer text-xs font-semibold text-blue-400 flex items-center gap-2 hover:text-blue-300 transition-colors">
              <BookOpen size={14} />
              <span>{isTa ? "மாதிரி விடையைப் பார்க்க" : "View Ideal Sample Answer"}</span>
            </summary>
            <div className="mt-3 p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap">
              {sampleAnswer}
            </div>
          </details>
        </div>
      )}

      {/* Action Next Question */}
      {onNextQuestion && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={onNextQuestion}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-blue-950 hover:shadow-blue-600/30 flex items-center gap-2"
          >
            <span>{isTa ? "அடுத்த கேள்விக்குச் செல்ல" : "Proceed to Next Question"}</span>
            <span>→</span>
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default EvaluationResultCard;
