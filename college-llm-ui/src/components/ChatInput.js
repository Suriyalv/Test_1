import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Mic, MicOff, BookOpen } from 'lucide-react';

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
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-brand-100 px-4 py-3 z-30">
            <div className="max-w-4xl mx-auto flex flex-col gap-2">

                {/* Subject Selector & Mic Indicator */}
                <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                        <BookOpen size={13} className="text-brand-600" />
                        <span className="font-semibold text-[11px] text-slate-500">
                            {language === "ta" ? "பாடம்:" : "Subject:"}
                        </span>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="bg-brand-50 text-slate-800 text-xs rounded-full border border-brand-200 focus:border-brand-500 px-2.5 py-1 outline-none cursor-pointer font-medium"
                        >
                            <option value="">{language === "ta" ? "அனைத்து பாடங்கள் (General)" : "General Academic"}</option>
                            {subjects.map(sub => (
                                <option key={sub.id} value={sub.id}>
                                    {sub.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {isListening && (
                        <div className="flex items-center gap-1.5 text-red-600 text-xs font-semibold animate-pulse">
                            <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                            <span>{language === "ta" ? "கேட்கிறது..." : "Listening..."}</span>
                        </div>
                    )}
                </div>

                {/* Main Input Box */}
                <div className="relative flex items-center">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                        placeholder={language === "ta"
                            ? "உங்கள் கேள்வியை இங்கே தட்டச்சு செய்யவும் அல்லது பேசவும்..."
                            : "Ask any subject question or use voice..."}
                        className="w-full pl-4 pr-24 py-3 bg-brand-50/60 border-2 border-brand-200 rounded-full text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200 text-sm font-medium transition-all"
                    />

                    {/* Action Controls */}
                    <div className="absolute right-1.5 flex items-center gap-1">
                        {/* Mic Voice Dictation */}
                        {micSupported && (
                            <button
                                onClick={toggleMic}
                                disabled={loading}
                                type="button"
                                title={isListening ? "Stop" : "Voice Input"}
                                className={`p-2 rounded-full transition-all ${
                                    isListening
                                        ? "bg-red-600 text-white animate-pulse"
                                        : "text-slate-500 hover:bg-brand-100 hover:text-brand-600"
                                }`}
                            >
                                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                            </button>
                        )}

                        {/* Send Button */}
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            type="button"
                            className="p-2 sm:px-3.5 sm:py-2 bg-gradient-to-r from-brand-600 to-cyan-600 hover:brightness-110 text-white rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 text-xs font-semibold shadow-pop active:scale-95"
                            title="Send"
                        >
                            {loading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <>
                                    <Send size={15} />
                                    <span className="hidden sm:inline">{language === "ta" ? "அனுப்பு" : "Send"}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer Disclaimer */}
                <div className="text-center">
                    <p className="text-[10px] text-slate-400">
                        {language === "ta"
                            ? "கல்வி AI • ஸ்மார்ட் கற்றல் மற்றும் தேர்வு வழிகாட்டி"
                            : "AI Educational Learning & Assessment Platform"}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChatInput;




