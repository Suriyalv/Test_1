import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { logActivity } from "./activity";
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
import ConceptBridgeModule from "./components/ConceptBridge/ConceptBridgeModule";
import MoviePhysicsModule from "./components/MoviePhysics/MoviePhysicsModule";
import MyProgress from "./components/Progress/MyProgress";
import AdminActivityDashboard from "./components/Admin/AdminActivityDashboard";
import AdminStudentRecords from "./components/Admin/AdminStudentRecords";
import ProfilePage from "./components/Profile/ProfilePage";
import FloatingMascotBot from "./components/FloatingMascotBot";
import { MascotProvider } from "./mascotContext";
import HomePage from "./components/Home/HomePage";
import HomePathway from "./components/Home/HomePathway";
import PageLoader from "./components/Loader/PageLoader";
import LoginPage from "./components/Auth/LoginPage";
import SignUpPage from "./components/Auth/SignUpPage";
import "./index.css";
import {
  Trash2,
  Languages,
  GraduationCap,
  BarChart3,
  Sparkles,
  Layers,
  Network,
  ArrowLeft,
  Trophy,
  LogOut,
  Lightbulb,
  LineChart,
  ShieldCheck,
  Users,
  UserCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Route -> module name written to activityLog when a signed-in student opens
// that screen. Names match the ones each module already logs its own events
// under, so the admin Student Records page can group them together.
const MODULE_BY_PATH = {
  "/chat": "chat",
  "/test": "test",
  "/flashcards": "flashcards",
  "/mindmap": "mindmap",
  "/kahoot": "kahoot",
  "/concept-bridge": "concept-bridge",
  "/movie-physics": "movie_physics",
  "/progress": "progress",
  "/profile": "progress",
};

function App() {
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [language, setLanguage] = useState("en"); // Default English
  // Which Test Module tab to land on next time "/test" is opened — set by the
  // pathway homepage before navigating there so its "Video Lesson" node can
  // deep-link straight into that tab instead of the default Student Test one.
  const [pendingTestTab, setPendingTestTab] = useState("student");
  // Starts true so the loading page covers the very first paint, then every
  // route change raises it again until the new screen has mounted.
  const [navigating, setNavigating] = useState(true);

  // undefined while Firebase is still resolving the session, null once it's
  // confirmed nobody is signed in, or the Firebase user object once they are.
  const [authUser, setAuthUser] = useState(undefined);
  // Which of the two signed-out screens to show; irrelevant once authUser is set.
  const [authScreen, setAuthScreen] = useState("login"); // "login" | "signup"
  // "admin" only when the user's Firestore profile has role:"admin" set —
  // that field is never writable from the client, only via the Firebase
  // console, so this can't be self-granted. Defaults to "student".
  const [role, setRole] = useState("student");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setAuthUser(user));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authUser) {
      setRole("student");
      return;
    }
    let cancelled = false;
    getDoc(doc(db, "users", authUser.uid))
      .then((snap) => {
        if (!cancelled) setRole(snap.data()?.role === "admin" ? "admin" : "student");
      })
      .catch(() => {
        if (!cancelled) setRole("student");
      });
    return () => {
      cancelled = true;
    };
  }, [authUser]);

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

  // Record which modules each student opens (admin Student Records page).
  useEffect(() => {
    const module = MODULE_BY_PATH[currentPath];
    if (authUser && module) logActivity(module, "opened");
  }, [currentPath, authUser]);

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
      logActivity("chat", "question_asked", {
        question: input.slice(0, 200),
        subject: selectedSubject || "",
      });

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
            : "⚠️ Cannot connect to the server. Please try again.",
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
      : "Do you want to delete this chat?";
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
            {/* Back to Home — top-left, same spot as every other module */}
            <button
              onClick={() => navigateTo("/")}
              className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-slate-100 px-2.5 font-semibold text-xs text-slate-700 transition-all hover:bg-slate-200 hover:text-brand-700 active:scale-95"
              title="Back to Home"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">
                {language === "ta" ? "முகப்பு" : "Home"}
              </span>
            </button>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-brand-600 to-cyan-500 text-white flex items-center justify-center shadow-pop">
              <Sparkles size={18} />
            </div>
            <div className="hidden md:block">
              <div className="text-[10px] font-bold text-brand-600 tracking-wide uppercase whitespace-nowrap">
                {language === "ta" ? "கல்வி AI • கற்றல் & திறன் தளம்" : "Learn with AI"}
              </div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight font-display whitespace-nowrap">
                {language === "ta" ? "ஸ்மார்ட் AI கல்வி வழிகாட்டி" : "Smart Study Helper"}
              </h1>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            {/* Nav: Test Taking */}
            <button
              onClick={() => navigateTo("/test")}
              className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 px-2.5 font-semibold text-xs sm:text-sm text-white shadow-pop transition-all hover:brightness-110 active:scale-95"
              title="Tests"
            >
              <GraduationCap size={15} />
              <span className="hidden sm:inline">
                {language === "ta" ? "தேர்வு போர்ட்டல்" : "Tests"}
              </span>
            </button>

            {/* Nav: Flashcards */}
            <button
              onClick={() => navigateTo("/flashcards")}
              className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-2.5 font-semibold text-xs sm:text-sm text-slate-700 transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600 active:scale-95"
              title="Flashcards"
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
              title="Mind Map"
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
              title="Live Quiz"
            >
              <Trophy size={15} />
              <span className="hidden sm:inline">
                {language === "ta" ? "வினாடி வினா" : "Live Quiz"}
              </span>
            </button>

            {/* Nav: Concept Bridge */}
            <button
              onClick={() => navigateTo("/concept-bridge")}
              className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-2.5 font-semibold text-xs sm:text-sm text-slate-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95"
              title="Concept Bridge"
            >
              <Lightbulb size={15} />
              <span className="hidden sm:inline">
                {language === "ta" ? "கருத்து பாலம்" : "Concept Bridge"}
              </span>
            </button>

            {/* Nav: My Profile — performance report, strengths & weaknesses */}
            <button
              onClick={() => navigateTo("/profile")}
              className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-2.5 font-semibold text-xs sm:text-sm text-slate-700 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 active:scale-95"
              title="My Profile"
            >
              <UserCircle size={15} />
              <span className="hidden sm:inline">
                {language === "ta" ? "என் சுயவிவரம்" : "My Profile"}
              </span>
            </button>

            {/* Nav: My Progress */}
            <button
              onClick={() => navigateTo("/progress")}
              className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-2.5 font-semibold text-xs sm:text-sm text-slate-700 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 active:scale-95"
              title="My Progress"
            >
              <LineChart size={15} />
              <span className="hidden sm:inline">
                {language === "ta" ? "என் முன்னேற்றம்" : "My Progress"}
              </span>
            </button>

            {/* Nav: Admin Activity Monitoring — only for role:"admin" accounts */}
            {role === "admin" && (
              <button
                onClick={() => navigateTo("/admin/activity")}
                className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-slate-900 px-2.5 font-semibold text-xs sm:text-sm text-white transition-all hover:bg-slate-800 active:scale-95"
                title="Admin"
              >
                <ShieldCheck size={15} />
                <span className="hidden sm:inline">
                  {language === "ta" ? "நிர்வாகம்" : "Admin"}
                </span>
              </button>
            )}

            {/* Nav: Admin Student Records — test marks, logins and modules per student */}
            {role === "admin" && (
              <button
                onClick={() => navigateTo("/admin/students")}
                className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-slate-900 px-2.5 font-semibold text-xs sm:text-sm text-white transition-all hover:bg-slate-800 active:scale-95"
                title="Student Records"
              >
                <Users size={15} />
                <span className="hidden sm:inline">
                  {language === "ta" ? "மாணவர் பதிவுகள்" : "Student Records"}
                </span>
              </button>
            )}

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

            {/* Log Out */}
            <button
              onClick={async () => {
                await logActivity("auth", "logout");
                signOut(auth);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-500 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              title={language === "ta" ? "வெளியேறு" : "Log Out"}
            >
              <LogOut size={15} />
            </button>
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
                      : "Hello! What do you want to learn today?"}
                  </h2>

                  <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed max-w-md">
                    {language === "ta"
                      ? "பாடப் புத்தக தலைப்புகள், அறிவியல் விதிகள் மற்றும் மாதிரித் தேர்வுகளுக்கான AI வழிகாட்டி."
                      : "Ask about your lessons. Get easy answers. Get ready for exams."}
                  </p>

                  {/* Vibrant Suggestion Pills */}
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    {[
                      language === "ta" ? "🚀 நியூட்டனின் இரண்டாம் விதி என்ன?" : "🚀 What is Newton's second law?",
                      language === "ta" ? "⚖️ நிறை மற்றும் எடை" : "⚖️ Mass vs weight",
                      language === "ta" ? "🔧 திருப்பு விசை என்றால் என்ன?" : "🔧 What is torque?",
                      language === "ta" ? "🏏 கணத்தாக்கு என்றால் என்ன?" : "🏏 What is impulse?"
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
    </div>
  );

  // Which screen this path shows. "/" is the platform home page; the chat that
  // used to live there now has its own route at "/chat".
  let screen;
  if (currentPath === "/chat") {
    screen = chatScreen;
  } else if (currentPath === "/userresponse") {
    screen = <UserResponse onBackToHome={() => navigateTo("/")} language={language} />;
  } else if (currentPath === "/test") {
    screen = (
      <TestModule
        onBackToHome={() => navigateTo("/")}
        initialLanguage={language}
        initialTab={pendingTestTab}
      />
    );
  } else if (currentPath === "/flashcards") {
    screen = <FlashcardModule onBackToHome={() => navigateTo("/")} initialLanguage={language} />;
  } else if (currentPath === "/mindmap") {
    screen = <MindMapModule onBackToHome={() => navigateTo("/")} initialLanguage={language} />;
  } else if (currentPath === "/kahoot") {
    screen = <KahootModule onBackToHome={() => navigateTo("/")} initialLanguage={language} />;
  } else if (currentPath === "/concept-bridge") {
    screen = <ConceptBridgeModule onBackToHome={() => navigateTo("/")} initialLanguage={language} />;
  } else if (currentPath === "/movie-physics") {
    screen = <MoviePhysicsModule onBackToHome={() => navigateTo("/")} initialLanguage={language} />;
  } else if (currentPath === "/profile") {
    screen = <ProfilePage onBack={() => navigateTo("/")} language={language} />;
  } else if (currentPath === "/progress") {
    screen = <MyProgress onBackToHome={() => navigateTo("/")} language={language} />;
  } else if (currentPath === "/pathway") {
    // Preview build of a Duolingo-style pathway homepage — kept at its own
    // route, deliberately not wired to "/", so the existing HomePage stays
    // exactly as it is until this one is confirmed and swapped in on purpose.
    screen = (
      <HomePathway
        onNavigate={navigateTo}
        onNavigateToTest={(tab) => {
          setPendingTestTab(tab);
          navigateTo("/test");
        }}
        language={language}
        onToggleLanguage={toggleLanguage}
      />
    );
  } else if (currentPath === "/admin/students") {
    screen =
      role === "admin" ? (
        <AdminStudentRecords onBackToHome={() => navigateTo("/")} onNavigate={navigateTo} language={language} />
      ) : (
        <HomePage onNavigate={navigateTo} language={language} onToggleLanguage={toggleLanguage} isAdmin={role === "admin"} />
      );
  } else if (currentPath === "/admin/activity") {
    screen =
      role === "admin" ? (
        <AdminActivityDashboard onBackToHome={() => navigateTo("/")} onNavigate={navigateTo} language={language} />
      ) : (
        <HomePage onNavigate={navigateTo} language={language} onToggleLanguage={toggleLanguage} isAdmin={role === "admin"} />
      );
  } else {
    screen = (
      <HomePage
        isAdmin={role === "admin"}
        onNavigate={navigateTo}
        onNavigateToTest={(tab) => {
          setPendingTestTab(tab);
          navigateTo("/test");
        }}
        language={language}
        onToggleLanguage={toggleLanguage}
      />
    );
  }

  // Still resolving whether a session exists — show only the loader, nothing
  // else, so a signed-out visitor never sees a flash of the app underneath.
  if (authUser === undefined) {
    return <PageLoader active language={language} />;
  }

  if (authUser === null) {
    return authScreen === "signup" ? (
      <SignUpPage language={language} onSwitchToLogin={() => setAuthScreen("login")} />
    ) : (
      <LoginPage language={language} onSwitchToSignup={() => setAuthScreen("signup")} />
    );
  }

  return (
    <MascotProvider>
      <PageLoader active={navigating} language={language} />
      {screen}
      {/* Single global mascot instance (Kalvi Mithran) — floats bottom-right
          on every authenticated page, not just the chat screen. */}
      <FloatingMascotBot language={language} />
    </MascotProvider>
  );
}

export default App;

