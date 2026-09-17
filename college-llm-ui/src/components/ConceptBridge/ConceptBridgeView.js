import React, { useState, useEffect, useCallback } from "react";
import { fetchConceptBridges, evaluateAnalogy } from "../../api";
import { getAccent } from "../Flashcards/flashcardTheme";
import { logActivity } from "../../activity";
import {
  Lightbulb,
  RefreshCw,
  ArrowRight,
  PenLine,
  Send,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Feedback card: this is the "premium/enterprise" surface — neutral, data
   clear, two labeled lists — deliberately not the vibrant module palette,
   since it's reporting on the student's own reasoning, not decorating a topic. */
const FeedbackCard = ({ result, isTa }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
  >
    <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
      <Sparkles size={16} className="text-indigo-600" />
      <h4 className="text-sm font-extrabold text-slate-900">
        {isTa ? "AI கருத்து" : "AI Feedback"}
      </h4>
    </div>

    <p className="mb-4 text-sm leading-relaxed text-slate-700">{result.feedback}</p>

    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-emerald-700">
          <CheckCircle2 size={13} />
          {isTa ? "பிடிக்கப்பட்டவை" : "You got"}
        </p>
        {result.propertiesCaptured.length === 0 ? (
          <p className="text-xs text-emerald-700/70">{isTa ? "எதுவும் இல்லை" : "None yet"}</p>
        ) : (
          <ul className="space-y-1">
            {result.propertiesCaptured.map((p, i) => (
              <li key={i} className="text-xs leading-relaxed text-emerald-900">• {p}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-amber-700">
          <XCircle size={13} />
          {isTa ? "தவறவிட்டவை" : "Missed"}
        </p>
        {result.propertiesMissed.length === 0 ? (
          <p className="text-xs text-amber-700/70">{isTa ? "எதுவும் இல்லை — சிறப்பு!" : "None — nice work!"}</p>
        ) : (
          <ul className="space-y-1">
            {result.propertiesMissed.map((p, i) => (
              <li key={i} className="text-xs leading-relaxed text-amber-900">• {p}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </motion.div>
);

/* ── One concept: pick → reveal curated analogy → write your own → feedback ── */
const ConceptCard = ({ bridge, isTa, language }) => {
  const accent = getAccent(bridge.accent);
  const [stage, setStage] = useState("closed"); // closed | analogy | writing | result
  const [studentAnalogy, setStudentAnalogy] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!studentAnalogy.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const data = await evaluateAnalogy({
        conceptId: bridge.id,
        studentAnalogy: studentAnalogy.trim(),
        language,
      });
      setResult(data);
      setStage("result");
      logActivity("concept-bridge", "analogy_submitted", {
        conceptId: bridge.id,
        propertiesCapturedCount: data.propertiesCaptured.length,
        propertiesMissedCount: data.propertiesMissed.length,
      });
    } catch (err) {
      console.error("Failed to evaluate analogy:", err);
      setError(isTa ? "மதிப்பீடு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்." : "We could not check your example. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-black/5 bg-white shadow-lg">
      <button
        type="button"
        onClick={() => setStage(stage === "closed" ? "analogy" : "closed")}
        className={`flex w-full items-center justify-between gap-3 rounded-t-2xl bg-gradient-to-br p-5 text-left ${accent.face} ${stage === "closed" ? "rounded-b-2xl" : ""}`}
      >
        <div>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm ${accent.badge}`}>
            {bridge.subject}
          </span>
          <h3 className={`mt-2 text-lg font-extrabold leading-snug tracking-tight ${accent.title}`}>
            {bridge.title}
          </h3>
        </div>
        <ArrowRight size={20} className={`shrink-0 transition-transform ${stage !== "closed" ? "rotate-90" : ""} ${accent.title}`} />
      </button>

      <AnimatePresence>
        {stage !== "closed" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 p-5">
              <div className={`rounded-xl border px-4 py-3 ${accent.chip}`}>
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide">
                  <Lightbulb size={12} />
                  {isTa ? "ஒரு ஒப்புமை" : "One example"}
                </p>
                <p className="text-sm leading-relaxed">{bridge.givenAnalogy}</p>
              </div>

              {stage === "analogy" && (
                <button
                  type="button"
                  onClick={() => setStage("writing")}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
                >
                  <PenLine size={14} />
                  {isTa ? "இப்போது நீங்களே முயற்சிக்கவும்" : "Now make your own example"}
                </button>
              )}

              {(stage === "writing" || stage === "result") && (
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {isTa ? "உங்கள் சொந்த ஒப்புமை" : "Your own example"}
                  </label>
                  <textarea
                    rows={3}
                    value={studentAnalogy}
                    onChange={(e) => setStudentAnalogy(e.target.value)}
                    disabled={stage === "result"}
                    placeholder={isTa ? "இந்தக் கருத்தை உங்கள் சொந்த வார்த்தைகளில் ஒரு அன்றாட அனுபவத்துடன் இணைக்கவும்..." : "Link this idea to something from your daily life. Use your own words..."}
                    className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-500"
                  />

                  {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

                  {stage === "writing" && (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting || !studentAnalogy.trim()}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                      {submitting ? (isTa ? "சரிபார்க்கிறது..." : "Checking...") : (isTa ? "சமர்ப்பி" : "Submit")}
                    </button>
                  )}
                </div>
              )}

              {stage === "result" && result && <FeedbackCard result={result} isTa={isTa} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Module: concept grid ───────────────────────────────────────────────────── */
const ConceptBridgeView = ({ language = "en" }) => {
  const isTa = language === "ta";
  const [bridges, setBridges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBridges = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchConceptBridges(language);
      setBridges(data.bridges || []);
    } catch (err) {
      console.error("Failed to load concept bridges:", err);
      setError(isTa ? "கருத்துகளை ஏற்ற முடியவில்லை." : "Could not load the topics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [language, isTa]);

  useEffect(() => {
    loadBridges();
  }, [loadBridges]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-indigo-600">
            <Lightbulb size={14} />
            {isTa ? "சுருக்கம் vs உறுதி சிந்தனை" : "Link ideas to real life"}
          </div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
            {isTa ? "கருத்து பாலம்" : "Concept Bridge"}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {isTa
              ? "ஒரு ஒப்புமையைப் பாருங்கள், பிறகு உங்கள் சொந்த ஒப்புமையை உருவாக்கி AI கருத்தைப் பெறுங்கள்."
              : "See one example. Then make your own. The AI will tell you how good it is."}
          </p>
        </div>
        <button
          type="button"
          onClick={loadBridges}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 hover:text-indigo-600 active:scale-95"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-indigo-600" : ""} />
          {isTa ? "புதுப்பிக்க" : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : bridges.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm font-bold text-slate-800">
            {isTa ? "இன்னும் கருத்துகள் இல்லை" : "No topics here yet"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {isTa ? "நிர்வாகப் பக்கத்தில் ஒன்றைச் சேர்க்கவும்." : "Add one from the Manage tab."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bridges.map((bridge) => (
            <ConceptCard key={bridge.id} bridge={bridge} isTa={isTa} language={language} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ConceptBridgeView;
