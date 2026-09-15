import React, { useState } from "react";
import StudentTestView from "./StudentTestView";
import AdminQuestionManager from "./AdminQuestionManager";
import VideoLessonView from "./VideoLessonView";
import { GraduationCap, ShieldCheck, Video, Compass } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TestModule = ({ onBackToChat, initialLanguage = "en", language: propsLanguage }) => {
  const [activeTab, setActiveTab] = useState("student"); // "student" | "video" | "admin"
  const [language, setLanguage] = useState(propsLanguage || initialLanguage);

  React.useEffect(() => {
    if (propsLanguage) setLanguage(propsLanguage);
  }, [propsLanguage]);

  const isTa = language === "ta";

  return (
    <div className="flex-1 pb-16 font-sans text-slate-900 selection:bg-sky-200 selection:text-sky-900">
      {/* Module Sub-Header: Context & View Switcher */}
      <div className="bg-slate-50/80 border-b border-[#e5e5e5] px-4 sm:px-6 py-2.5 backdrop-blur-sm shadow-xs">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#1cb0f6]">
              <Compass size={12} className="text-[#1cb0f6]" />
              <span>{isTa ? "தேர்வுப் போர்க்களம் // பிரிவு 02" : "ARENA OF TRIALS // LEVEL 02"}</span>
            </div>
            <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900">
              {isTa ? "மாதிரித் தேர்வு & வினாக்களம்" : "Automated Trial & Assessments"}
            </h1>
          </div>

          {/* View Switcher Tabs */}
          <div className="flex items-center bg-[#f7f7f7] p-1 rounded-2xl border border-[#e5e5e5] gap-1 shadow-inner">
            <button
              onClick={() => setActiveTab("student")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === "student"
                  ? "bg-white text-[#1cb0f6] shadow-sm border border-[#e5e5e5]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <GraduationCap size={15} className={activeTab === "student" ? "text-[#1cb0f6]" : ""} />
              <span>{isTa ? "மாணவர் தேர்வு" : "Student Trial"}</span>
            </button>

            <button
              onClick={() => setActiveTab("video")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === "video"
                  ? "bg-white text-[#ff9600] shadow-sm border border-[#e5e5e5]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
              title={isTa ? "வீடியோ பாடம் & வினாக்கள்" : "Video Lesson with Questions"}
            >
              <Video size={15} className={activeTab === "video" ? "text-[#ff9600]" : ""} />
              <span>{isTa ? "வீடியோ பாடம்" : "Interactive Video"}</span>
            </button>

            <button
              onClick={() => setActiveTab("admin")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === "admin"
                  ? "bg-white text-[#af70e6] shadow-sm border border-[#e5e5e5]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <ShieldCheck size={15} className={activeTab === "admin" ? "text-[#af70e6]" : ""} />
              <span className="hidden sm:inline">{isTa ? "வினா வங்கி" : "Manage"}</span>
              <span className="sm:hidden">{isTa ? "ஆசிரியர்" : "Admin"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Examination View */}
      <main className="max-w-4xl mx-auto px-4 pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
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
