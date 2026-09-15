import React, { useState } from "react";
import KahootPlayView from "./KahootPlayView";
import AdminKahootManager from "./AdminKahootManager";
import { Trophy, ShieldCheck, Compass } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const KahootModule = ({ onBackToChat, initialLanguage = "en", language: propsLanguage }) => {
  const [activeTab, setActiveTab] = useState("play"); // "play" | "admin"
  const [language, setLanguage] = useState(propsLanguage || initialLanguage);

  React.useEffect(() => {
    if (propsLanguage) setLanguage(propsLanguage);
  }, [propsLanguage]);

  const isTa = language === "ta";

  return (
    <div className="flex-1 pb-16 font-sans text-slate-900 selection:bg-rose-200 selection:text-rose-900">
      {/* Module Sub-Header: Context & View Switcher */}
      <div className="bg-slate-50/80 border-b border-[#e5e5e5] px-4 sm:px-6 py-2.5 backdrop-blur-sm shadow-xs">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#ff4b4b]">
              <Compass size={12} className="text-[#ff4b4b]" />
              <span>{isTa ? "வினாடி வினா அரங்கம் // பிரிவு 05" : "THUNDER COLOSSEUM // LEVEL 05"}</span>
            </div>
            <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900">
              {isTa ? "நேரடி வினாடி வினா & வேகப் போட்டி" : "Live Quiz Arena & Rapid Battles"}
            </h1>
          </div>

          <div className="flex items-center bg-[#f7f7f7] p-1 rounded-2xl border border-[#e5e5e5] gap-1 shadow-inner">
            <button
              onClick={() => setActiveTab("play")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === "play"
                  ? "bg-white text-[#ff4b4b] shadow-sm border border-[#e5e5e5]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Trophy size={14} className={activeTab === "play" ? "text-[#ff4b4b]" : ""} />
              <span>{isTa ? "விளையாடு" : "Battle"}</span>
            </button>

            <button
              onClick={() => setActiveTab("admin")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === "admin"
                  ? "bg-white text-[#af70e6] shadow-sm border border-[#e5e5e5]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <ShieldCheck size={14} className={activeTab === "admin" ? "text-[#af70e6]" : ""} />
              <span className="hidden sm:inline">{isTa ? "வினாடி வினா மேலாண்மை" : "Manage"}</span>
              <span className="sm:hidden">{isTa ? "ஆசிரியர்" : "Admin"}</span>
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "play" ? (
              <KahootPlayView language={language} />
            ) : (
              <AdminKahootManager language={language} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default KahootModule;
