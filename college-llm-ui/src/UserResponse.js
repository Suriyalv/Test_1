import React, { useEffect, useState } from 'react';
import { fetchFeedbackStats } from './api';
import { ThumbsUp, ThumbsDown, ArrowLeft, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const UserResponse = () => {
    const [stats, setStats] = useState({ likes: 0, dislikes: 0, feedback_history: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getStats = async () => {
            try {
                const data = await fetchFeedbackStats();
                setStats(data);
            } catch (err) {
                console.error("Error fetching stats:", err);
            } finally {
                setLoading(false);
            }
        };
        getStats();
    }, []);

    const total = stats.likes + stats.dislikes;
    const likePercentage = total > 0 ? (stats.likes / total) * 100 : 0;
    const dislikePercentage = total > 0 ? (stats.dislikes / total) * 100 : 0;

    const goodPrompts = stats.feedback_history?.filter(item => item.type === 'good') || [];
    const badPrompts = stats.feedback_history?.filter(item => item.type === 'bad') || [];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 md:px-8 justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => {
                            window.history.pushState({}, "", "/");
                            window.dispatchEvent(new PopStateEvent("popstate"));
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">User Feedback Insights</h1>
                </div>
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">A</span>
                </div>
            </header>

            <main className="flex-1 max-w-6xl mx-auto w-full p-6 md:p-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    {/* Stats Overview */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                <BarChart3 size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Response Overview</h2>
                                <p className="text-gray-500 text-sm">Real-time aggregate of AI response feedback</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="h-64 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Likes Card */}
                                <div className="bg-green-50/50 rounded-3xl p-8 border border-green-100 flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-green-600 mb-4">
                                        <ThumbsUp size={32} />
                                    </div>
                                    <div className="text-4xl font-black text-gray-900 mb-1">{stats.likes}</div>
                                    <div className="text-green-700 font-semibold uppercase tracking-wider text-xs">Total Likes</div>
                                    <div className="mt-4 w-full bg-green-100 rounded-full h-2">
                                        <div 
                                            className="bg-green-500 h-2 rounded-full transition-all duration-1000" 
                                            style={{ width: `${likePercentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="mt-2 text-green-600 text-sm font-medium">{likePercentage.toFixed(1)}% Approval</div>
                                </div>

                                {/* Dislikes Card */}
                                <div className="bg-red-50/50 rounded-3xl p-8 border border-red-100 flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-red-600 mb-4">
                                        <ThumbsDown size={32} />
                                    </div>
                                    <div className="text-4xl font-black text-gray-900 mb-1">{stats.dislikes}</div>
                                    <div className="text-red-700 font-semibold uppercase tracking-wider text-xs">Total Dislikes</div>
                                    <div className="mt-4 w-full bg-red-100 rounded-full h-2">
                                        <div 
                                            className="bg-red-500 h-2 rounded-full transition-all duration-1000" 
                                            style={{ width: `${dislikePercentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="mt-2 text-red-600 text-sm font-medium">{dislikePercentage.toFixed(1)}% Disapproval</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Detailed Prompts Grid */}
                    {!loading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Good Prompts */}
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                                <div className="px-6 py-4 bg-green-50 border-b border-green-100 flex items-center justify-between">
                                    <h3 className="font-bold text-green-800 flex items-center gap-2">
                                        <ThumbsUp size={18} /> Good Response Prompts
                                    </h3>
                                    <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-1 rounded-full">{goodPrompts.length}</span>
                                </div>
                                <div className="p-4 flex-1 max-h-[500px] overflow-y-auto space-y-3">
                                    {goodPrompts.length === 0 ? (
                                        <div className="text-center py-10 text-gray-400 text-sm italic">No data yet</div>
                                    ) : (
                                        goodPrompts.map((item, idx) => (
                                            <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-gray-700 text-sm leading-relaxed">
                                                {item.prompt}
                                                {item.timestamp && (
                                                    <div className="mt-2 text-[10px] text-gray-400 text-right">
                                                        {new Date(item.timestamp.seconds * 1000).toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Bad Prompts */}
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                                <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center justify-between">
                                    <h3 className="font-bold text-red-800 flex items-center gap-2">
                                        <ThumbsDown size={18} /> Bad Response Prompts
                                    </h3>
                                    <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-1 rounded-full">{badPrompts.length}</span>
                                </div>
                                <div className="p-4 flex-1 max-h-[500px] overflow-y-auto space-y-3">
                                    {badPrompts.length === 0 ? (
                                        <div className="text-center py-10 text-gray-400 text-sm italic">No data yet</div>
                                    ) : (
                                        badPrompts.map((item, idx) => (
                                            <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-gray-700 text-sm leading-relaxed">
                                                {item.prompt}
                                                {item.timestamp && (
                                                    <div className="mt-2 text-[10px] text-gray-400 text-right">
                                                        {new Date(item.timestamp.seconds * 1000).toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex justify-center">
                        <button 
                            onClick={() => window.location.reload()}
                            className="px-8 py-3 bg-black text-white rounded-2xl font-semibold hover:bg-gray-800 transition-all shadow-xl shadow-black/10 flex items-center gap-2"
                        >
                            <BarChart3 size={18} /> Refresh Insights
                        </button>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default UserResponse;
