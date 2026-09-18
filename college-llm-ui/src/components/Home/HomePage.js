import React from "react";
import {
  Sparkles,
  GraduationCap,
  Layers,
  Network,
  Clapperboard,
  Video,
  Languages,
  MessageSquareText,
  ArrowRight,
  Zap,
  BookOpenCheck,
  Bot,
  Trophy,
  LogOut,
  UserCircle,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { logActivity } from "../../activity";
import BrandLogo from "../BrandLogo";

/* ── The five places you can go ────────────────────────────────────────────────
   One line of copy each, on purpose. The icon and the colour do the explaining;
   anything longer just gets skimmed past. */
const MODULES = [
  {
    key: "movie-physics",
    path: "/movie-physics",
    icon: Clapperboard,
    gradient: "from-sky-500 to-indigo-600",
    glow: "hover:shadow-sky-200",
    text: "text-indigo-700",
    en: { title: "Movie Physics", line: "Science in movie scenes" },
    ta: { title: "திரைப்பட இயற்பியல்", line: "திரைக் காட்சிகளில் அறிவியல்" },
  },
  {
    // Lives inside the Test module as its "video" tab, so this opens that tab directly.
    key: "video",
    path: "/test",
    testTab: "video",
    icon: Video,
    gradient: "from-cyan-500 to-sky-600",
    glow: "hover:shadow-cyan-200",
    text: "text-sky-700",
    en: { title: "Video Passage", line: "Watch, pause, answer" },
    ta: { title: "வீடியோ பாடம்", line: "பார், நிறுத்து, பதில் சொல்" },
  },
  {
    key: "flashcards",
    path: "/flashcards",
    icon: Layers,
    gradient: "from-violet-500 to-fuchsia-600",
    glow: "hover:shadow-violet-200",
    text: "text-violet-700",
    en: { title: "Flashcards", line: "Flip cards and revise" },
    ta: { title: "அட்டைகள்", line: "திருப்பி நினைவுகூர்" },
  },
  {
    key: "mindmap",
    path: "/mindmap",
    icon: Network,
    gradient: "from-amber-500 to-orange-600",
    glow: "hover:shadow-amber-200",
    text: "text-amber-700",
    en: { title: "Mind Maps", line: "See the whole lesson" },
    ta: { title: "வரைபடங்கள்", line: "முழுப் பாடமும் ஒரே பார்வையில்" },
  },
  {
    key: "kahoot",
    path: "/kahoot",
    icon: Trophy,
    gradient: "from-pink-500 to-rose-600",
    glow: "hover:shadow-pink-200",
    text: "text-rose-700",
    en: { title: "Live Quiz", line: "Play a fun quiz game" },
    ta: { title: "வினாடி வினா", line: "விளையாட்டாக பயில்" },
  },
  {
    key: "chat",
    path: "/chat",
    icon: MessageSquareText,
    gradient: "from-brand-500 to-cyan-600",
    glow: "hover:shadow-brand-200",
    text: "text-brand-700",
    en: { title: "AI Tutor", line: "Ask any doubt" },
    ta: { title: "AI வழிகாட்டி", line: "எந்தச் சந்தேகமும் கேள்" },
  },
  {
    key: "test",
    path: "/test",
    testTab: "student",
    icon: GraduationCap,
    gradient: "from-emerald-500 to-teal-600",
    glow: "hover:shadow-emerald-200",
    text: "text-emerald-700",
    en: { title: "Tests", line: "Check what you know" },
    ta: { title: "தேர்வுகள்", line: "உனக்குத் தெரிந்ததைச் சோதி" },
  },
  // Insights ("/userresponse") is deliberately not listed here — teachers still
  // reach it by typing the URL directly.
];

/* ── Three short promises, two or three words each ────────────────────────────── */
const CHIPS = [
  { icon: BookOpenCheck, en: "From your textbook", ta: "பாடநூலிலிருந்தே" },
  { icon: Languages, en: "Tamil + English", ta: "தமிழ் + ஆங்கிலம்" },
  { icon: Bot, en: "Hints, not answers", ta: "விடை அல்ல, குறிப்புகள்" },
];

const HomePage = ({ onNavigate, onNavigateToTest, language = "en", onToggleLanguage, isAdmin = false }) => {
  const isTa = language === "ta";
  const copy = (item) => (isTa ? item.ta : item.en);

  // Test-module cards pick which tab opens (Video Passage vs. Tests).
  const open = (module) =>
    module.testTab && onNavigateToTest ? onNavigateToTest(module.testTab) : onNavigate(module.path);

  return (
    <div className="min-h-screen bg-[#faf8ff] font-sans text-slate-900 selection:bg-brand-600 selection:text-white">
      <div className="tngov-tricolor-strip fixed left-0 right-0 top-0 z-50" />

      <header className="sticky top-[3px] z-40 border-b border-brand-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <BrandLogo height={34} />
            <span className="hidden h-6 w-px bg-slate-200 sm:block" />
            <h1 className="hidden text-sm font-extrabold tracking-tight text-slate-900 sm:block font-display">
              {isTa ? "ஸ்மார்ட் AI கல்வி" : "Smart AI Learning"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate("/chat")}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 px-3.5 py-2 text-xs font-bold text-white shadow-pop transition-all hover:brightness-110 active:scale-95 sm:text-sm"
            >
              <Sparkles size={15} />
              <span>{isTa ? "AI கேள்" : "Ask AI"}</span>
            </button>

            {/* Only accounts with role:"admin" in Firestore see this */}
            {isAdmin && (
              <button
                onClick={() => onNavigate("/admin/students")}
                title={isTa ? "நிர்வாகம்" : "Admin"}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-2.5 py-2 text-xs font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
              >
                <ShieldCheck size={15} />
                <span className="hidden sm:inline">{isTa ? "நிர்வாகம்" : "Admin"}</span>
              </button>
            )}

            <button
              onClick={() => onNavigate("/profile")}
              title={isTa ? "என் சுயவிவரம்" : "My Profile"}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-700 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 active:scale-95"
            >
              <UserCircle size={15} />
              <span className="hidden sm:inline">{isTa ? "சுயவிவரம்" : "Profile"}</span>
            </button>

            <button
              onClick={onToggleLanguage}
              title={isTa ? "Switch to English" : "தமிழுக்கு மாற்றவும்"}
              className="flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-2.5 py-2 text-xs font-bold text-brand-700 transition-all hover:bg-brand-100 active:scale-95"
            >
              <Languages size={14} />
              <span>{isTa ? "EN" : "த"}</span>
            </button>

            <button
              onClick={async () => {
                await logActivity("auth", "logout");
                signOut(auth);
              }}
              title={isTa ? "வெளியேறு" : "Log Out"}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-2 text-xs font-bold text-slate-500 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-14 pt-12">
        {/* Hero — headline, one line, two buttons. Nothing else. */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center"
        >
          <h2 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl font-display">
            {isTa ? (
              <>
                நீண்ட நேரம் அல்ல —{" "}
                <span className="bg-gradient-to-r from-brand-600 via-sky-500 to-cyan-400 bg-clip-text text-transparent">
                  புத்திசாலியாகப் படி
                </span>
              </>
            ) : (
              <>
                Study smarter,{" "}
                <span className="bg-gradient-to-r from-brand-600 via-sky-500 to-cyan-400 bg-clip-text text-transparent">
                  not longer
                </span>
              </>
            )}
          </h2>

          <p className="mx-auto mt-4 max-w-md text-sm font-medium text-slate-500 sm:text-base">
            {isTa
              ? "கேள் · பயிற்சி செய் · திருப்பிப் பார் — ஒரே இடத்தில்."
              : "Ask. Practise. Revise. All in one place."}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={() => onNavigate("/chat")}
              className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 via-sky-600 to-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-pop-lg transition-all hover:brightness-110 hover:-translate-y-0.5 active:scale-95"
            >
              <Zap size={16} />
              <span>{isTa ? "இப்போதே தொடங்கு" : "Start now"}</span>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </button>

            <button
              onClick={() => onNavigate("/mindmap")}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-xs transition-all hover:border-brand-300 hover:text-brand-700 active:scale-95"
            >
              <Network size={16} />
              <span>{isTa ? "வரைபடம் பார்" : "See a map"}</span>
            </button>
          </div>

          {/* Three short promises */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            {CHIPS.map((chip, i) => {
              const Icon = chip.icon;
              return (
                <span
                  key={i}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-xs"
                >
                  <Icon size={12} className="text-brand-500" />
                  {copy(chip)}
                </span>
              );
            })}
          </div>
        </motion.section>

        {/* Modules — big icon, title, one line. */}
        <section className="relative mt-14">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 xl:grid-cols-7">
            {MODULES.map((module, index) => {
              const Icon = module.icon;
              const text = copy(module);
              return (
                <motion.button
                  key={module.key}
                  type="button"
                  onClick={() => open(module)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.25) }}
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.97 }}
                  className={`group flex flex-col items-start rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-xs transition-shadow hover:shadow-xl ${module.glow}`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3 ${module.gradient}`}
                  >
                    <Icon size={22} />
                  </div>

                  <h3 className="mt-4 text-base font-extrabold tracking-tight text-slate-900 font-display">
                    {text.title}
                  </h3>
                  <p className="mt-0.5 text-xs font-medium leading-snug text-slate-500">
                    {text.line}
                  </p>

                  <ArrowRight
                    size={15}
                    className={`mt-3 transition-transform group-hover:translate-x-1 ${module.text}`}
                  />
                </motion.button>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-3 px-4 py-5 sm:flex-row sm:justify-between">
          <BrandLogo height={26} className="opacity-50" fallbackSize={13} />
          <div className="flex flex-wrap items-center justify-center gap-1.5">
          {MODULES.map((module) => (
            <button
              key={module.key}
              onClick={() => open(module)}
              className="rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              {copy(module).title}
            </button>
          ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
