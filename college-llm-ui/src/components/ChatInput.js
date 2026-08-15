import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Mic, MicOff } from 'lucide-react';

const ChatInput = ({ onSend, loading, language = "en" }) => {
    const [input, setInput] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [micSupported, setMicSupported] = useState(false);
    const recognitionRef = useRef(null);

    const subjects = [
        { id: "Machine Learning (22IST61)", label: "Machine Learning" },
        { id: "JAVA PROGRAMMING (24IST31)", label: "Java Programming" },
        { id: "OPERATING SYSTEMS (22IST34)", label: "Operating Systems" },
        { id: "Cryptography and Network Security (22IST62)", label: "CNS" },
        { id: "C# and .NET Technologies (22ISC61)", label: "C# & .NET" },
        { id: "DATA STRUCTURES (24IST32)", label: "Data Structures" },
        { id: "UNIX AND SHELL PROGRAMMING (24ISC31)", label: "USP" },
        { id: "Internet of Things and Cloud Computing (22ISC62)", label: "IOT" },
        { id: "COMPUTER ORGANIZATION (22IST24)", label: "Computer Organization" }
    ];

    // Check if SpeechRecognition is supported
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            setMicSupported(true);
        }
    }, []);

    // Stop recognition if language changes mid-session
    useEffect(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language]);

    const handleSend = () => {
        if (input.trim() && !loading) {
            onSend(input, selectedSubject);
            setInput("");
        }
    };

    const toggleMic = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
            return;
        }

        if (isListening) {
            // Stop listening
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsListening(false);
            return;
        }

        // Start listening
        const recognition = new SpeechRecognition();
        recognition.lang = language === "ta" ? "ta-IN" : "en-US";
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            setInput(transcript);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
            if (event.error === "not-allowed") {
                alert("Microphone access denied. Please allow microphone permissions in your browser.");
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white text-black border-t border-gray-200 px-4 py-4 md:px-8 md:py-6 z-20 shadow-lg">
            <div className="max-w-[868px] mx-auto relative group flex flex-col gap-3">
                {/* Subject Dropdown */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-black uppercase tracking-wider shrink-0">RAG Context:</span>
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="bg-gray-50 text-black text-xs font-semibold rounded-xl border border-gray-300 focus:border-blue-600 block w-full p-2.5 outline-none shadow-sm transition-all"
                    >
                        <option value="">General Chat</option>
                        {subjects.map(sub => (
                            <option key={sub.id} value={sub.id}>
                                {sub.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Listening indicator */}
                {isListening && (
                    <div className="flex items-center gap-2 text-black text-xs font-bold animate-pulse">
                        <span className="w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                        {language === "ta" ? "கேட்கிறோம்... பேசுங்கள்" : "Listening to voice input... Speak now"}
                    </div>
                )}

                <div className="relative">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder={language === "ta" ? "ஒரு கேள்வி கேளுங்கள்..." : "Ask a question..."}
                        className="w-full pl-6 pr-28 py-4 bg-gray-50 border border-gray-300 rounded-2xl text-black placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-md text-base transition-all font-medium"
                    />

                    {/* Right side buttons: Mic + Send */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {/* Mic Button */}
                        {micSupported && (
                            <button
                                onClick={toggleMic}
                                disabled={loading}
                                title={isListening ? "Stop listening" : (language === "ta" ? "குரல் உள்ளீடு" : "Voice input")}
                                className={`p-2.5 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    isListening
                                        ? "bg-blue-600 text-white animate-pulse"
                                        : "bg-gray-100 text-black hover:bg-gray-200 border border-gray-300"
                                }`}
                            >
                                {isListening ? <MicOff size={18} /> : <Mic size={18} className="text-black" />}
                            </button>
                        )}

                        {/* Send Button */}
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Send size={18} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
            <div className="text-center mt-2">
                <p className="text-[10px] text-black font-medium tracking-wide">
                    {language === "ta"
                        ? "AI தவறு செய்யலாம். முக்கியமான தகவல்களை சரிபார்க்கவும்."
                        : "AI can make mistakes. Please verify important information."
                    }
                </p>
            </div>
        </div>
    );
};

export default ChatInput;
