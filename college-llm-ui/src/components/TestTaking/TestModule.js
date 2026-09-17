import React, { useState } from "react";
import StudentTestView from "./StudentTestView";
import AdminQuestionManager from "./AdminQuestionManager";
import VideoLessonView from "./VideoLessonView";
import { GraduationCap, ShieldCheck, ArrowLeft, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TestModule = ({ onBackToHome, initialLanguage = "en", initialTab = "student" }) => {
  const [activeTab, setActiveTab] = useState(initialTab); // "student" | "video" | "admin"
  const [language, setLanguage] = useState(initialLanguage);

  return (
    <div className="min-h-screen bg-[#faf8ff] text-slate-900 font-sans selection:bg-brand-600 selection:text-white pb-16">
      {/* Top Header Accent Strip */}
      <div className="tngov-tricolor-strip fixed top-0 left-0 right-0 z-50"></div>

      {/* Clean Minimal Exam Header */}
      <header className="sticky top-[3px] z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#0284c7] rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 text-xs font-semibold active:scale-95"
              title="Back to Home"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">
                {language === "ta" ? "முகப்பு" : "Home"}
              </span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div>
              <div className="text-[10px] font-bold text-[#0284c7] uppercase tracking-wide">
                {language === "ta" ? "ஸ்மார்ட் தேர்வு & திறன் மதிப்பீடு" : "Practise and test yourself"}
              </div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                {language === "ta" ? "தானியங்கி மாதிரித் தேர்வு தளம்" : "Tests"}
              </h1>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 gap-1">
          <button
            onClick={() => setActiveTab("student")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "student"
                ? "bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-pop"
                : "text-slate-600 hover:text-[#0284c7]"
            }`}
          >
            <GraduationCap size={14} />
            <span>{language === "ta" ? "மாணவர் தேர்வு" : "Student Test"}</span>
          </button>

          <button
            onClick={() => setActiveTab("video")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "video"
                ? "bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-pop"
                : "text-slate-600 hover:text-[#0284c7]"
            }`}
            title={language === "ta" ? "வீடியோ பாடம் & வினாக்கள்" : "Video Lesson"}
          >
            <Video size={14} />
            <span>{language === "ta" ? "வீடியோ பாடம்" : "Video Lesson"}</span>
          </button>

          <button
            onClick={() => setActiveTab("admin")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "admin"
                ? "bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-pop"
                : "text-slate-600 hover:text-[#0284c7]"
            }`}
          >
            <ShieldCheck size={14} />
            <span className="hidden sm:inline">{language === "ta" ? "வினா வங்கி" : "Question Bank"}</span>
            <span className="sm:hidden">{language === "ta" ? "ஆசிரியர்" : "Admin"}</span>
          </button>
        </div>
      </header>

      {/* Main Examination View */}
      <main className="max-w-4xl mx-auto px-4 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "student" ? (
              <StudentTestView language={language} setLanguage={setLanguage} />
            ) : activeTab === "video" ? (
              <VideoLessonView language={language} setLanguage={setLanguage} />
            ) : (
              <AdminQuestionManager language={language} setLanguage={setLanguage} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default TestModule;




