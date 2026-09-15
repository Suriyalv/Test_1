import React, { useEffect, useState } from 'react';
import { fetchFeedbackStats } from './api';
import { ThumbsUp, ThumbsDown, BarChart3, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
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

    useEffect(() => {
        if (initialLang) setLanguage(initialLang);
    }, [initialLang]);

    return (
        <div className="flex-1 bg-transparent flex flex-col font-sans selection:bg-[#E5F1FF] selection:text-[#007AFF] pb-16">
            {/* Module Sub-Header */}
            <div className="bg-slate-50/80 border-b border-[#e5e5e5] px-4 sm:px-6 py-2.5 backdrop-blur-sm shadow-xs">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-wide">
                            {isTa ? "கல்வி பகுப்பாய்வு & பின்னூட்டம் // ஆசிரியர் மையம்" : "Academic Analytics & Feedback // Teacher Observatory"}
                        </div>
                        <h1 className="text-[15px] sm:text-base font-semibold text-zinc-900 tracking-tight">
                            {isTa ? "மாணவர் பின்னூட்டம் & AI மதிப்பாய்வு" : "Student Feedback & AI Analytics"}
                        </h1>
                    </div>

                    <button
                        onClick={getStats}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e5e5e5] hover:bg-slate-50 text-[#007AFF] shadow-sm rounded-xl text-xs font-black transition-all active:scale-95"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin text-[#007AFF]" : ""} />
                        <span>{isTa ? "புதுப்பிக்க" : "Refresh"}</span>
                    </button>
                </div>
            </div>

            <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6">
                <motion.div 
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Stats Overview */}
                    <div className="bg-white/70 backdrop-blur-xl rounded-[24px] shadow-sm border border-white/50 p-5 sm:p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 bg-zinc-900 text-white rounded-[12px]">
                                <BarChart3 size={18} />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-zinc-900">
                                    {isTa ? "பின்னூட்ட மேலோட்டம் (Feedback Overview)" : "Feedback Overview & Quality Metrics"}
                                </h2>
                                <p className="text-zinc-500 text-xs mt-0.5">
                                    {isTa ? "AI பதில்களுக்கான மாணவர்களின் நேரலை திருப்தி குறியீடு" : "Real-time student satisfaction and response evaluation metrics"}
                                </p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="h-40 flex items-center justify-center">
                                <RefreshCw size={24} className="animate-spin text-[#007AFF]" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Likes Card */}
                                <div className="bg-zinc-50 rounded-[20px] p-5 border border-zinc-200 shadow-sm flex flex-col items-center text-center">
                                    <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-zinc-200 flex items-center justify-center text-[#007AFF] mb-2.5">
                                        <ThumbsUp size={20} />
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-black text-zinc-900 mb-0.5">{stats.likes}</div>
                                    <div className="text-[#007AFF] font-bold uppercase tracking-wider text-[10px]">
                                        {isTa ? "பயனுள்ள பதில்கள் (Positive)" : "Helpful Responses (Positive)"}
                                    </div>
                                    <div className="mt-3 w-full bg-zinc-200 rounded-full h-2">
                                        <div 
                                            className="bg-[#007AFF] h-2 rounded-full transition-all duration-1000" 
                                            style={{ width: `${likePercentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="mt-1.5 text-[#007AFF] text-xs font-bold">
                                        {likePercentage.toFixed(1)}% {isTa ? "திருப்தி வீதம்" : "Approval Rate"}
                                    </div>
                                </div>

                                {/* Dislikes Card */}
                                <div className="bg-zinc-50 rounded-[20px] p-5 border border-zinc-200 shadow-sm flex flex-col items-center text-center">
                                    <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-zinc-200 flex items-center justify-center text-red-500 mb-2.5">
                                        <ThumbsDown size={20} />
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-black text-zinc-900 mb-0.5">{stats.dislikes}</div>
                                    <div className="text-red-600 font-bold uppercase tracking-wider text-[10px]">
                                        {isTa ? "மேம்படுத்த வேண்டியவை (Issues)" : "Improvement Needed (Dislikes)"}
                                    </div>
                                    <div className="mt-3 w-full bg-zinc-200 rounded-full h-2">
                                        <div 
                                            className="bg-red-500 h-2 rounded-full transition-all duration-1000" 
                                            style={{ width: `${dislikePercentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="mt-1.5 text-red-500 text-xs font-bold">
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
                            <div className="bg-white/70 backdrop-blur-xl rounded-[20px] shadow-sm border border-white/50 overflow-hidden flex flex-col">
                                <div className="px-5 py-4 bg-white/40 backdrop-blur-sm border-b border-white/50 flex items-center justify-between">
                                    <h3 className="font-semibold text-[14px] text-zinc-800 flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-[#007AFF]" /> {isTa ? "பயனுள்ள கேள்விகள்" : "Positive Feedback Queries"}
                                    </h3>
                                    <span className="bg-zinc-200 text-zinc-800 text-xs font-bold px-2.5 py-0.5 rounded-[6px]">{goodPrompts.length}</span>
                                </div>
                                <div className="p-4 flex-1 max-h-[360px] overflow-y-auto space-y-3">
                                    {goodPrompts.length === 0 ? (
                                        <div className="text-center py-6 text-zinc-400 text-xs italic">{isTa ? "பதிவுகள் எதுவும் இல்லை" : "No records found"}</div>
                                    ) : (
                                        goodPrompts.map((item, idx) => (
                                            <div key={idx} className="p-3 bg-zinc-50 rounded-[12px] border border-zinc-200 text-zinc-800 text-[13px] leading-relaxed">
                                                {item.prompt}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Bad Prompts */}
                            <div className="bg-white/70 backdrop-blur-xl rounded-[20px] shadow-sm border border-white/50 overflow-hidden flex flex-col">
                                <div className="px-5 py-4 bg-white/40 backdrop-blur-sm border-b border-white/50 flex items-center justify-between">
                                    <h3 className="font-semibold text-[14px] text-zinc-800 flex items-center gap-2">
                                        <AlertTriangle size={16} className="text-red-500" /> {isTa ? "மறுபரிசீலனை தேவைப்படும் கேள்விகள்" : "Flagged Queries for Review"}
                                    </h3>
                                    <span className="bg-zinc-200 text-zinc-800 text-xs font-bold px-2.5 py-0.5 rounded-[6px]">{badPrompts.length}</span>
                                </div>
                                <div className="p-4 flex-1 max-h-[360px] overflow-y-auto space-y-3">
                                    {badPrompts.length === 0 ? (
                                        <div className="text-center py-6 text-zinc-400 text-xs italic">{isTa ? "பதிவுகள் எதுவும் இல்லை" : "No records found"}</div>
                                    ) : (
                                        badPrompts.map((item, idx) => (
                                            <div key={idx} className="p-3 bg-zinc-50 rounded-[12px] border border-zinc-200 text-zinc-800 text-[13px] leading-relaxed">
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


