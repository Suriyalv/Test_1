import React, { useState } from "react";
import FlashcardView from "./FlashcardView";
import AdminFlashcardManager from "./AdminFlashcardManager";
import { ArrowLeft, Layers, ShieldCheck, Languages } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FlashcardModule = ({ onBackToChat, initialLanguage = "en" }) => {
  const [activeTab, setActiveTab] = useState("cards"); // "cards" | "admin"
  const [language, setLanguage] = useState(initialLanguage);

  const isTa = language === "ta";

  return (
    <div className="min-h-screen bg-[#faf8ff] pb-16 font-sans text-slate-900 selection:bg-brand-600 selection:text-white">
      {/* Top Header Accent Strip */}
      <div className="tngov-tricolor-strip fixed left-0 right-0 top-0 z-50"></div>

      <header className="sticky top-[3px] z-40 flex items-center justify-between gap-3 border-b border-brand-100 bg-white/95 px-4 py-2.5 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          {onBackToChat && (
            <button
              onClick={onBackToChat}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200 hover:text-[#0284c7] active:scale-95"
              title="Return to Chat"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">{isTa ? "AI அரட்டை" : "Back to Chat"}</span>
            </button>
          )}

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#0284c7]">
              {isTa ? "விரைவு திருப்புதல் & நினைவாற்றல்" : "Quick Revision & Recall"}
            </div>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
              {isTa ? "கருத்து அட்டைத் தளம்" : "Concept Flashcard Portal"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-0.5">
            <button
              onClick={() => setActiveTab("cards")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === "cards"
                  ? "bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-pop"
                  : "text-slate-600 hover:text-[#0284c7]"
              }`}
            >
              <Layers size={14} />
              <span>{isTa ? "அட்டைகள்" : "Cards"}</span>
            </button>

            <button
              onClick={() => setActiveTab("admin")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === "admin"
                  ? "bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-pop"
                  : "text-slate-600 hover:text-[#0284c7]"
              }`}
            >
              <ShieldCheck size={14} />
              <span className="hidden sm:inline">{isTa ? "அட்டை மேலாண்மை" : "Manage Cards"}</span>
              <span className="sm:hidden">{isTa ? "ஆசிரியர்" : "Admin"}</span>
            </button>
          </div>

          <button
            onClick={() => setLanguage(isTa ? "en" : "ta")}
            title={isTa ? "Switch to English" : "தமிழுக்கு மாற்றவும்"}
            className="flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-bold text-[#0284c7] transition-all hover:bg-brand-100 active:scale-95"
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
            {activeTab === "cards" ? (
              <FlashcardView language={language} />
            ) : (
              <AdminFlashcardManager language={language} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default FlashcardModule;
