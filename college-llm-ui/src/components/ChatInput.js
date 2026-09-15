import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Mic, MicOff, BookOpen, Sparkles } from 'lucide-react';

const ChatInput = ({ onSend, loading, language = "en" }) => {
    const [input, setInput] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [micSupported, setMicSupported] = useState(false);
    const recognitionRef = useRef(null);

    const subjects = language === "ta" ? [
        { id: "Machine Learning (22IST61)", label: "இயந்திரக் கற்றல் (ML)" },
        { id: "JAVA PROGRAMMING (24IST31)", label: "ஜாவா நிரலாக்கம் (Java)" },
        { id: "OPERATING SYSTEMS (22IST34)", label: "இயக்க முறைமை (OS)" },
        { id: "Cryptography and Network Security (22IST62)", label: "கணினி வலையமைப்பு (CNS)" },
        { id: "C# and .NET Technologies (22ISC61)", label: "C# & .NET" },
        { id: "DATA STRUCTURES (24IST32)", label: "தரவு கட்டமைப்புகள் (DSA)" },
        { id: "UNIX AND SHELL PROGRAMMING (24ISC31)", label: "யுனிக்ஸ் நிரலாக்கம் (USP)" },
        { id: "Internet of Things and Cloud Computing (22ISC62)", label: "ஐஓடி & கிளவுட் (IoT)" },
        { id: "COMPUTER ORGANIZATION (22IST24)", label: "கணினி அமைப்பு (CO)" }
    ] : [
        { id: "Machine Learning (22IST61)", label: "Machine Learning (ML)" },
        { id: "JAVA PROGRAMMING (24IST31)", label: "Java Programming" },
        { id: "OPERATING SYSTEMS (22IST34)", label: "Operating Systems (OS)" },
        { id: "Cryptography and Network Security (22IST62)", label: "Cryptography (CNS)" },
        { id: "C# and .NET Technologies (22ISC61)", label: "C# & .NET" },
        { id: "DATA STRUCTURES (24IST32)", label: "Data Structures (DSA)" },
        { id: "UNIX AND SHELL PROGRAMMING (24ISC31)", label: "Unix Programming" },
        { id: "Internet of Things and Cloud Computing (22ISC62)", label: "IoT & Cloud" },
        { id: "COMPUTER ORGANIZATION (22IST24)", label: "Computer Organization" }
    ];

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            setMicSupported(true);
        }
    }, []);

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
            alert(language === "ta" 
                ? "உங்கள் உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை. Chrome அல்லது Edge-ஐப் பயன்படுத்தவும்."
                : "Voice input is not supported in this browser. Please use Chrome or Edge.");
            return;
        }

        if (isListening) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsListening(false);
            return;
        }

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
                alert(language === "ta"
                    ? "மைக்ரோஃபோன் அனுமதி தேவை."
                    : "Microphone access denied.");
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-[#e5e5e5] px-4 py-3 z-30 shadow-[0_-6px_25px_-10px_rgba(0,0,0,0.06)]">
            <div className="max-w-3xl mx-auto flex flex-col gap-2">

                {/* Subject Selector & Live Listening Indicator */}
                <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 bg-[#f7f9fa] border-2 border-[#e5e5e5] px-3 py-1 rounded-xl">
                        <BookOpen size={13} className="text-[#58cc02]" />
                        <span className="font-extrabold text-[11px] text-[#777] uppercase">
                            {language === "ta" ? "பாடம்:" : "Subject:"}
                        </span>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="bg-transparent text-[#3c3c3c] text-xs font-black outline-none cursor-pointer"
                        >
                            <option value="">{language === "ta" ? "அனைத்துப் பாடங்கள் (General)" : "General Academic"}</option>
                            {subjects.map(sub => (
                                <option key={sub.id} value={sub.id}>
                                    {sub.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        {isListening && (
                            <div className="flex items-center gap-1.5 text-red-600 text-xs font-black animate-pulse bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-lg">
                                <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                                <span>{language === "ta" ? "குரல் கேட்கிறது..." : "Listening..."}</span>
                            </div>
                        )}
                        <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-[#777]">
                            <Sparkles size={12} className="text-yellow-500 fill-yellow-400" />
                            <span>{language === "ta" ? "+15 மணிகள் / கேள்வி" : "+15 Gems per inquiry"}</span>
                        </div>
                    </div>
                </div>

                {/* 3D Tactile Input Box */}
                <div className="relative flex items-center bg-white border-2 border-[#e5e5e5] focus-within:border-[#58cc02] rounded-2xl p-1.5 shadow-sm transition-all">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                        placeholder={language === "ta"
                            ? "உங்கள் பாடச் சந்தேகத்தை இங்கே கேட்கவும் அல்லது பேசவும்..."
                            : "Ask any curriculum doubt or use voice dictation..."}
                        className="w-full pl-4 pr-28 py-2.5 bg-transparent text-[#3c3c3c] placeholder-[#999] focus:outline-none text-[14.5px] font-bold"
                    />

                    {/* Action Controls */}
                    <div className="absolute right-2 flex items-center gap-1.5">
                        {/* Mic Voice Dictation */}
                        {micSupported && (
                            <button
                                onClick={toggleMic}
                                disabled={loading}
                                type="button"
                                title={isListening ? "Stop" : "Voice Input"}
                                className={`btn-3d btn-3d-white p-2 rounded-xl flex items-center justify-center ${
                                    isListening
                                        ? "bg-red-500 text-white border-red-700 animate-pulse"
                                        : "text-[#777]"
                                }`}
                            >
                                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                            </button>
                        )}

                        {/* 3D Send Button */}
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            type="button"
                            className="btn-3d btn-3d-green px-4 py-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 text-xs font-black shadow-sm"
                            title="Send"
                        >
                            {loading ? (
                                <Loader2 size={15} className="animate-spin" />
                            ) : (
                                <>
                                    <Send size={14} />
                                    <span>{language === "ta" ? "கேள்" : "Ask"}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer Disclaimer */}
                <div className="text-center">
                    <p className="text-[10px] font-bold text-[#999]">
                        {language === "ta"
                            ? "கல்வி AI • தமிழ்நாடு பாடத்திட்டம் மற்றும் மாதிரித் தேர்வு வழிகாட்டி"
                            : "Tamil Nadu Academic AI • Socratic Guidance & Curriculum Reasoning"}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChatInput;
