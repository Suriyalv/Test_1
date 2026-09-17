import React, { useState, useEffect, useCallback } from "react";
import { fetchConceptBridges, addConceptBridge, deleteConceptBridge } from "../../api";
import { getAccent } from "../Flashcards/flashcardTheme";
import { ACCENT_KEYS } from "../Flashcards/flashcardTheme";
import {
  PlusCircle,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Check,
  Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const linesToPoints = (text) =>
  text
    .split("\n")
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);

/* ── Module: concept builder + repository — mirrors AdminFlashcardManager's
   form + live-list pattern, just without the image/flip preview since a
   concept bridge has no card artwork. ─────────────────────────────────────── */
const AdminConceptManager = ({ language = "en" }) => {
  const isTa = language === "ta";

  const [bridges, setBridges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [titleTa, setTitleTa] = useState("");
  const [givenAnalogy, setGivenAnalogy] = useState("");
  const [givenAnalogyTa, setGivenAnalogyTa] = useState("");
  const [coreProperties, setCoreProperties] = useState("");
  const [corePropertiesTa, setCorePropertiesTa] = useState("");
  const [accent, setAccent] = useState("blue");

  const loadBridges = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchConceptBridges("en");
      setBridges(data.bridges || []);
    } catch (err) {
      console.error("Failed to load concept bridges:", err);
      setNotice({ type: "error", text: isTa ? "கருத்துகளை ஏற்ற முடியவில்லை." : "Could not load existing concepts." });
    } finally {
      setLoading(false);
    }
  }, [isTa]);

  useEffect(() => {
    loadBridges();
  }, [loadBridges]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const resetForm = () => {
    setSubject("");
    setTitle("");
    setTitleTa("");
    setGivenAnalogy("");
    setGivenAnalogyTa("");
    setCoreProperties("");
    setCorePropertiesTa("");
    setAccent("blue");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setNotice({ type: "error", text: isTa ? "கருத்தின் தலைப்பை உள்ளிடவும்." : "Please enter a concept title." });
      return;
    }
    if (!givenAnalogy.trim()) {
      setNotice({ type: "error", text: isTa ? "ஒப்புமையை உள்ளிடவும்." : "Please provide the given analogy." });
      return;
    }
    if (linesToPoints(coreProperties).length === 0) {
      setNotice({ type: "error", text: isTa ? "குறைந்தது ஒரு முக்கியப் பண்பையாவது உள்ளிடவும்." : "Please add at least one core property." });
      return;
    }

    setSubmitting(true);
    try {
      await addConceptBridge({
        subject: subject.trim() || "General",
        title: title.trim(),
        titleTa: titleTa.trim(),
        givenAnalogy: givenAnalogy.trim(),
        givenAnalogyTa: givenAnalogyTa.trim(),
        coreProperties: coreProperties.trim(),
        corePropertiesTa: corePropertiesTa.trim(),
        accent,
      });
      resetForm();
      await loadBridges();
      setNotice({ type: "ok", text: isTa ? "கருத்து சேர்க்கப்பட்டது." : "Concept added." });
    } catch (err) {
      console.error("Failed to add concept bridge:", err);
      setNotice({ type: "error", text: isTa ? "சேமிக்க முடியவில்லை." : "Could not save the concept." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (bridge) => {
    const prompt = isTa ? `"${bridge.title}" கருத்தை நீக்கவா?` : `Delete "${bridge.title}"?`;
    if (!window.confirm(prompt)) return;
    try {
      await deleteConceptBridge(bridge.id);
      setBridges((prev) => prev.filter((b) => b.id !== bridge.id));
    } catch (err) {
      console.error("Failed to delete concept bridge:", err);
      setNotice({ type: "error", text: isTa ? "நீக்க முடியவில்லை." : "Could not delete the concept." });
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";
  const labelClass = "mb-1.5 block text-xs font-bold text-slate-700";

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-indigo-600">
            <ShieldCheck size={14} />
            {isTa ? "ஆசிரியர் கருத்து மேலாண்மை" : "Faculty Concept Management"}
          </div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
            {isTa ? "கருத்து பாலம் உருவாக்கி" : "Concept Bridge Builder"}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {isTa
              ? "ஒரு சுருக்கக் கருத்து, அதன் ஒப்புமை, மற்றும் முக்கியப் பண்புகளை உள்ளிடவும்."
              : "Add an abstract concept, a concrete example analogy, and the properties a good analogy must capture."}
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

      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold ${
              notice.type === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {notice.type === "ok" ? <Check size={16} /> : <Trash2 size={16} />}
            {notice.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
          <PlusCircle size={16} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900 sm:text-base">
            {isTa ? "புதிய கருத்தை உருவாக்கு" : "Create a New Concept"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="cb-subject">{isTa ? "பாடப்பிரிவு" : "Subject"}</label>
            <input id="cb-subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder={isTa ? "எ.கா. இயற்பியல்" : "e.g. Physics"} className={inputClass} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="cb-title">
                {isTa ? "கருத்தின் தலைப்பு (ஆங்கிலம்)" : "Concept Title (English)"} <span className="text-red-500">*</span>
              </label>
              <input id="cb-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder={isTa ? "எ.கா. Electric Current" : "e.g. Electric Current"} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="cb-title-ta">{isTa ? "தலைப்பு (தமிழ்)" : "Concept Title (Tamil)"}</label>
              <input id="cb-title-ta" type="text" value={titleTa} onChange={(e) => setTitleTa(e.target.value)}
                placeholder={isTa ? "விருப்பத்தேர்வு" : "Optional Tamil title"} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="cb-analogy">
              {isTa ? "ஒப்புமை (ஆங்கிலம்)" : "Given Analogy (English)"} <span className="text-red-500">*</span>
            </label>
            <textarea id="cb-analogy" rows={3} value={givenAnalogy} onChange={(e) => setGivenAnalogy(e.target.value)}
              placeholder={isTa ? "கருத்தை ஒரு அன்றாட அனுபவத்துடன் இணைக்கும் ஒப்புமை..." : "A concrete, everyday analogy that captures this abstract idea..."}
              className={`${inputClass} resize-y leading-relaxed`} />
          </div>
          <div>
            <label className={labelClass} htmlFor="cb-analogy-ta">{isTa ? "ஒப்புமை (தமிழ்)" : "Given Analogy (Tamil)"}</label>
            <textarea id="cb-analogy-ta" rows={3} value={givenAnalogyTa} onChange={(e) => setGivenAnalogyTa(e.target.value)}
              placeholder={isTa ? "விருப்பத்தேர்வு" : "Optional Tamil analogy"} className={`${inputClass} resize-y leading-relaxed`} />
          </div>

          <div>
            <label className={labelClass} htmlFor="cb-props">
              {isTa ? "முக்கியப் பண்புகள் (ஆங்கிலம், ஒரு வரிக்கு ஒன்று)" : "Core Properties (English, one per line)"} <span className="text-red-500">*</span>
            </label>
            <textarea id="cb-props" rows={4} value={coreProperties} onChange={(e) => setCoreProperties(e.target.value)}
              placeholder={isTa ? "ஒரு நல்ல ஒப்புமை பிடிக்க வேண்டிய ஒவ்வொரு அம்சமும் ஒரு வரி..." : "One line per property a good analogy must capture..."}
              className={`${inputClass} resize-y leading-relaxed`} />
            <p className="mt-1 text-[11px] text-slate-400">
              {isTa
                ? "மாணவரின் சொந்த ஒப்புமையை AI இந்தப் பண்புகளுடன் ஒப்பிட்டுச் சரிபார்க்கும்."
                : "The AI checks a student's own analogy against these properties."}
            </p>
          </div>
          <div>
            <label className={labelClass} htmlFor="cb-props-ta">{isTa ? "முக்கியப் பண்புகள் (தமிழ்)" : "Core Properties (Tamil)"}</label>
            <textarea id="cb-props-ta" rows={4} value={corePropertiesTa} onChange={(e) => setCorePropertiesTa(e.target.value)}
              placeholder={isTa ? "விருப்பத்தேர்வு" : "Optional Tamil points, one per line"} className={`${inputClass} resize-y leading-relaxed`} />
          </div>

          <div>
            <span className={labelClass}>{isTa ? "நிறம்" : "Colour"}</span>
            <div className="flex flex-wrap gap-2">
              {ACCENT_KEYS.map((key) => (
                <button key={key} type="button" onClick={() => setAccent(key)} title={getAccent(key).label}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border border-black/5 transition-all active:scale-95 ${getAccent(key).swatch} ${
                    accent === key ? "ring-2 ring-slate-900 ring-offset-2" : "opacity-80 hover:opacity-100"
                  }`}>
                  {accent === key && <Check size={15} className="text-slate-900" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button type="submit" disabled={submitting}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-all hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? <RefreshCw size={15} className="animate-spin" /> : <PlusCircle size={15} />}
              {submitting ? (isTa ? "சேமிக்கிறது..." : "Saving...") : (isTa ? "கருத்தைச் சேர்" : "Add Concept")}
            </button>
            <button type="button" onClick={resetForm}
              className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95">
              {isTa ? "படிவத்தை அழி" : "Clear Form"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Lightbulb size={16} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900 sm:text-base">
            {isTa ? "தற்போதுள்ள கருத்துகள்" : "Existing Concepts"}
          </h3>
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-600">{bridges.length}</span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : bridges.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {isTa ? "இன்னும் கருத்துகள் இல்லை." : "No concepts yet. Create the first one above."}
          </p>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {bridges.map((bridge) => (
                <motion.li key={bridge.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -12 }}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-indigo-200 hover:bg-white">
                  <div className={`h-11 w-2.5 shrink-0 rounded-full bg-gradient-to-b ${getAccent(bridge.accent).face}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-900">{bridge.title}</p>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getAccent(bridge.accent).chip}`}>
                        {bridge.subject}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{bridge.givenAnalogy}</p>
                  </div>
                  <button type="button" onClick={() => handleDelete(bridge)} title={isTa ? "நீக்கு" : "Delete"}
                    className="shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-slate-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95">
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

export default AdminConceptManager;
