import { useState, useEffect } from "react";
import { chatWithAI } from "./api";
import ChatContainer from "./components/ChatContainer";
import MessageBubble from "./components/MessageBubble";
import ChatInput from "./components/ChatInput";
import TypingAnimation from "./components/TypingAnimation";
import UserResponse from "./UserResponse";
import TestModule from "./components/TestTaking/TestModule";
import FloatingMascotBot from "./components/FloatingMascotBot";
import "./index.css";
import {
  Trash2,
  Languages,
  GraduationCap,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function App() {
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [language, setLanguage] = useState("en"); // Default English

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "ta" : "en"));
  };

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  // Handle URL changes
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };

  if (currentPath === "/userresponse") {
    return <UserResponse onBackToChat={() => navigateTo("/")} language={language} />;
  }

  if (currentPath === "/test") {
    return <TestModule onBackToChat={() => navigateTo("/")} initialLanguage={language} />;
  }

  const sendMessage = async (input, selectedSubject) => {
    if (!input.trim()) return;

    const userMessage = { 
      role: "user", 
      content: input,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const data = await chatWithAI(input, messages, selectedSubject, language);

      const botMessage = {
        role: "assistant",
        content: data.response || (language === "ta" ? "பதில் கிடைக்கவில்லை." : "⚠️ Received empty response"),
        references: data.references || [],
        files: data.files || [],
        images: data.images || [],
        prompt: input,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Fetch error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: language === "ta"
            ? "⚠️ சேவையகத்தை தொடர்பு கொள்ள முடியவில்லை. தயவுசெய்து உங்கள் இணைய இணைப்பை சரிபார்க்கவும்."
            : "⚠️ Server not reachable. Please check your backend connection.",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }

    setLoading(false);
  };

  const clearChat = () => {
    const confirmText = language === "ta"
      ? "உரையாடல் வரலாற்றை அழிக்க நிச்சயமாக விரும்புகிறீர்களா?"
      : "Are you sure you want to clear the chat?";
    if (window.confirm(confirmText)) {
      setMessages([]);
      localStorage.removeItem("chatMessages");
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Header Accent Strip */}
      <div className="tngov-tricolor-strip fixed top-0 left-0 right-0 z-50"></div>

      {/* Clean Minimal Header */}
      <header className="fixed top-[3px] left-0 right-0 bg-white/95 backdrop-blur-md border-b border-slate-200 z-40">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          
          {/* Title & Branding */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1e3a8a] border border-blue-100 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#1e3a8a] tracking-wide uppercase">
                {language === "ta" ? "கல்வி AI • கற்றல் & திறன் தளம்" : "AI Academic Learning & Examination"}
              </div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                {language === "ta" ? "ஸ்மார்ட் AI கல்வி வழிகாட்டி" : "Smart AI Educational Portal"}
              </h1>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            {/* Nav: Test Taking */}
            <button
              onClick={() => navigateTo("/test")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-lg transition-all font-semibold text-xs sm:text-sm shadow-xs active:scale-95"
              title="Test Portal"
            >
              <GraduationCap size={15} />
              <span>
                {language === "ta" ? "தேர்வு போர்ட்டல்" : "Test Portal"}
              </span>
            </button>

            {/* Nav: Feedback Insights */}
            <button
              onClick={() => navigateTo("/userresponse")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#1e3a8a] border border-slate-200 rounded-lg transition-all font-semibold text-xs sm:text-sm"
              title="Feedback"
            >
              <BarChart3 size={15} />
              <span className="hidden sm:inline">
                {language === "ta" ? "பின்னூட்டம்" : "Feedback"}
              </span>
            </button>

            {/* Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              title={language === "en" ? "தமிழுக்கு மாற்றவும்" : "Switch to English"}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1e3a8a] border border-blue-200 rounded-lg transition-all font-bold text-xs sm:text-sm active:scale-95"
            >
              <Languages size={14} />
              <span>{language === "en" ? "English (EN)" : "தமிழ் (TA)"}</span>
            </button>

            {/* Clear Chat */}
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="p-1.5 sm:p-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-500 border border-slate-200 rounded-lg transition-all"
                title={language === "ta" ? "உரையாடலை அழிக்க" : "Clear Chat"}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pt-20 pb-36 max-w-4xl mx-auto w-full px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChatContainer>
              {messages.length === 0 ? (
                /* Simple, Neat & Minimal Welcome State */
                <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#1e3a8a] flex items-center justify-center mb-4 shadow-xs">
                    <Sparkles size={24} className="text-[#2563eb]" />
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {language === "ta"
                      ? "வணக்கம் மாணவரே! எதைப் பற்றி அறிய விரும்புகிறீர்கள்?"
                      : "Welcome Student! What would you like to explore today?"}
                  </h2>

                  <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed max-w-md">
                    {language === "ta"
                      ? "பாடப் புத்தக தலைப்புகள், அறிவியல் விதிகள் மற்றும் மாதிரித் தேர்வுகளுக்கான AI வழிகாட்டி."
                      : "Curriculum concepts, textbook explanations, and exam preparation tutor."}
                  </p>

                  {/* Clean Minimal Suggestion Pills */}
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    {[
                      language === "ta" ? "💻 பைதான் கட்டுப்பாட்டு கட்டமைப்புகள்" : "💻 Python Control Structures",
                      language === "ta" ? "🗄️ தரவுத்தள மேலாண்மை அமைப்பு (DBMS)" : "🗄️ DBMS vs File System",
                      language === "ta" ? "🔢 குமிழி வரிசையாக்கம் (Bubble Sort)" : "🔢 Bubble Sort Algorithm",
                      language === "ta" ? "🔑 முதன்மை மற்றும் வெளிச் சாவி" : "🔑 Primary vs Foreign Key"
                    ].map((pill, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(pill, "")}
                        className="px-3.5 py-1.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-[#1e3a8a] border border-slate-200 hover:border-blue-300 rounded-full text-xs font-medium transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                      >
                        <Sparkles size={12} className="text-[#2563eb]" />
                        <span>{pill}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {messages.map((msg, i) => (
                    <MessageBubble key={i} message={msg} language={language} />
                  ))}
                  {loading && (
                    <div className="flex justify-start mb-6 w-full">
                      <div className="bg-white border border-blue-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-2.5 text-slate-800">
                        <TypingAnimation />
                        <span className="text-xs text-[#1e3a8a] font-semibold">
                          {language === "ta" ? "AI பதிலளிக்கிறது..." : "AI is responding..."}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ChatContainer>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Chat Input */}
      <ChatInput onSend={sendMessage} loading={loading} language={language} />

      {/* Floating Cartoon Mascot Hint Bot (Kalvi Mithran) */}
      <FloatingMascotBot language={language} />
    </div>
  );
}

export default App;

