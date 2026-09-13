import { useState, useEffect } from "react";
import { chatWithAI } from "./api";
import ChatContainer from "./components/ChatContainer";
import MessageBubble from "./components/MessageBubble";
import ChatInput from "./components/ChatInput";
import TypingAnimation from "./components/TypingAnimation";
import UserResponse from "./UserResponse";
import TestModule from "./components/TestTaking/TestModule";
import FlashcardModule from "./components/Flashcards/FlashcardModule";
import MindMapModule from "./components/MindMap/MindMapModule";
import KahootModule from "./components/Kahoot/KahootModule";
import FloatingMascotBot from "./components/FloatingMascotBot";
import HomePage from "./components/Home/HomePage";
import PageLoader from "./components/Loader/PageLoader";
import "./index.css";
import {
  Trash2,
  Languages,
  GraduationCap,
  BarChart3,
  Sparkles,
  Layers,
  Network,
  Home,
  Trophy,
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
  // Starts true so the loading page covers the very first paint, then every
  // route change raises it again until the new screen has mounted.
  const [navigating, setNavigating] = useState(true);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "ta" : "en"));
  };

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  // Handle URL changes
  useEffect(() => {
    const handleLocationChange = () => {
      setNavigating(true);
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  // The screen for this path has now mounted, so the loading page can lift.
  // PageLoader still honours its own minimum, so this never flickers.
  useEffect(() => {
    setNavigating(false);
  }, [currentPath]);

  const navigateTo = (path) => {
    if (path === currentPath) return;
    setNavigating(true);
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };

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

  const chatScreen = (
    <div className="bg-[#faf8ff] min-h-screen font-sans text-slate-900 flex flex-col selection:bg-brand-600 selection:text-white">
      {/* Top Header Accent Strip (official branding) */}
      <div className="tngov-tricolor-strip fixed top-0 left-0 right-0 z-50"></div>

      {/* Playful Header */}
      <header className="fixed top-[3px] left-0 right-0 bg-white/95 backdrop-blur-md border-b border-brand-100 z-40">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">

          {/* Title & Branding */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-brand-600 to-cyan-500 text-white flex items-center justify-center shadow-pop">
              <Sparkles size={18} />
            </div>
            <div className="hidden md:block">
              <div className="text-[10px] font-bold text-brand-600 tracking-wide uppercase whitespace-nowrap">
                {language === "ta" ? "கல்வி AI • கற்றல் & திறன் தளம்" : "AI Academic Learning & Examination"}
              </div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight font-display whitespace-nowrap">
                {language === "ta" ? "ஸ்மார்ட் AI கல்வி வழிகாட்டி" : "Smart AI Educational Portal"}
              </h1>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            {/* Nav: Home */}
            <button
              onClick={() => navigateTo("/")}
              className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl border border-brand-100 bg-brand-50 px-2.5 font-semibold text-xs sm:text-sm text-brand-700 transition-all hover:border-brand-300 hover:bg-brand-100 active:scale-95"
              title="Home"
            >
              <Home size={15} />
              <span className="hidden sm:inline">
                {language === "ta" ? "முகப்பு" : "Home"}
              </span>
            </button>

            {/* Nav: Test Taking */}
            <button
              onClick={() => navigateTo("/test")}
              className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 px-2.5 font-semibold text-xs sm:text-sm text-white shadow-pop transition-all hover:brightness-110 active:scale-95"
              title="Test Portal"
            >
              <GraduationCap size={15} />
              <span className="hidden sm:inline">
                {language === "ta" ? "தேர்வு போர்ட்டல்" : "Test Portal"}
              </span>
            </button>

            {/* Nav: Flashcards */}
            <button
              onClick={() => navigateTo("/flashcards")}
              className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-2.5 font-semibold text-xs sm:text-sm text-slate-700 transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600 active:scale-95"
              title="Concept Flashcards"
            >
              <Layers size={15} />
              <span className="hidden sm:inline">
                {language === "ta" ? "அட்டைகள்" : "Flashcards"}
              </span>
            </button>

            {/* Nav: Mind Map */}
            <button
              onClick={() => navigateTo("/mindmap")}
              className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-2.5 font-semibold text-xs sm:text-sm text-slate-700 transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95"
              title="Concept Mind Map"
            >
              <Network size={15} />
              <span className="hidden sm:inline">
                {language === "ta" ? "வரைபடம்" : "Mind Map"}
              </span>
            </button>

            {/* Nav: Live Quiz (Kahoot-style) */}
            <button
              onClick={() => navigateTo("/kahoot")}
              className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-2.5 font-semibold text-xs sm:text-sm text-slate-700 transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
              title="Live Quiz Arena"
            >
              <Trophy size={15} />
              <span className="hidden sm:inline">
                {language === "ta" ? "வினாடி வினா" : "Live Quiz"}
              </span>
            </button>

            {/* Nav: Feedback Insights */}
            <button
              onClick={() => navigateTo("/userresponse")}
              className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-slate-100 px-2.5 font-semibold text-xs sm:text-sm text-slate-700 transition-all hover:bg-slate-200 hover:text-brand-700"
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
              className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl border border-brand-200 bg-brand-50 px-2.5 font-bold text-xs sm:text-sm text-brand-700 transition-all hover:bg-brand-100 active:scale-95"
            >
              <Languages size={14} />
              <span className="hidden sm:inline">{language === "en" ? "English (EN)" : "தமிழ் (TA)"}</span>
            </button>

            {/* Clear Chat */}
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-500 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
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
                /* Vibrant Welcome State */
                <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-500 via-sky-400 to-cyan-400 text-white flex items-center justify-center mb-4 shadow-pop-lg animate-pop-in">
                    <Sparkles size={30} />
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-display">
                    {language === "ta"
                      ? "வணக்கம் மாணவரே! எதைப் பற்றி அறிய விரும்புகிறீர்கள்?"
                      : "Welcome Student! What would you like to explore today?"}
                  </h2>

                  <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed max-w-md">
                    {language === "ta"
                      ? "பாடப் புத்தக தலைப்புகள், அறிவியல் விதிகள் மற்றும் மாதிரித் தேர்வுகளுக்கான AI வழிகாட்டி."
                      : "Curriculum concepts, textbook explanations, and exam preparation tutor."}
                  </p>

                  {/* Vibrant Suggestion Pills */}
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
                        className="px-3.5 py-1.5 bg-white hover:bg-brand-50 text-slate-700 hover:text-brand-700 border border-slate-200 hover:border-brand-300 rounded-full text-xs font-medium transition-all shadow-sm hover:shadow-pop flex items-center gap-1.5 active:scale-95 hover:-translate-y-0.5"
                      >
                        <Sparkles size={12} className="text-brand-500" />
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
                      <div className="bg-white border border-brand-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2.5 text-slate-800">
                        <TypingAnimation />
                        <span className="text-xs text-brand-600 font-semibold">
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

  // Which screen this path shows. "/" is the platform home page; the chat that
  // used to live there now has its own route at "/chat".
  let screen;
  if (currentPath === "/chat") {
    screen = chatScreen;
  } else if (currentPath === "/userresponse") {
    screen = <UserResponse onBackToChat={() => navigateTo("/chat")} language={language} />;
  } else if (currentPath === "/test") {
    screen = <TestModule onBackToChat={() => navigateTo("/chat")} initialLanguage={language} />;
  } else if (currentPath === "/flashcards") {
    screen = <FlashcardModule onBackToChat={() => navigateTo("/chat")} initialLanguage={language} />;
  } else if (currentPath === "/mindmap") {
    screen = <MindMapModule onBackToChat={() => navigateTo("/chat")} initialLanguage={language} />;
  } else if (currentPath === "/kahoot") {
    screen = <KahootModule onBackToChat={() => navigateTo("/chat")} initialLanguage={language} />;
  } else {
    screen = (
      <HomePage
        onNavigate={navigateTo}
        language={language}
        onToggleLanguage={toggleLanguage}
      />
    );
  }

  return (
    <>
      <PageLoader active={navigating} language={language} />
      {screen}
    </>
  );
}

export default App;

