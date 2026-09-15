import React, { useState } from "react";
import MindMapView from "./MindMapView";
import AdminMindMapManager from "./AdminMindMapManager";
import { Network, ShieldCheck, Compass } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MindMapModule = ({ onBackToChat, initialLanguage = "en", language: propsLanguage }) => {
  const [activeTab, setActiveTab] = useState("map"); // "map" | "admin"
  const [language, setLanguage] = useState(propsLanguage || initialLanguage);
  const [refreshToken, setRefreshToken] = useState(0);

  React.useEffect(() => {
    if (propsLanguage) setLanguage(propsLanguage);
  }, [propsLanguage]);

  const isTa = language === "ta";

  return (
    <div className="flex-1 pb-16 font-sans text-slate-900 selection:bg-indigo-200 selection:text-indigo-900">
      {/* Module Sub-Header: Context & View Switcher */}
      <div className="bg-slate-50/80 border-b border-[#e5e5e5] px-4 sm:px-6 py-2.5 backdrop-blur-sm shadow-xs">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#af70e6]">
              <Compass size={12} className="text-[#af70e6]" />
              <span>{isTa ? "கருத்து வரைபட மையம் // பிரிவு 04" : "SYNAPSE CARTOGRAPHY // LEVEL 04"}</span>
            </div>
            <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900">
              {isTa ? "கருத்து இணைப்பு வரைபடம்" : "Concept Knowledge Constellation"}
            </h1>
          </div>

          <div className="flex items-center bg-[#f7f7f7] p-1 rounded-2xl border border-[#e5e5e5] gap-1 shadow-inner">
            <button
              onClick={() => setActiveTab("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === "map"
                  ? "bg-white text-[#af70e6] shadow-sm border border-[#e5e5e5]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Network size={14} className={activeTab === "map" ? "text-[#af70e6]" : ""} />
              <span>{isTa ? "வரைபடம்" : "Constellation"}</span>
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
              <span className="hidden sm:inline">{isTa ? "வரைபட மேலாண்மை" : "Manage"}</span>
              <span className="sm:hidden">{isTa ? "ஆசிரியர்" : "Admin"}</span>
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1440px] px-3 sm:px-6 pt-4 sm:pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "map" ? (
              <MindMapView language={language} refreshToken={refreshToken} />
            ) : (
              <AdminMindMapManager
                language={language}
                onSaved={() => setRefreshToken((r) => r + 1)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MindMapModule;
