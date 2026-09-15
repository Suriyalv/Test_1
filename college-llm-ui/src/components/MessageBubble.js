import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, FileText, Download, ThumbsUp, ThumbsDown, Copy, Check, Volume2, VolumeX, Sparkles, BookOpen, Lightbulb, HelpCircle, Code2, ListChecks } from 'lucide-react';
import StructuredResponse from '../StructuredResponse';
import { sendLike, sendDislike } from '../api';

const MessageBubble = ({ message, language = "en", onSendFollowUp }) => {
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
                <div className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full ${
                    isUser
                        ? 'bg-[#007AFF] text-white shadow-sm'
                        : 'bg-black text-white shadow-apple-sm'
                }`}>
                    {isUser ? (
                        <User size={15} />
                    ) : (
                        <Sparkles size={15} />
                    )}
                </div>

                {/* Message Bubble Container */}
                <div
                    className={`flex-1 rounded-[20px] p-4 text-[14.5px] leading-relaxed ${
                        isUser
                            ? 'bg-[#007AFF] text-white rounded-tr-sm shadow-sm max-w-[85%]'
                            : 'bg-white text-zinc-800 border border-zinc-200 rounded-tl-sm shadow-apple-sm'
                    }`}
                >
                    {/* Header bar on AI Message */}
                    {!isUser && (
                        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-zinc-100">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-semibold text-zinc-500 tracking-wider uppercase flex items-center gap-1">
                                    <Sparkles size={12} className="text-[#007AFF]" />
                                    {language === "ta" ? "AI கல்வி உதவியாளர்" : "AI Assistant"}
                                </span>
                            </div>

                            {/* Read Aloud & Copy */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={toggleSpeech}
                                    className={`p-1 rounded text-xs font-medium transition-colors ${
                                        isSpeaking 
                                            ? 'bg-blue-50 text-[#007AFF] animate-pulse'
                                            : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
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
                                <div className="mt-3 pt-2.5 border-t border-zinc-100 w-full">
                                    <p className="text-xs text-zinc-500 mb-1.5 font-semibold uppercase tracking-wider flex items-center gap-1">
                                        <FileText size={12} className="text-[#007AFF]" />
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
                                <div className="mt-3 pt-2.5 border-t border-zinc-100 w-full">
                                    <p className="text-xs text-zinc-500 mb-1.5 font-semibold uppercase tracking-wider flex items-center gap-1">
                                        <FileText size={12} className="text-[#007AFF]" />
                                        {language === "ta" ? "மேற்கோள்கள் (References)" : "References"}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {message.files.map((file, idx) => (
                                            <a
                                                key={idx}
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-50 text-zinc-700 rounded-md text-[13px] font-medium hover:bg-zinc-100 transition-all border border-zinc-200 group"
                                            >
                                                <span className="truncate max-w-[160px]">{file.name}</span>
                                                <Download size={11} className="text-zinc-400 group-hover:text-zinc-600" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Curriculum & Textbook References */}
                            {message.references && message.references.length > 0 && (
                                <div className="mt-3 pt-2.5 border-t border-zinc-100 w-full">
                                    <p className="text-[11px] text-zinc-400 mb-1.5 font-semibold uppercase tracking-wider flex items-center gap-1">
                                        <BookOpen size={12} className="text-[#007AFF]" />
                                        {language === "ta" ? "பாடத்திட்ட மேற்கோள் (Curriculum Sources)" : "Textbook References"}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {message.references.map((ref, idx) => (
                                            <div
                                                key={idx}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 border border-zinc-200 rounded-md text-xs text-zinc-600 font-medium"
                                            >
                                                <span className="font-bold">Ch {ref.chapter_no}:</span>
                                                <span className="truncate max-w-[200px]">{ref.topic}{ref.subtopic && ref.subtopic !== ref.topic ? ` • ${ref.subtopic}` : ""}</span>
                                                {ref.concept_type && (
                                                    <span className="text-[10px] bg-white px-1.5 py-0.5 rounded text-slate-600 border border-brand-100">
                                                        {ref.concept_type}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Interactive Follow-Up Chips */}
                            {onSendFollowUp && (
                                <div className="mt-3.5 pt-3 border-t border-zinc-100">
                                    <p className="text-[11px] text-zinc-400 mb-2 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                        <Sparkles size={12} className="text-[#58cc02]" />
                                        <span>{language === "ta" ? "தொடர் வினாக்கள் (அழுத்தி உடனே கேளுங்கள்):" : "Suggested Follow-ups (Tap to ask):"}</span>
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => onSendFollowUp(
                                                language === "ta"
                                                    ? `இந்தக் கருத்தை சுயமாக தீர்க்க ஒரு எளிய குறிப்பு (Hint) தருக.`
                                                    : `Can you give me a guiding hint to solve problems on this concept myself?`
                                            )}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-[#378101] border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-all active:scale-95 shadow-2xs"
                                        >
                                            <Lightbulb size={12} className="text-[#58cc02]" />
                                            <span>{language === "ta" ? "குறிப்பு தேவை" : "Give me a hint"}</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => onSendFollowUp(
                                                language === "ta"
                                                    ? `இந்தக் கருத்தைப் பற்றி 2 வினாடி வினா கேள்விகளைக் (Quiz questions) கேட்டு என் புரிதலை சோதிக்கவும்.`
                                                    : `Quiz me on this topic with 2 practice questions to test my understanding.`
                                            )}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-50 text-[#1cb0f6] border border-sky-200 text-xs font-bold hover:bg-sky-100 transition-all active:scale-95 shadow-2xs"
                                        >
                                            <HelpCircle size={12} className="text-[#1cb0f6]" />
                                            <span>{language === "ta" ? "வினாடி வினா கேள்" : "Quiz me on this"}</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => onSendFollowUp(
                                                language === "ta"
                                                    ? `இதற்கான தெளிவான நிரல் எடுத்துக்காட்டு (Code example) மற்றும் படிமுறை விளக்கத்தை காட்டுங்கள்.`
                                                    : `Show a clear, commented code example explaining this concept.`
                                            )}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 text-[#af70e6] border border-purple-200 text-xs font-bold hover:bg-purple-100 transition-all active:scale-95 shadow-2xs"
                                        >
                                            <Code2 size={12} className="text-[#af70e6]" />
                                            <span>{language === "ta" ? "நிரல் காட்டு" : "Code example"}</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => onSendFollowUp(
                                                language === "ta"
                                                    ? `இந்த தலைப்பின் 3 முக்கிய குறிப்புகளை (Summary points) புல்லட்களாக வழங்கவும்.`
                                                    : `Give me a concise 3-bullet summary of the key takeaways for this concept.`
                                            )}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold hover:bg-amber-100 transition-all active:scale-95 shadow-2xs"
                                        >
                                            <ListChecks size={12} className="text-amber-600" />
                                            <span>{language === "ta" ? "முக்கிய சுருக்கம்" : "Key Summary"}</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Feedback Rating Bar */}
                            <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                                <span className="text-[11px]">
                                    {language === "ta" ? "பயனுள்ளதா?" : "Was this helpful?"}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={handleLike}
                                        disabled={!!voteType}
                                        className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all ${
                                            voteType === 'good'
                                                ? 'bg-zinc-100 text-[#007AFF] font-medium border border-zinc-200'
                                                : voteType === 'bad'
                                                    ? 'text-zinc-300 cursor-not-allowed'
                                                    : 'hover:bg-zinc-100 text-zinc-500 hover:text-[#007AFF]'
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
                                                ? 'bg-red-50 text-red-600 font-medium border border-red-200'
                                                : voteType === 'good'
                                                    ? 'text-zinc-300 cursor-not-allowed'
                                                    : 'hover:bg-zinc-100 text-zinc-500 hover:text-red-600'
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




