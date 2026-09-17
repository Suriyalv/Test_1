import React, { useState } from "react";
import ConceptBridgeView from "./ConceptBridgeView";
import AdminConceptManager from "./AdminConceptManager";
import { ArrowLeft, Lightbulb, ShieldCheck, Languages } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ConceptBridgeModule = ({ onBackToHome, initialLanguage = "en" }) => {
  const [activeTab, setActiveTab] = useState("explore"); // "explore" | "admin"
  const [language, setLanguage] = useState(initialLanguage);

  const isTa = language === "ta";

  return (
    <div className="min-h-screen bg-[#faf8ff] pb-16 font-sans text-slate-900 selection:bg-brand-600 selection:text-white">
      <div className="tngov-tricolor-strip fixed left-0 right-0 top-0 z-50"></div>

      <header className="sticky top-[3px] z-40 flex items-center justify-between gap-3 border-b border-indigo-100 bg-white/95 px-4 py-2.5 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200 hover:text-indigo-600 active:scale-95"
              title="Back to Home"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">{isTa ? "முகப்பு" : "Home"}</span>
            </button>
          )}

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">
              {isTa ? "சுருக்கம் vs உறுதி சிந்தனை" : "Link ideas to real life"}
            </div>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
              {isTa ? "கருத்து பாலம்" : "Concept Bridge"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-0.5">
            <button
              onClick={() => setActiveTab("explore")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === "explore"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-pop"
                  : "text-slate-600 hover:text-indigo-600"
              }`}
            >
              <Lightbulb size={14} />
              <span>{isTa ? "ஆராயுங்கள்" : "Learn"}</span>
            </button>

            <button
              onClick={() => setActiveTab("admin")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === "admin"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-pop"
                  : "text-slate-600 hover:text-indigo-600"
              }`}
            >
              <ShieldCheck size={14} />
              <span className="hidden sm:inline">{isTa ? "மேலாண்மை" : "Manage"}</span>
              <span className="sm:hidden">{isTa ? "ஆசிரியர்" : "Admin"}</span>
            </button>
          </div>

          <button
            onClick={() => setLanguage(isTa ? "en" : "ta")}
            title={isTa ? "Switch to English" : "தமிழுக்கு மாற்றவும்"}
            className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 transition-all hover:bg-indigo-100 active:scale-95"
          >
            <Languages size={14} />
            <span>{isTa ? "English" : "தமிழ்"}</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "explore" ? (
              <ConceptBridgeView language={language} />
            ) : (
              <AdminConceptManager language={language} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ConceptBridgeModule;
