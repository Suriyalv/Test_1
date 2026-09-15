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
import AppHeader from "./components/Navigation/AppHeader";
import "./index.css";
import {
  Code,
  Database,
  ArrowDownUp,
  Bot,
  ArrowRight,
  Trophy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CURATED_PROMPTS = [
  {
    id: "py-loops",
    subject: "Machine Learning (22IST61)",
    icon: Code,
    en: {
      tag: "Python",
      prompt: "Explain Python Control Structures and Loops with syntax and practical examples.",
      label: "Python Loops & Control Structures"
    },
    ta: {
      tag: "பைத்தான்",
      prompt: "பைத்தானில் சுழற்சிகள் (Loops) மற்றும் கட்டுப்பாட்டு கட்டமைப்புகள் பற்றி எடுத்துக்காட்டுகளுடன் விளக்கு.",
      label: "பைத்தான் சுழற்சிகள் & கட்டமைப்புகள்"
    }
  },
  {
    id: "db-keys",
    subject: "OPERATING SYSTEMS (22IST34)",
    icon: Database,
    en: {
      tag: "DBMS & SQL",
      prompt: "What is the difference between Primary Key and Foreign Key in DBMS? Explain with table examples.",
      label: "Primary vs Foreign Key in DBMS"
    },
    ta: {
      tag: "தரவுத்தளம்",
      prompt: "முதன்மைச் சாவி மற்றும் வெளிச் சாவி இடையேயான வேறுபாடுகள் என்ன? அட்டவணை எடுத்துக்காட்டுடன் விளக்கு.",
      label: "முதன்மை vs வெளிச் சாவி வேறுபாடு"
    }
  },
  {
    id: "dsa-bubble",
    subject: "DATA STRUCTURES (24IST32)",
    icon: ArrowDownUp,
    en: {
      tag: "Algorithms",
      prompt: "How does the Bubble Sort algorithm work? Trace each pass step-by-step with an array example.",
      label: "Trace Bubble Sort Algorithm"
    },
    ta: {
      tag: "அல்காரிதம்",
      prompt: "குமிழி வரிசையாக்க அல்காரிதத்தின் படிமுறை செயல்பாட்டை அணி எடுத்துக்காட்டுடன் விளக்கு.",
      label: "குமிழி வரிசையாக்க படிமுறை விளக்கம்"
    }
  },
  {
    id: "quiz-general",
    subject: "",
    icon: Trophy,
    en: {
      tag: "Practice Quiz",
      prompt: "Give me 3 practice multiple-choice questions on Computer Science syllabus with answers and explanations.",
      label: "Test me on 3 Syllabus Questions"
    },
    ta: {
      tag: "வினாடி வினா",
      prompt: "கணினி அறிவியல் பாடத்திட்டத்திலிருந்து 3 பலவுள் தெரிவு வினாக்களைக் கேட்டு என் அறிவை சோதிக்கவும்.",
      label: "3 பாடத்திட்ட வினாடி வினா கேள்"
    }
  }
];

function App() {
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [language, setLanguage] = useState("en"); // Default English
  const [navigating, setNavigating] = useState(true);

  // Gamification sync
  const [streak] = useState(() => parseInt(localStorage.getItem("game_streak") || "4", 10));
  const [gems, setGems] = useState(() => parseInt(localStorage.getItem("game_gems") || "280", 10));
  const [hearts] = useState(() => parseInt(localStorage.getItem("game_hearts") || "5", 10));

  // Interactive Chat Mode
  const [chatMode, setChatMode] = useState("socratic"); // "socratic" | "direct" | "quiz"

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "ta" : "en"));
  };

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  const [navHistory, setNavHistory] = useState([window.location.pathname]);

  // Handle URL changes
  useEffect(() => {
    const handleLocationChange = () => {
      setNavigating(true);
      const newPath = window.location.pathname;
      setCurrentPath(newPath);
      setNavHistory((prev) => {
        if (prev.length > 1 && prev[prev.length - 2] === newPath) {
          return prev.slice(0, -1);
        }
        return [...prev, newPath];
      });
    };
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  // Screen transition settle
  useEffect(() => {
    setNavigating(false);
  }, [currentPath]);

  const navigateTo = (path) => {
    if (path === currentPath) return;
    setNavigating(true);
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    setNavHistory((prev) => [...prev, path]);
  };

  const handleBack = () => {
    if (navHistory.length > 1) {
      window.history.back();
    } else {
      navigateTo("/");
    }
  };

  const addGems = (amount = 20) => {
    const next = gems + amount;
    setGems(next);
    localStorage.setItem("game_gems", next.toString());
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
      addGems(15); // Reward gems for asking curriculum questions!
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
    <div className="flex-1 text-[#3c3c3c] flex flex-col selection:bg-emerald-200 selection:text-emerald-900">
      {/* ─── Main Chat Area ──────────────────────────────────────────────── */}
      <main className="flex-1 pt-4 pb-36 max-w-4xl mx-auto w-full px-4">
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
                /* ─── Neat, Professional & Uncluttered Conversational Area ─── */
                <div className="py-8 sm:py-12 flex flex-col items-center text-center max-w-xl mx-auto px-3">
                  
                  {/* Socratic Mascot Icon */}
                  <div className="relative mb-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#58cc02] to-[#378101] text-white flex items-center justify-center shadow-md border-b-2 border-[#2b6400]">
                      <Bot size={28} strokeWidth={2.5} />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </span>
                  </div>

                  {/* Clean Greeting Headline & Subtitle */}
                  <h2 className="text-xl sm:text-2xl font-black text-[#2b2b2b] tracking-tight">
                    {language === "ta"
                      ? "இன்று எதைக் கற்க விரும்புகிறீர்கள்?"
                      : "What would you like to master today?"}
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-[#777] mt-1.5 max-w-md leading-relaxed">
                    {language === "ta"
                      ? "பாடச் சந்தேகங்கள், குறிப்புகள் அல்லது மாதிரி வினாடி வினாக்களைக் கேளுங்கள்."
                      : "Ask curriculum doubts, get step-by-step logic, or test your skills."}
                  </p>

                  {/* Interactive Learning Mode Tabs (Neat Segmented Control) */}
                  <div className="mt-5 p-1 rounded-2xl bg-slate-100/90 border border-slate-200 inline-flex items-center gap-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setChatMode("socratic")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        chatMode === "socratic"
                          ? "bg-white text-[#2b2b2b] shadow-xs font-black"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span>💡</span>
                      <span>{language === "ta" ? "சோக்ரடிக் குறிப்புகள்" : "Socratic Hints"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChatMode("direct")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        chatMode === "direct"
                          ? "bg-white text-[#2b2b2b] shadow-xs font-black"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span>⚡</span>
                      <span>{language === "ta" ? "நேரடி விடை" : "Direct Solutions"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChatMode("quiz")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        chatMode === "quiz"
                          ? "bg-white text-[#2b2b2b] shadow-xs font-black"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span>🎯</span>
                      <span>{language === "ta" ? "வினாடி வினா" : "Practice Quiz"}</span>
                    </button>
                  </div>

                  {/* Curated 4 Interactive Starter Chips (Clean 2x2 Grid) */}
                  <div className="w-full mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                    {CURATED_PROMPTS.map((prompt) => {
                      const content = language === "ta" ? prompt.ta : prompt.en;
                      const Icon = prompt.icon;
                      return (
                        <button
                          key={prompt.id}
                          type="button"
                          onClick={() => sendMessage(content.prompt, prompt.subject)}
                          className="group flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 hover:border-[#58cc02] shadow-2xs hover:shadow-xs transition-all active:scale-98"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-emerald-50 text-slate-500 group-hover:text-[#58cc02] flex items-center justify-center shrink-0 transition-colors">
                              <Icon size={15} />
                            </div>
                            <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 truncate">
                              {content.label}
                            </span>
                          </div>
                          <ArrowRight
                            size={13}
                            className="text-slate-300 group-hover:text-[#58cc02] group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5"
                          />
                        </button>
                      );
                    })}
                  </div>

                </div>
              ) : (
                /* ─── Active Chat Messages ───────────────────────────────── */
                <div className="space-y-4 pt-4">
                  {messages.map((msg, i) => (
                    <MessageBubble
                      key={i}
                      message={msg}
                      language={language}
                      onSendFollowUp={(text) => sendMessage(text, "")}
                    />
                  ))}
                  {loading && (
                    <div className="flex justify-start mb-6 w-full">
                      <div className="bg-white border-2 border-[#e5e5e5] px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2.5 text-slate-800">
                        <TypingAnimation />
                        <span className="text-xs text-[#58cc02] font-black">
                          {language === "ta" ? "AI குரு சிந்திக்கிறார்..." : "Oracle is analyzing your question..."}
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

      {/* Floating Mascot Bot (Kalvi Mithran) */}
      <FloatingMascotBot language={language} />
    </div>
  );

  let screen;
  if (currentPath === "/chat") {
    screen = chatScreen;
  } else if (currentPath === "/userresponse") {
    screen = <UserResponse onBackToChat={handleBack} language={language} />;
  } else if (currentPath === "/test") {
    screen = <TestModule onBackToChat={handleBack} initialLanguage={language} language={language} />;
  } else if (currentPath === "/flashcards") {
    screen = <FlashcardModule onBackToChat={handleBack} initialLanguage={language} language={language} />;
  } else if (currentPath === "/mindmap") {
    screen = <MindMapModule onBackToChat={handleBack} initialLanguage={language} language={language} />;
  } else if (currentPath === "/kahoot") {
    screen = <KahootModule onBackToChat={handleBack} initialLanguage={language} language={language} />;
  } else {
    screen = (
      <HomePage
        onNavigate={navigateTo}
        language={language}
        onToggleLanguage={toggleLanguage}
        streak={streak}
        gems={gems}
        hearts={hearts}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PageLoader active={navigating} language={language} />
      <AppHeader
        currentPath={currentPath}
        onNavigate={navigateTo}
        onBack={handleBack}
        canGoBack={navHistory.length > 1 || currentPath !== "/"}
        streak={streak}
        gems={gems}
        hearts={hearts}
        language={language}
        onToggleLanguage={toggleLanguage}
        onClearChat={currentPath === "/chat" && messages.length > 0 ? clearChat : null}
      />
      <div className="flex-1 flex flex-col">
        {screen}
      </div>
    </div>
  );
}

export default App;
