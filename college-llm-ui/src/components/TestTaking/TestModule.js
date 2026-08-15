import React, { useState } from "react";
import StudentTestView from "./StudentTestView";
import AdminQuestionManager from "./AdminQuestionManager";
import { GraduationCap, ShieldCheck, ArrowLeft, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TestModule = ({ onBackToChat }) => {
  const [activeTab, setActiveTab] = useState("student"); // "student" | "admin"

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans selection:bg-blue-600 selection:text-white pb-12">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-black text-white border-b border-blue-600/40 shadow-xl px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBackToChat && (
            <button
              onClick={onBackToChat}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to Chat</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-900/50">
              <GraduationCap size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>AI Test Taking & Accuracy Engine</span>
                <span className="px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-700 text-[10px] uppercase font-bold rounded-full">
                  LLM Evaluated
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("student")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "student"
                ? "bg-blue-600 text-white shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Sparkles size={14} />
            <span>Take Test (Student)</span>
          </button>

          <button
            onClick={() => setActiveTab("admin")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "admin"
                ? "bg-blue-600 text-white shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={14} />
            <span>Manage Questions (Admin)</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "student" ? (
              <StudentTestView />
            ) : (
              <AdminQuestionManager />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default TestModule;
