import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, FileText, Download, ThumbsUp, ThumbsDown, Copy, Check, Volume2, VolumeX, Sparkles, BookOpen } from 'lucide-react';
import StructuredResponse from '../StructuredResponse';
import { sendLike, sendDislike } from '../api';

const MessageBubble = ({ message, language = "en" }) => {
    const isUser = message.role === 'user';
    const [voteType, setVoteType] = useState(null);
    const [copied, setCopied] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const handleLike = async () => {
        if (voteType) return;
        try {
            await sendLike(message.prompt || "General Query");
            setVoteType('good');
        } catch (err) {
            console.error("Error sending like:", err);
        }
    };

    const handleDislike = async () => {
        if (voteType) return;
        try {
            await sendDislike(message.prompt || "General Query");
            setVoteType('bad');
        } catch (err) {
            console.error("Error sending dislike:", err);
        }
    };

    const copyToClipboard = () => {
        if (!message.content) return;
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleSpeech = () => {
        if (!window.speechSynthesis) return;

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message.content.replace(/[#*`_~]/g, ""));
        utterance.lang = language === "ta" ? "ta-IN" : "en-US";
        utterance.rate = 0.95;

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            <div className={`flex w-full max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2.5`}>
                
                {/* Avatar Icon */}
                <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg ${
                    isUser
                        ? 'bg-[#1e3a8a] text-white shadow-xs'
                        : 'bg-blue-50 text-[#1e3a8a] border border-blue-100'
                }`}>
                    {isUser ? (
                        <User size={15} />
                    ) : (
                        <Sparkles size={15} />
                    )}
                </div>

                {/* Message Bubble Container */}
                <div
                    className={`flex-1 rounded-xl p-4 text-sm leading-relaxed ${
                        isUser
                            ? 'bg-[#1e3a8a] text-white rounded-tr-none shadow-xs max-w-[85%]'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs'
                    }`}
                >
                    {/* Header bar on AI Message */}
                    {!isUser && (
                        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-[#1e3a8a] tracking-wide uppercase flex items-center gap-1">
                                    <Sparkles size={12} className="text-[#2563eb]" />
                                    {language === "ta" ? "AI கல்வி உதவியாளர்" : "AI Learning Assistant"}
                                </span>
                            </div>

                            {/* Read Aloud & Copy */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={toggleSpeech}
                                    className={`p-1 rounded text-xs font-semibold transition-colors ${
                                        isSpeaking 
                                            ? 'bg-blue-100 text-[#1e3a8a] animate-pulse'
                                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                    }`}
                                    title={isSpeaking ? "Stop" : "Read Aloud"}
                                >
                                    {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                </button>

                                <button
                                    onClick={copyToClipboard}
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs transition-colors"
                                    title="Copy"
                                >
                                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    {isUser ? (
                        <div className="font-medium text-white whitespace-pre-wrap">{message.content}</div>
                    ) : (
                        <>
                            <div className="markdown-container">
                                <StructuredResponse text={message.content} />
                            </div>

                            {/* Images */}
                            {message.images && message.images.length > 0 && (
                                <div className="mt-3 pt-2.5 border-t border-slate-100 w-full">
                                    <p className="text-xs text-slate-600 mb-1.5 font-bold uppercase tracking-wider flex items-center gap-1">
                                        <FileText size={12} className="text-[#1e3a8a]" />
                                        {language === "ta" ? "வரைபடம் (Visuals)" : "Visuals"}
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        {message.images.map((img, idx) => (
                                            <div key={idx} className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
                                                <img
                                                    src={img.url}
                                                    alt={img.name}
                                                    className="w-full h-auto object-contain bg-white max-h-64"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x200?text=Image+Not+Found'; }}
                                                />
                                                {img.description && (
                                                    <div className="p-2 bg-slate-50 border-t border-slate-100">
                                                        <p className="text-xs text-slate-600 italic">
                                                            {img.description}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Referenced Files */}
                            {message.files && message.files.length > 0 && (
                                <div className="mt-3 pt-2.5 border-t border-slate-100 w-full">
                                    <p className="text-xs text-slate-600 mb-1.5 font-bold uppercase tracking-wider flex items-center gap-1">
                                        <FileText size={12} className="text-[#1e3a8a]" />
                                        {language === "ta" ? "மேற்கோள்கள் (References)" : "References"}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {message.files.map((file, idx) => (
                                            <a
                                                key={idx}
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-700 rounded-md text-xs font-medium hover:bg-blue-50 hover:text-[#1e3a8a] transition-all border border-slate-200 group"
                                            >
                                                <span className="truncate max-w-[160px]">{file.name}</span>
                                                <Download size={11} className="text-slate-400 group-hover:text-[#1e3a8a]" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Curriculum & Textbook References */}
                            {message.references && message.references.length > 0 && (
                                <div className="mt-3 pt-2.5 border-t border-slate-100 w-full">
                                    <p className="text-[11px] text-slate-500 mb-1.5 font-bold uppercase tracking-wider flex items-center gap-1">
                                        <BookOpen size={12} className="text-[#1e3a8a]" />
                                        {language === "ta" ? "பாடத்திட்ட மேற்கோள் (Curriculum Sources)" : "Textbook References"}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {message.references.map((ref, idx) => (
                                            <div
                                                key={idx}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50/70 border border-blue-200/80 rounded-md text-xs text-[#1e3a8a] font-medium shadow-2xs"
                                            >
                                                <span className="font-bold">Ch {ref.chapter_no}:</span>
                                                <span className="truncate max-w-[200px]">{ref.topic}{ref.subtopic && ref.subtopic !== ref.topic ? ` • ${ref.subtopic}` : ""}</span>
                                                {ref.concept_type && (
                                                    <span className="text-[10px] bg-white px-1.5 py-0.5 rounded text-slate-600 border border-blue-100">
                                                        {ref.concept_type}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Feedback Rating Bar */}
                            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                                <span className="text-[11px]">
                                    {language === "ta" ? "பயனுள்ளதா?" : "Was this helpful?"}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={handleLike}
                                        disabled={!!voteType}
                                        className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all ${
                                            voteType === 'good'
                                                ? 'bg-blue-50 text-[#1e3a8a] font-bold border border-blue-200'
                                                : voteType === 'bad'
                                                    ? 'text-slate-300 cursor-not-allowed'
                                                    : 'hover:bg-slate-100 text-slate-500 hover:text-[#1e3a8a]'
                                        }`}
                                    >
                                        <ThumbsUp size={12} />
                                        <span>{language === "ta" ? "ஆம்" : "Yes"}</span>
                                    </button>

                                    <button
                                        onClick={handleDislike}
                                        disabled={!!voteType}
                                        className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all ${
                                            voteType === 'bad'
                                                ? 'bg-red-50 text-red-700 font-bold border border-red-200'
                                                : voteType === 'good'
                                                    ? 'text-slate-300 cursor-not-allowed'
                                                    : 'hover:bg-slate-100 text-slate-500 hover:text-red-600'
                                        }`}
                                    >
                                        <ThumbsDown size={12} />
                                        <span>{language === "ta" ? "இல்லை" : "No"}</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default MessageBubble;




