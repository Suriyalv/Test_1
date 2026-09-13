import React, { useEffect, useState } from 'react';
import { fetchFeedbackStats } from './api';
import { ThumbsUp, ThumbsDown, ArrowLeft, BarChart3, RefreshCw, CheckCircle2, AlertTriangle, Languages } from 'lucide-react';
import { motion } from 'framer-motion';

const UserResponse = ({ onBackToChat, language: initialLang = "en" }) => {
    const [stats, setStats] = useState({ likes: 0, dislikes: 0, feedback_history: [] });
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState(initialLang);

    const isTa = language === "ta";

    const getStats = async () => {
        setLoading(true);
        try {
            const data = await fetchFeedbackStats();
            setStats(data);
        } catch (err) {
            console.error("Error fetching stats:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getStats();
    }, []);

    const total = stats.likes + stats.dislikes;
    const likePercentage = total > 0 ? (stats.likes / total) * 100 : 0;
    const dislikePercentage = total > 0 ? (stats.dislikes / total) * 100 : 0;

    const goodPrompts = stats.feedback_history?.filter(item => item.type === 'good') || [];
    const badPrompts = stats.feedback_history?.filter(item => item.type === 'bad') || [];

    const handleBack = () => {
        if (onBackToChat) {
            onBackToChat();
        } else {
            window.history.pushState({}, "", "/");
            window.dispatchEvent(new PopStateEvent("popstate"));
        }
    };

    return (
        <div className="min-h-screen bg-[#faf8ff] flex flex-col font-sans selection:bg-brand-600 selection:text-white pb-16">
            {/* Top Tricolor Strip */}
            <div className="tngov-tricolor-strip fixed top-0 left-0 right-0 z-50"></div>

            {/* Official Header */}
            <header className="sticky top-[3px] bg-white/95 backdrop-blur-md border-b border-slate-200 z-40 px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleBack}
                        className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#0284c7] rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95"
                    >
                        <ArrowLeft size={16} />
                        <span className="hidden sm:inline">{isTa ? "AI அரட்டைக்கு திரும்பு" : "Back to Chat"}</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <div>
                            <div className="text-[10px] sm:text-[11px] font-bold text-[#0284c7] uppercase tracking-wide">
                                {isTa ? "கல்வி பகுப்பாய்வு & பின்னூட்டம்" : "Academic Analytics & Feedback"}
                            </div>
                            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                                {isTa ? "மாணவர் பின்னூட்டம் & AI மதிப்பாய்வு" : "Student Feedback & AI Analytics"}
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setLanguage(l => l === "en" ? "ta" : "en")}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 border border-brand-200 text-[#0284c7] rounded-lg text-xs font-bold transition-all"
                    >
                        <Languages size={14} />
                        <span>{language === "en" ? "தமிழ்" : "English"}</span>
                    </button>

                    <button
                        onClick={getStats}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#0284c7] border border-slate-200 rounded-lg text-xs font-bold transition-all active:scale-95"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin text-[#0284c7]" : ""} />
                        <span>{isTa ? "புதுப்பிக்க" : "Refresh"}</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6">
                <motion.div 
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Stats Overview */}
                    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-brand-50 text-[#0284c7] border border-brand-200 rounded-lg">
                                <BarChart3 size={18} />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    {isTa ? "பின்னூட்ட மேலோட்டம் (Feedback Overview)" : "Feedback Overview & Quality Metrics"}
                                </h2>
                                <p className="text-slate-500 text-xs">
                                    {isTa ? "AI பதில்களுக்கான மாணவர்களின் நேரலை திருப்தி குறியீடு" : "Real-time student satisfaction and response evaluation metrics"}
                                </p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="h-40 flex items-center justify-center">
                                <RefreshCw size={24} className="animate-spin text-[#0284c7]" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Likes Card */}
                                <div className="bg-brand-50/60 rounded-xl p-5 border border-brand-200 flex flex-col items-center text-center">
                                    <div className="w-10 h-10 bg-white rounded-lg shadow-2xs border border-brand-200 flex items-center justify-center text-[#0284c7] mb-2.5">
                                        <ThumbsUp size={20} />
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-0.5">{stats.likes}</div>
                                    <div className="text-[#0284c7] font-bold uppercase tracking-wider text-[10px]">
                                        {isTa ? "பயனுள்ள பதில்கள் (Positive)" : "Helpful Responses (Positive)"}
                                    </div>
                                    <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
                                        <div 
                                            className="bg-[#0284c7] h-2 rounded-full transition-all duration-1000" 
                                            style={{ width: `${likePercentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="mt-1.5 text-[#0284c7] text-xs font-bold">
                                        {likePercentage.toFixed(1)}% {isTa ? "திருப்தி வீதம்" : "Approval Rate"}
                                    </div>
                                </div>

                                {/* Dislikes Card */}
                                <div className="bg-red-50/60 rounded-xl p-5 border border-red-200 flex flex-col items-center text-center">
                                    <div className="w-10 h-10 bg-white rounded-lg shadow-2xs border border-red-200 flex items-center justify-center text-red-600 mb-2.5">
                                        <ThumbsDown size={20} />
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-0.5">{stats.dislikes}</div>
                                    <div className="text-red-800 font-bold uppercase tracking-wider text-[10px]">
                                        {isTa ? "மேம்படுத்த வேண்டியவை (Issues)" : "Improvement Needed (Dislikes)"}
                                    </div>
                                    <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
                                        <div 
                                            className="bg-red-600 h-2 rounded-full transition-all duration-1000" 
                                            style={{ width: `${dislikePercentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="mt-1.5 text-red-700 text-xs font-bold">
                                        {dislikePercentage.toFixed(1)}% {isTa ? "மறுப்பு வீதம்" : "Disapproval Rate"}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Detailed Prompts Grid */}
                    {!loading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Good Prompts */}
                            <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
                                <div className="px-4 py-3 bg-brand-50 border-b border-brand-100 flex items-center justify-between">
                                    <h3 className="font-bold text-xs sm:text-sm text-[#0284c7] flex items-center gap-1.5">
                                        <CheckCircle2 size={15} /> {isTa ? "பயனுள்ள கேள்விகள்" : "Positive Feedback Queries"}
                                    </h3>
                                    <span className="bg-brand-200 text-[#0284c7] text-xs font-extrabold px-2 py-0.5 rounded-full">{goodPrompts.length}</span>
                                </div>
                                <div className="p-3.5 flex-1 max-h-[360px] overflow-y-auto space-y-2">
                                    {goodPrompts.length === 0 ? (
                                        <div className="text-center py-6 text-slate-400 text-xs italic">{isTa ? "பதிவுகள் எதுவும் இல்லை" : "No records found"}</div>
                                    ) : (
                                        goodPrompts.map((item, idx) => (
                                            <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 text-xs leading-relaxed">
                                                {item.prompt}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Bad Prompts */}
                            <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
                                <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between">
                                    <h3 className="font-bold text-xs sm:text-sm text-red-800 flex items-center gap-1.5">
                                        <AlertTriangle size={15} /> {isTa ? "மறுபரிசீலனை தேவைப்படும் கேள்விகள்" : "Flagged Queries for Review"}
                                    </h3>
                                    <span className="bg-red-200 text-red-900 text-xs font-extrabold px-2 py-0.5 rounded-full">{badPrompts.length}</span>
                                </div>
                                <div className="p-3.5 flex-1 max-h-[360px] overflow-y-auto space-y-2">
                                    {badPrompts.length === 0 ? (
                                        <div className="text-center py-6 text-slate-400 text-xs italic">{isTa ? "பதிவுகள் எதுவும் இல்லை" : "No records found"}</div>
                                    ) : (
                                        badPrompts.map((item, idx) => (
                                            <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 text-xs leading-relaxed">
                                                {item.prompt}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
};

export default UserResponse;


