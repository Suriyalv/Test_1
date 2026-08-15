import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot, FileText, Download, ThumbsUp, ThumbsDown } from 'lucide-react'; // Updated import
import StructuredResponse from '../StructuredResponse';
import { sendLike, sendDislike } from '../api';

const MessageBubble = ({ message }) => {
    const isUser = message.role === 'user';
    const [voteType, setVoteType] = React.useState(null); // 'good', 'bad', or null

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

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            <div className={`flex max-w-[calc(90%+100px)] md:max-w-[calc(80%+100px)] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-xl hidden md:flex items-center justify-center shadow-md ${isUser ? 'bg-blue-100 text-black border border-blue-300' : 'bg-blue-50 text-black border border-blue-300'
                    }`}>
                    {isUser ? <User size={16} className="text-black" /> : <Bot size={18} className="text-black" />}
                </div>

                {/* Bubble */}
                <div
                    className={`px-5 py-4 rounded-2xl text-sm md:text-base leading-relaxed overflow-hidden transition-all duration-300 ${isUser
                        ? 'bg-blue-100 text-black border border-blue-300 shadow-md rounded-tr-none'
                        : 'bg-white text-black border border-gray-300 shadow-md rounded-tl-none'
                        }`}
                >
                    {isUser ? (
                        <div className="font-medium text-black">{message.content}</div>
                    ) : (
                        <>
                            <StructuredResponse text={message.content} />
                            
                            {/* Feedback Icons */}
                            <div className="mt-3 flex items-center gap-3 border-t border-gray-200 pt-2">
                                <button 
                                    onClick={handleLike}
                                    disabled={!!voteType}
                                    className={`p-1.5 rounded-lg transition-all ${
                                        voteType === 'good' 
                                            ? 'bg-blue-100 text-black border border-blue-400 scale-110 shadow-sm' 
                                            : voteType === 'bad' 
                                                ? 'text-gray-400 cursor-default'
                                                : 'text-black hover:bg-blue-50 hover:text-blue-600'
                                    }`}
                                    title="Like"
                                >
                                    <ThumbsUp size={16} />
                                </button>
                                <button 
                                    onClick={handleDislike}
                                    disabled={!!voteType}
                                    className={`p-1.5 rounded-lg transition-all ${
                                        voteType === 'bad' 
                                            ? 'bg-red-100 text-black border border-red-300 scale-110 shadow-sm' 
                                            : voteType === 'good'
                                                ? 'text-gray-400 cursor-default'
                                                : 'text-black hover:bg-gray-100 hover:text-black'
                                    }`}
                                    title="Dislike"
                                >
                                    <ThumbsDown size={16} />
                                </button>
                            </div>
                        </>
                    )}

                    {/* Images */}
                    {!isUser && message.images && message.images.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-100 w-full">
                            <p className="text-xs text-black mb-3 font-semibold uppercase tracking-wider flex items-center gap-1">
                                <FileText size={12} className="text-black" /> Visual Aids
                            </p>
                            <div className="flex flex-col gap-4">
                                {message.images.map((img, idx) => (
                                    <div key={idx} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                                        <img 
                                            src={img.url} 
                                            alt={img.name} 
                                            className="w-full h-auto object-contain bg-white"
                                            onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/400x200?text=Image+Not+Found'; }}
                                        />
                                        {img.description && (
                                            <div className="p-3">
                                                <p className="text-xs text-black leading-relaxed italic">
                                                    {img.description}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Files */}
                    {!isUser && message.files && message.files.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-100 w-full">
                            <p className="text-xs text-black mb-2 font-semibold uppercase tracking-wider flex items-center gap-1">
                                <FileText size={12} className="text-black" /> Referenced Papers
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {message.files.map((file, idx) => (
                                    <a
                                        key={idx}
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-gray-100 text-black rounded-lg text-xs font-medium hover:bg-gray-200 transition-all border border-gray-300 group"
                                    >
                                        <span className="truncate max-w-[150px] text-black">{file.name}</span>
                                        <span className="p-1 bg-white rounded-md border border-gray-200 text-black transition-colors">
                                            <Download size={10} className="text-black" />
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default MessageBubble;
