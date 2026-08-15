import { useState, useEffect } from "react";
import { chatWithAI } from "./api";
import ChatContainer from "./components/ChatContainer";
import MessageBubble from "./components/MessageBubble";
import ChatInput from "./components/ChatInput";
import TypingAnimation from "./components/TypingAnimation";
import UserResponse from "./UserResponse"; // Import the new component
import TestModule from "./components/TestTaking/TestModule"; // Import Test Module
import "./index.css";
import { Trash2, Languages, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function App() {
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [language, setLanguage] = useState("en"); // "en" = English, "ta" = Tamil

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "ta" : "en"));
  };

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  // Handle URL changes (simple routing)
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
    return <UserResponse />;
  }

  if (currentPath === "/test") {
    return <TestModule onBackToChat={() => navigateTo("/")} />;
  }


  const sendMessage = async (input, selectedSubject) => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const data = await chatWithAI(input, messages, selectedSubject, language);

      const botMessage = {
        role: "assistant",
        content: data.response || "⚠️ Received empty response",
        files: data.files || [],
        images: data.images || [],
        prompt: input // Store the user prompt for feedback
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Fetch error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Server not reachable. Please check your backend connection." },
      ]);
    }

    setLoading(false);
  };

  const clearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat?")) {
      setMessages([]);
      localStorage.removeItem("chatMessages");
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans text-black selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white text-black border-b border-gray-200 z-30 flex items-center justify-between px-4 md:px-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
            <span className="text-black font-black text-lg">A</span>
          </div>
          <span className="font-extrabold text-lg tracking-tight text-black">
            ArkEngine <span className="text-xs font-semibold text-black border border-blue-300 bg-blue-50 px-2 py-0.5 rounded-full ml-1">AI Chat</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Test Taking Module Button */}
          <button
            onClick={() => navigateTo("/test")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-black border border-blue-300 rounded-xl transition-all font-bold text-sm shadow-sm"
            title="Open Test Taking Application"
          >
            <GraduationCap size={18} className="text-black" />
            <span className="text-black">{language === "ta" ? "வினா தேர்வு செயலி" : "Test App"}</span>
          </button>

          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            title={language === "en" ? "Switch to Tamil" : "Switch to English"}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black border border-gray-300 rounded-xl transition-all font-semibold text-sm group"
          >
            <Languages size={18} className="text-black" />
            <span className="text-black">
              {language === "en" ? (
                <span>EN <span className="text-gray-600 font-normal">/ தமிழ்</span></span>
              ) : (
                <span className="text-gray-600 font-normal">EN / </span>
              )}
              {language === "ta" && <span className="text-black">தமிழ்</span>}
            </span>
          </button>

          {/* Clear Chat Button */}
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black border border-gray-300 rounded-xl transition-all font-medium text-sm group"
            title="Clear Chat"
          >
            <Trash2 size={18} className="text-black group-hover:text-red-600 transition-colors" />
            <span className="hidden sm:inline text-black">Clear Chat</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <ChatContainer>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                  <div className="w-14 h-14 bg-blue-50 border-2 border-blue-500 rounded-2xl flex items-center justify-center mb-4 shadow-md">
                    <span className="text-black font-black text-2xl">A</span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-black mb-2 tracking-tight">
                    {language === "ta" ? "வணக்கம்! நான் ArkEngine!" : "Hello, I'm ArkEngine!"}
                  </h1>
                  <p className="text-black max-w-md text-sm font-medium">
                    {language === "ta"
                      ? "நான் ArkEngine குழுவால் உருவாக்கப்பட்ட உங்கள் கல்வி உதவியாளர். உங்கள் பாடங்களைப் பற்றி எதையும் கேளுங்கள்!"
                      : "I'm your academic assistant developed by the ArkEngine Team. Ask me anything about your subjects or chat with me like a friend!"}
                  </p>
                  <div className="mt-5 px-4 py-1.5 rounded-full text-xs font-bold border border-blue-300 bg-blue-50 text-black shadow-sm">
                    {language === "ta" ? "🌐 தமிழ் பயன்முறை செயலில் உள்ளது" : "🌐 English mode active"}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <MessageBubble key={i} message={msg} />
                  ))}
                  {loading && (
                    <div className="flex justify-start mb-6 w-full">
                      <div className="bg-white border border-blue-300 px-5 py-3 rounded-2xl rounded-tl-none shadow-md flex items-center gap-3 text-black">
                        <TypingAnimation />
                        <span className="text-sm text-black font-semibold">
                          {language === "ta" ? "யோசிக்கிறேன்..." : "Thinking..."}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </ChatContainer>
            <ChatInput onSend={sendMessage} loading={loading} language={language} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;

