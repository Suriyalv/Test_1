import React, { useState, useMemo } from "react";
import {
  Flame,
  Gem,
  Trophy,
  Sparkles,
  MessageSquareText,
  GraduationCap,
  Layers,
  Network,
  BarChart3,
  ArrowRight,
  Star,
  Gift,
  Zap,
  Play,
  Flag,
  BookOpen,
  CheckCircle2,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Mathematical positions for the 10 trail items in a 480px wide by 1180px tall SVG canvas
// Center line is X = 240px. Nodes sway gracefully between X = 90 and X = 390
const TRAIL_ITEMS = [
  {
    id: "oracle",
    type: "node",
    stepNumber: 1,
    path: "/chat",
    icon: MessageSquareText,
    color: "green",
    buttonClass: "btn-3d-green",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
    x: 240,
    y: 75,
    xpReward: 20,
    isActive: true,
    en: {
      title: "AI Oracle",
      levelName: "AI Oracle Sanctum",
      unitSubtitle: "Socratic AI Doubts & Guided Learning",
      desc: "Ask any doubt from your syllabus. Get step-by-step logic, formulas, and guided hints.",
      cta: "START LESSON",
      quest: "Ask 1 doubt to the AI Tutor"
    },
    ta: {
      title: "AI குரு",
      levelName: "AI ஞான ஆலயம்",
      unitSubtitle: "சந்தேக விளக்கம் & சோக்ரடிக் வழிகாட்டுதல்",
      desc: "எந்தப் பாடச் சந்தேகத்தையும் கேளுங்கள். படிப்படியான வழிகாட்டல்கள் மற்றும் சூத்திரங்களைப் பெறுங்கள்.",
      cta: "பாடத்தைத் தொடங்கு",
      quest: "AI வழிகாட்டியிடம் 1 சந்தேகம் கேளுங்கள்"
    }
  },
  {
    id: "chest-1",
    type: "chest",
    chestId: "chest-1",
    gems: 50,
    x: 330,
    y: 185
  },
  {
    id: "test",
    type: "node",
    stepNumber: 2,
    path: "/test",
    icon: GraduationCap,
    color: "blue",
    buttonClass: "btn-3d-blue",
    badgeBg: "bg-sky-100 text-sky-800 border-sky-300",
    x: 390,
    y: 300,
    xpReward: 35,
    en: {
      title: "Exam Arena",
      levelName: "Arena of Trials",
      unitSubtitle: "Curriculum Mock Exams & Video Breakdowns",
      desc: "Practice with timed question banks, diagnostic grading, and curated video explanations.",
      cta: "ENTER TRIAL",
      quest: "Complete 1 practice test"
    },
    ta: {
      title: "தேர்வுக் களம்",
      levelName: "மாதிரித் தேர்வு அரங்கம்",
      unitSubtitle: "பாடத் தேர்வுகள் & விளக்க வீடியோக்கள்",
      desc: "நேரக் கட்டுப்பாட்டுடன் கூடிய தேர்வுகள் மற்றும் உடனடி மதிப்பெண் ஆய்வு.",
      cta: "தேர்வில் நுழை",
      quest: "1 மாதிரித் தேர்வை முடியுங்கள்"
    }
  },
  {
    id: "flashcards",
    type: "node",
    stepNumber: 3,
    path: "/flashcards",
    icon: Layers,
    color: "gold",
    buttonClass: "btn-3d-gold",
    badgeBg: "bg-amber-100 text-amber-800 border-amber-300",
    x: 310,
    y: 420,
    xpReward: 25,
    en: {
      title: "Flashcards",
      levelName: "Vault of Memory Runes",
      unitSubtitle: "Active Recall Drill for Laws & Formulas",
      desc: "Flip interactive runes to cement definitions, dates, and mathematical equations into long-term recall.",
      cta: "PRACTICE RUNES",
      quest: "Flip 3 flashcards"
    },
    ta: {
      title: "அட்டைகள்",
      levelName: "நினைவாற்றல் கோட்டை",
      unitSubtitle: "கருத்து அட்டைகள் மூலம் விரைவான மீள்பார்வை",
      desc: "அட்டைகளைத் திருப்பி முக்கிய வரையறைகள் மற்றும் சூத்திரங்களை விரைவாக நினைவில் நிறுத்துங்கள்.",
      cta: "அட்டைகளைப் பயில்",
      quest: "3 கருத்து அட்டைகளைத் திருப்புங்கள்"
    }
  },
  {
    id: "chest-2",
    type: "chest",
    chestId: "chest-2",
    gems: 75,
    x: 180,
    y: 540
  },
  {
    id: "mindmap",
    type: "node",
    stepNumber: 4,
    path: "/mindmap",
    icon: Network,
    color: "purple",
    buttonClass: "btn-3d-purple",
    badgeBg: "bg-purple-100 text-purple-800 border-purple-300",
    x: 90,
    y: 660,
    xpReward: 30,
    en: {
      title: "Mind Maps",
      levelName: "Synapse Cartography",
      unitSubtitle: "Interactive 2D Concept Knowledge Graphs",
      desc: "Visualize how formulas, prerequisite principles, and curriculum units connect together.",
      cta: "EXPLORE MAP",
      quest: "Inspect 1 mind map branch"
    },
    ta: {
      title: "வரைபடம்",
      levelName: "கருத்து வரைபட மையம்",
      unitSubtitle: "பாடக் கருத்துக்களின் பரஸ்பர இணைப்பு வரைபடம்",
      desc: "பாடப் பிரிவுகள் ஒன்றோடொன்று எவ்வாறு இணைகின்றன என்பதை விரிவான வரைபடமாகப் பாருங்கள்.",
      cta: "வரைபடத்தை ஆராய்",
      quest: "1 வரைபடக் கிளையை ஆராயுங்கள்"
    }
  },
  {
    id: "kahoot",
    type: "node",
    stepNumber: 5,
    path: "/kahoot",
    icon: Trophy,
    color: "rose",
    buttonClass: "btn-3d-rose",
    badgeBg: "bg-rose-100 text-rose-800 border-rose-300",
    x: 170,
    y: 780,
    xpReward: 40,
    en: {
      title: "Live Quiz",
      levelName: "Thunder Colosseum",
      unitSubtitle: "Rapid Multiplayer Gamified Quiz Battles",
      desc: "Compete against classmates with live speed timers and fight for top spot on the podium.",
      cta: "BATTLE NOW",
      quest: "Join a live multiplayer quiz"
    },
    ta: {
      title: "நேரடிப் போட்டி",
      levelName: "மின்னல் வினாடி வினா அரங்கம்",
      unitSubtitle: "சக மாணவர்களோடு நேரடிப் போட்டி",
      desc: "நேரக் கட்டுப்பாட்டுடன் வேகமாக விடையளித்து முதலிடம் பெறுங்கள்.",
      cta: "போட்டியில் இறங்கு",
      quest: "நேரடி வினாடி வினாவில் பங்கேற்க"
    }
  },
  {
    id: "chest-3",
    type: "chest",
    chestId: "chest-3",
    gems: 100,
    x: 310,
    y: 900
  },
  {
    id: "userresponse",
    type: "node",
    stepNumber: 6,
    path: "/userresponse",
    icon: BarChart3,
    color: "slate",
    buttonClass: "btn-3d-white",
    badgeBg: "bg-slate-100 text-slate-800 border-slate-300",
    x: 240,
    y: 1015,
    xpReward: 15,
    en: {
      title: "Teacher Hub",
      levelName: "Grand Archon Observatory",
      unitSubtitle: "Educator Telemetry & Student Learning Insights",
      desc: "Review student mastery curves, concept bottleneck heatmaps, and doubt analysis.",
      cta: "VIEW INSIGHTS",
      quest: "Review cohort analytics"
    },
    ta: {
      title: "ஆசிரியர் தளம்",
      levelName: "ஆசிரியர் தகவல் மையம்",
      unitSubtitle: "மாணவர் முன்னேற்றம் & தேர்ச்சிப் பகுப்பாய்வு",
      desc: "மாணவர்கள் தடுமாறும் பகுதிகள் மற்றும் முன்னேற்றப் பதிவுகளை உடனுக்குடன் கண்காணிக்கலாம்.",
      cta: "பகுப்பாய்வைக் காண்க",
      quest: "வகுப்பு முன்னேற்றத்தை ஆய்வு செய்க"
    }
  },
  {
    id: "finish-pedestal",
    type: "finish",
    x: 240,
    y: 1120
  }
];

// Interactive Famous Characters positioned along the open curves of the trail
const MAP_CHARACTERS = [
  {
    id: "yoda",
    name: "Master Yoda",
    universe: "Star Wars",
    title: "Grand Jedi Master",
    taTitle: "ஜெடை மகா குரு",
    emoji: "🧙‍♂️",
    x: 65,
    y: 295,
    quoteEn: "Patience you must have, young padawan. In this syllabus, do or do not, there is no try!",
    quoteTa: "பொறுமை தேவை, இளம் சீடனே! பாடங்களை முழுமையாகக் கற்பதே வெற்றியின் ரகசியம்!",
    wisdomReward: 10,
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300"
  },
  {
    id: "ironman",
    name: "Iron Man",
    universe: "Marvel Avengers",
    title: "Tony Stark · Tech Pioneer",
    taTitle: "டோனி ஸ்டார்க் · தொழில்நுட்ப மேதை",
    emoji: "🦾",
    x: 415,
    y: 650,
    quoteEn: "I am Iron Man. JARVIS telemetry says you're crushing Unit 1. Let's hit the Exam Arena with 100% power!",
    quoteTa: "நான் தான் அயர்ன் மேன்! அறிவியல் சிந்தனையும் தொடர் பயிற்சியும் உன்னை அசைக்க முடியாதவனாக்கும்!",
    wisdomReward: 10,
    badgeBg: "bg-red-100 text-red-800 border-red-300"
  },
  {
    id: "spiderman",
    name: "Spider-Man",
    universe: "Marvel",
    title: "Your Friendly Study Hero",
    taTitle: "உங்கள் நல் நண்பன் ஸ்பைடர்-மேன்",
    emoji: "🕸️",
    x: 70,
    y: 915,
    quoteEn: "With great GPA comes great responsibility! Section finish is right ahead, stick the landing!",
    quoteTa: "அதிக மதிப்பெண்ணோடு அதிக பொறுப்பும் வருகிறது! இறுதிப் படியை நம்பிக்கையோடு வென்று காட்டு!",
    wisdomReward: 10,
    badgeBg: "bg-sky-100 text-sky-800 border-sky-300"
  }
];

// Master Yoda SVG Component
const YodaCharacter = ({ onClick }) => (
  <div
    onClick={onClick}
    className="cursor-pointer group flex flex-col items-center select-none"
    title="Click to speak with Master Yoda!"
  >
    <div className="relative w-16 h-16 flex items-center justify-center animate-token-float">
      {/* Mystical Jedi Force Aura */}
      <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-md group-hover:bg-emerald-400/40 transition-all animate-pulse" />
      
      <svg viewBox="0 0 80 80" className="w-14 h-14 relative z-10 drop-shadow-md group-hover:scale-110 transition-transform">
        {/* Yoda Ears */}
        <polygon points="12,32 2,24 16,40" fill="#86efac" stroke="#15803d" strokeWidth="1.5" />
        <polygon points="68,32 78,24 64,40" fill="#86efac" stroke="#15803d" strokeWidth="1.5" />
        <polygon points="14,33 5,26 16,38" fill="#f472b6" opacity="0.6" />
        <polygon points="66,33 75,26 64,38" fill="#f472b6" opacity="0.6" />

        {/* Head */}
        <ellipse cx="40" cy="34" rx="20" ry="16" fill="#86efac" stroke="#15803d" strokeWidth="1.5" />
        {/* Forehead Wrinkles */}
        <path d="M 32 24 Q 40 22 48 24" stroke="#16a34a" strokeWidth="1.2" fill="none" />
        <path d="M 30 28 Q 40 26 50 28" stroke="#16a34a" strokeWidth="1.2" fill="none" />

        {/* Eyes */}
        <ellipse cx="32" cy="35" rx="3.5" ry="3.5" fill="#1e293b" />
        <circle cx="33.2" cy="33.8" r="1.2" fill="#ffffff" />
        <ellipse cx="48" cy="35" rx="3.5" ry="3.5" fill="#1e293b" />
        <circle cx="49.2" cy="33.8" r="1.2" fill="#ffffff" />

        {/* Nose & Smile */}
        <ellipse cx="40" cy="40" rx="2" ry="1.5" fill="#16a34a" />
        <path d="M 35 44 Q 40 47 45 44" stroke="#15803d" strokeWidth="1.5" fill="none" />

        {/* Jedi Robe */}
        <path d="M 22 48 Q 40 45 58 48 L 62 72 Q 40 75 18 72 Z" fill="#e2d9cc" stroke="#78716c" strokeWidth="1.5" />
        <path d="M 32 48 L 40 68 L 48 48" stroke="#a8a29e" strokeWidth="1.5" fill="#d6cebe" />

        {/* Wooden Staff */}
        <line x1="20" y1="42" x2="16" y2="74" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
        <circle cx="20" cy="42" r="3" fill="#92400e" />
      </svg>
    </div>

    {/* Name Pill */}
    <div className="mt-1 bg-white/95 border-2 border-emerald-500 rounded-full px-2.5 py-0.5 shadow-sm flex items-center gap-1 group-hover:bg-emerald-50 transition-colors">
      <span className="text-[9px] font-black text-emerald-800 whitespace-nowrap">
        YODA 🟢
      </span>
    </div>
  </div>
);

// Iron Man SVG Component
const IronManCharacter = ({ onClick }) => (
  <div
    onClick={onClick}
    className="cursor-pointer group flex flex-col items-center select-none"
    title="Click to activate Iron Man!"
  >
    <div className="relative w-16 h-16 flex items-center justify-center animate-token-float">
      {/* Arc Reactor Energy Glow */}
      <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-md group-hover:bg-cyan-400/40 transition-all animate-pulse" />

      <svg viewBox="0 0 80 80" className="w-14 h-14 relative z-10 drop-shadow-md group-hover:scale-110 transition-transform">
        {/* Crimson Helmet Base */}
        <path d="M 24 16 Q 40 8 56 16 L 62 46 Q 40 62 18 46 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />

        {/* Gold Faceplate */}
        <polygon points="28,24 52,24 56,46 48,54 32,54 24,46" fill="#fbbf24" stroke="#d97706" strokeWidth="1.2" />

        {/* Glowing Cyan Slit Eyes */}
        <polygon points="30,34 38,34 36,37 31,37" fill="#00f0ff" className="drop-shadow-[0_0_4px_#00f0ff]" />
        <polygon points="42,34 50,34 49,37 44,37" fill="#00f0ff" className="drop-shadow-[0_0_4px_#00f0ff]" />

        {/* Chest Armor with Arc Reactor */}
        <path d="M 22 56 Q 40 52 58 56 L 64 74 Q 40 78 16 74 Z" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1.5" />
        <circle cx="40" cy="65" r="5.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" className="animate-pulse" />
        <circle cx="40" cy="65" r="2.5" fill="#ffffff" />

        {/* Thruster Flames underneath */}
        <polygon points="26,74 30,80 24,80" fill="#f97316" />
        <polygon points="54,74 56,80 50,80" fill="#f97316" />
      </svg>
    </div>

    {/* Name Pill */}
    <div className="mt-1 bg-white/95 border-2 border-red-500 rounded-full px-2.5 py-0.5 shadow-sm flex items-center gap-1 group-hover:bg-red-50 transition-colors">
      <span className="text-[9px] font-black text-red-700 whitespace-nowrap">
        IRON MAN ⚡
      </span>
    </div>
  </div>
);

// Spider-Man SVG Component (Hanging upside down from web line)
const SpiderManCharacter = ({ onClick }) => (
  <div
    onClick={onClick}
    className="cursor-pointer group flex flex-col items-center select-none"
    title="Click to interact with Spider-Man!"
  >
    {/* Silver Web Line */}
    <div className="w-[1.5px] h-6 bg-gradient-to-b from-slate-400 to-red-400 -mb-1" />

    <div className="relative w-16 h-16 flex items-center justify-center group-hover:rotate-6 transition-transform">
      <div className="absolute inset-0 rounded-full bg-red-400/20 blur-md group-hover:bg-red-400/35 transition-all animate-pulse" />

      <svg viewBox="0 0 80 80" className="w-14 h-14 relative z-10 drop-shadow-md group-hover:scale-110 transition-transform">
        {/* Upside-down Spider Head */}
        <ellipse cx="40" cy="38" rx="19" ry="22" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5" />

        {/* Web Lattice Lines */}
        <line x1="40" y1="16" x2="40" y2="60" stroke="#7f1d1d" strokeWidth="1" />
        <line x1="21" y1="38" x2="59" y2="38" stroke="#7f1d1d" strokeWidth="1" />
        <path d="M 28 26 Q 40 32 52 26" stroke="#7f1d1d" strokeWidth="1" fill="none" />
        <path d="M 24 38 Q 40 46 56 38" stroke="#7f1d1d" strokeWidth="1" fill="none" />
        <path d="M 28 50 Q 40 56 52 50" stroke="#7f1d1d" strokeWidth="1" fill="none" />

        {/* Iconic Big White Spider Eyes (upside down) */}
        <polygon points="26,30 36,36 34,46 24,42" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
        <polygon points="54,30 44,36 46,46 56,42" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />

        {/* Friendly Waving Hand */}
        <ellipse cx="20" cy="56" rx="4" ry="4" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
      </svg>
    </div>

    {/* Name Pill */}
    <div className="mt-1 bg-white/95 border-2 border-sky-500 rounded-full px-2.5 py-0.5 shadow-sm flex items-center gap-1 group-hover:bg-sky-50 transition-colors">
      <span className="text-[9px] font-black text-sky-700 whitespace-nowrap">
        SPIDEY 🕸️
      </span>
    </div>
  </div>
);

// Helper: Generates a smooth C1 cubic bezier spline running exactly through all item centers
const generateSplinePath = (items) => {
  if (!items || items.length === 0) return "";
  let d = `M ${items[0].x} ${items[0].y}`;
  for (let i = 0; i < items.length - 1; i++) {
    const p0 = items[i];
    const p1 = items[i + 1];
    const dy = p1.y - p0.y;
    const c0x = p0.x;
    const c0y = p0.y + dy * 0.55;
    const c1x = p1.x;
    const c1y = p1.y - dy * 0.55;
    d += ` C ${c0x} ${c0y}, ${c1x} ${c1y}, ${p1.x} ${p1.y}`;
  }
  return d;
};

const HomePage = ({ onNavigate, language = "en", onToggleLanguage }) => {
  const isTa = language === "ta";

  // Game Stats (Gems for chest rewards)
  const [gems, setGems] = useState(() => parseInt(localStorage.getItem("game_gems") || "280", 10));
  const [openedChests, setOpenedChests] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("game_opened_chests") || "[]");
    } catch {
      return [];
    }
  });

  // Character Wisdom Rewards claimed
  const [claimedWisdoms, setClaimedWisdoms] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("game_claimed_wisdoms") || "[]");
    } catch {
      return [];
    }
  });

  // Active Character Dialogue Modal
  const [activeCharacter, setActiveCharacter] = useState(null);

  // Selected Unit Popover Modal, Chest Modal, Guidebook Modal
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [chestModal, setChestModal] = useState(null);
  const [showGuidebook, setShowGuidebook] = useState(false);

  // Precalculated trail spline
  const trailSpline = useMemo(() => generateSplinePath(TRAIL_ITEMS), []);

  const handleOpenChest = (chest) => {
    if (openedChests.includes(chest.chestId)) return;
    const nextOpened = [...openedChests, chest.chestId];
    setOpenedChests(nextOpened);
    localStorage.setItem("game_opened_chests", JSON.stringify(nextOpened));
    const nextGems = gems + chest.gems;
    setGems(nextGems);
    localStorage.setItem("game_gems", nextGems.toString());
    setChestModal({ gems: chest.gems });
  };

  const handleClaimWisdom = (character) => {
    if (claimedWisdoms.includes(character.id)) return;
    const nextClaimed = [...claimedWisdoms, character.id];
    setClaimedWisdoms(nextClaimed);
    localStorage.setItem("game_claimed_wisdoms", JSON.stringify(nextClaimed));
    const nextGems = gems + character.wisdomReward;
    setGems(nextGems);
    localStorage.setItem("game_gems", nextGems.toString());
  };

  const handleStartUnit = (unit) => {
    onNavigate(unit.path);
  };

  return (
    <div className="flex-1 text-[#3c3c3c]">
      {/* ─── Main Content: Duolingo Adventure Arena ─────────────────────────── */}
      <main className="mx-auto max-w-5xl px-4 py-8 flex flex-col lg:flex-row gap-8 items-start justify-center">
        
        {/* ─── Center / Left Column: Properly Arranged Duolingo Map Trail ─── */}
        <div className="w-full lg:w-[480px] flex flex-col items-center">
          
          {/* Section 1 Banner with Guidebook button */}
          <div className="w-full rounded-2xl bg-gradient-to-r from-[#58cc02] via-[#20b802] to-[#1cb0f6] border-b-4 border-[#169400] text-white p-5 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-md">
                  {isTa ? "பிரிவு 1 · அலகு 1" : "SECTION 1 · UNIT 1"}
                </span>
                <span className="text-[11px] font-bold opacity-90">
                  {isTa ? "6 சாகசப் படிகள்" : "6 Mastery Steps"}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight mt-1">
                {isTa ? "தமிழ்நாடு பாடத்திட்டக் களம்" : "Curriculum Mastery Realm"}
              </h1>
              <p className="text-xs font-semibold opacity-90 mt-0.5">
                {isTa ? "கற்றல் பாதையில் முன்னேறி வைரங்களை வெல்லுங்கள்!" : "Follow the adventure trail, master concepts & claim gems!"}
              </p>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setShowGuidebook(true)}
                className="btn-3d bg-white/20 hover:bg-white/30 text-white border-b-2 border-black/25 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 backdrop-blur-sm transition-all shadow-sm"
              >
                <BookOpen size={15} />
                <span>{isTa ? "பாடக் கையேடு" : "GUIDEBOOK"}</span>
              </button>
              
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-2 rounded-xl text-xs font-extrabold shrink-0 border border-white/20">
                <Sparkles size={15} className="text-yellow-300 fill-yellow-300 animate-pulse" />
                <span>180 XP</span>
              </div>
            </div>
          </div>

          {/* ─── Perfectly Arranged Map Canvas (480px) ─────────────────────────── */}
          <div className="relative w-[480px] h-[1180px] mx-auto select-none">
            
            {/* SVG Road connecting nodes center-to-center */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0"
              viewBox="0 0 480 1180"
              fill="none"
            >
              {/* Smooth Duolingo Road Track */}
              <path
                d={trailSpline}
                stroke="#e2e8f0"
                strokeWidth="18"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Clean Center Stepping Line */}
              <path
                d={trailSpline}
                stroke="#cbd5e1"
                strokeWidth="4"
                strokeDasharray="8 12"
                strokeLinecap="round"
              />

              {/* Active emerald progress glow on first segment */}
              <path
                d={`M ${TRAIL_ITEMS[0].x} ${TRAIL_ITEMS[0].y} C ${TRAIL_ITEMS[0].x} ${TRAIL_ITEMS[0].y + 60}, ${TRAIL_ITEMS[1].x} ${TRAIL_ITEMS[1].y - 60}, ${TRAIL_ITEMS[1].x} ${TRAIL_ITEMS[1].y}`}
                stroke="#58cc02"
                strokeWidth="6"
                strokeLinecap="round"
              />
            </svg>

            {/* ─── Interactive Movie Characters positioned along the open curves ─ */}
            {MAP_CHARACTERS.map((char) => {
              const isClaimed = claimedWisdoms.includes(char.id);
              return (
                <div
                  key={char.id}
                  className="absolute z-20"
                  style={{
                    left: `${char.x}px`,
                    top: `${char.y}px`,
                    transform: "translate(-50%, -50%)"
                  }}
                >
                  {isClaimed && (
                    <div className="absolute -top-2 right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm border border-white z-30">
                      <CheckCircle2 size={11} />
                    </div>
                  )}
                  {char.id === "yoda" && <YodaCharacter onClick={() => setActiveCharacter(char)} />}
                  {char.id === "ironman" && <IronManCharacter onClick={() => setActiveCharacter(char)} />}
                  {char.id === "spiderman" && <SpiderManCharacter onClick={() => setActiveCharacter(char)} />}
                </div>
              );
            })}

            {/* Render all 10 Trail Items using exact (x, y) coordinates */}
            {TRAIL_ITEMS.map((item) => {
              // 1. MYSTERY CHEST
              if (item.type === "chest") {
                const isOpened = openedChests.includes(item.chestId);
                return (
                  <div
                    key={item.id}
                    className="absolute flex flex-col items-center z-10"
                    style={{
                      left: `${item.x}px`,
                      top: `${item.y}px`,
                      transform: "translate(-50%, -50%)"
                    }}
                  >
                    <button
                      onClick={() => handleOpenChest(item)}
                      className={`btn-3d ${
                        isOpened ? "btn-3d-white opacity-80" : "btn-3d-gold animate-bounce-pop"
                      } w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all`}
                      title={isOpened ? "Reward already claimed" : "Claim Mystery Reward!"}
                    >
                      <Gift
                        size={26}
                        className={isOpened ? "text-slate-400" : "text-white fill-white/20"}
                      />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#777] mt-1.5 bg-white/95 px-2.5 py-0.5 rounded-full border border-[#e5e5e5] shadow-xs">
                      {isOpened ? (isTa ? "திறக்கப்பட்டது" : "CLAIMED") : `+${item.gems} GEMS`}
                    </span>
                  </div>
                );
              }

              // 2. FINISH PEDESTAL
              if (item.type === "finish") {
                return (
                  <div
                    key={item.id}
                    className="absolute flex flex-col items-center z-10"
                    style={{
                      left: `${item.x}px`,
                      top: `${item.y}px`,
                      transform: "translate(-50%, -50%)"
                    }}
                  >
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-b from-amber-100 to-amber-200 border-4 border-amber-400 flex items-center justify-center shadow-lg">
                      <Trophy size={30} className="text-amber-600 fill-amber-400" />
                    </div>
                    <div className="mt-2 bg-white/90 border border-slate-200 px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                      <Flag size={13} className="text-slate-500" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                        {isTa ? "பிரிவு 1 நிறைவு" : "SECTION 1 FINISH"}
                      </span>
                    </div>
                  </div>
                );
              }

              // 3. LEARNING REALM NODES
              const content = isTa ? item.ta : item.en;
              const Icon = item.icon;
              const isActive = !!item.isActive;

              return (
                <div
                  key={item.id}
                  className="absolute flex flex-col items-center z-10"
                  style={{
                    left: `${item.x}px`,
                    top: `${item.y}px`,
                    transform: "translate(-50%, -50%)"
                  }}
                >
                  {/* Duolingo Bouncing "START HERE" Speech Bubble above active node */}
                  {isActive && (
                    <div className="absolute -top-11 flex flex-col items-center animate-token-float pointer-events-none z-20">
                      <div className="bg-white border-2 border-[#58cc02] rounded-xl px-3 py-1 shadow-md text-[11px] font-black text-[#58cc02] whitespace-nowrap tracking-wide uppercase">
                        {isTa ? "இங்கே தொடங்கு!" : "START HERE!"}
                      </div>
                      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#58cc02] -mt-0.5" />
                    </div>
                  )}

                  {/* 3D Round Node Button */}
                  <button
                    onClick={() => setSelectedUnit(item)}
                    className={`btn-3d ${item.buttonClass} w-[74px] h-[74px] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all group`}
                    title={content.title}
                  >
                    <Icon
                      size={32}
                      strokeWidth={2.5}
                      className="group-hover:scale-110 transition-transform"
                    />
                  </button>

                  {/* Clean Title Label Badge */}
                  <span
                    className={`mt-2 text-xs font-black tracking-wide px-3.5 py-1 rounded-xl border shadow-xs whitespace-nowrap ${item.badgeBg}`}
                  >
                    {content.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Right Column: Balanced Sticky Duolingo/RPG Sidebar ───────────── */}
        <div className="w-full lg:w-[360px] lg:sticky lg:top-24 space-y-5">
          
          {/* Daily Quests Card */}
          <div className="bg-white border-2 border-[#e5e5e5] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-sm text-[#4b4b4b] uppercase tracking-wide">
                {isTa ? "இன்றைய இலக்குகள்" : "Daily Quests"}
              </h2>
              <span className="text-xs font-black text-[#1cb0f6] cursor-pointer hover:underline">
                {isTa ? "அனைத்தும்" : "VIEW ALL"}
              </span>
            </div>

            <div className="space-y-4">
              {/* Quest 1 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                  <Flame size={20} className="fill-orange-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span>{isTa ? "AI சம்சயம் தீர்க்க" : "Ask AI Oracle 1 doubt"}</span>
                    <span className="text-[#999]">0 / 1</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#e5e5e5] rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full w-[25%]" />
                  </div>
                </div>
              </div>

              {/* Quest 2 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-500 shrink-0">
                  <Zap size={20} className="fill-sky-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span>{isTa ? "மாதிரித் தேர்வு பயிற்சி" : "Score 80%+ on a test"}</span>
                    <span className="text-[#58cc02] font-black">1 / 1</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#e5e5e5] rounded-full overflow-hidden">
                    <div className="h-full bg-[#58cc02] rounded-full w-[100%]" />
                  </div>
                </div>
              </div>

              {/* Quest 3 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                  <Layers size={20} className="text-amber-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span>{isTa ? "கருத்து அட்டைகள் திருப்பு" : "Flip 3 memory flashcards"}</span>
                    <span className="text-[#58cc02] font-black">3 / 3</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#e5e5e5] rounded-full overflow-hidden">
                    <div className="h-full bg-[#58cc02] rounded-full w-[100%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Emerald League Leaderboard Card */}
          <div className="bg-white border-2 border-[#e5e5e5] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-yellow-500 fill-yellow-400" />
                <h3 className="font-black text-sm text-[#4b4b4b] uppercase tracking-wide">
                  {isTa ? "மரகத லீக்" : "Emerald League"}
                </h3>
              </div>
              <span className="text-xs font-black text-[#58cc02] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {isTa ? "நிலை 3" : "#3 RANK"}
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                { rank: 1, name: "Karthikeyan", xp: "460 XP", badge: "🥇" },
                { rank: 2, name: "Priya Sundar", xp: "410 XP", badge: "🥈" },
                { rank: 3, name: isTa ? "நீங்கள் (You)" : "You (Adventurer)", xp: `${gems} XP`, badge: "🥉", isUser: true },
                { rank: 4, name: "Anbuchelvan", xp: "310 XP" },
                { rank: 5, name: "Meena R.", xp: "280 XP" }
              ].map((item) => (
                <div
                  key={item.rank}
                  className={`flex items-center justify-between p-2 rounded-xl ${
                    item.isUser ? "bg-emerald-50 border-2 border-[#58cc02]" : "hover:bg-[#f7f7f7]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-black text-xs text-[#999] w-4 text-center">
                      {item.badge || item.rank}
                    </span>
                    <span className={`font-bold text-xs sm:text-sm ${item.isUser ? "text-[#58cc02]" : "text-[#4b4b4b]"}`}>
                      {item.name}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-black text-[#777]">
                    {item.xp}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Big Action / Continue Button */}
          <button
            onClick={() => onNavigate("/chat")}
            className="btn-3d btn-3d-green w-full py-4 rounded-2xl font-black text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 shadow-md"
          >
            <Play size={18} className="fill-white" />
            <span>{isTa ? "பயிற்சியைத் தொடர்" : "CONTINUE LEARNING"}</span>
          </button>
        </div>
      </main>

      {/* ─── Level Launch Modal Popover ─────────────────────────────────────── */}
      <AnimatePresence>
        {selectedUnit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl border-4 border-[#e5e5e5] p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase text-[#999] tracking-wider">
                  STEP {selectedUnit.stepNumber} · REALM
                </span>
                <button
                  onClick={() => setSelectedUnit(null)}
                  className="text-slate-400 hover:text-slate-700 font-black text-lg p-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className={`w-16 h-16 rounded-2xl ${selectedUnit.buttonClass} text-white flex items-center justify-center shadow-md`}>
                  <selectedUnit.icon size={32} strokeWidth={2.5} />
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-2xl">
                  <Star size={16} className="fill-yellow-400 text-yellow-500" />
                  <Star size={16} className="fill-yellow-400 text-yellow-500" />
                  <Star size={16} className="text-slate-300" />
                </div>
              </div>

              <h3 className="text-2xl font-black text-[#3c3c3c] tracking-tight">
                {isTa ? selectedUnit.ta.levelName : selectedUnit.en.levelName}
              </h3>

              <p className="text-xs font-extrabold text-[#58cc02] uppercase tracking-wide mt-1">
                {isTa ? selectedUnit.ta.unitSubtitle : selectedUnit.en.unitSubtitle}
              </p>

              <p className="text-sm font-semibold text-[#666] mt-2 leading-relaxed">
                {isTa ? selectedUnit.ta.desc : selectedUnit.en.desc}
              </p>

              <div className="mt-5 p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black text-amber-800">
                  <Sparkles size={16} className="text-amber-500 fill-amber-400" />
                  <span>{isTa ? "வெற்றி வெகுமதி:" : "Completion Reward:"}</span>
                </div>
                <span className="font-mono font-black text-sm text-amber-700">
                  +{selectedUnit.xpReward} XP
                </span>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => handleStartUnit(selectedUnit)}
                  className={`btn-3d ${selectedUnit.buttonClass} flex-1 py-3.5 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2`}
                >
                  <span>{isTa ? selectedUnit.ta.cta : selectedUnit.en.cta}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Mystery Chest Reward Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {chestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 30 }}
              className="bg-white rounded-3xl border-4 border-yellow-400 p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 rounded-full bg-yellow-100 border-4 border-yellow-400 flex items-center justify-center mx-auto mb-4 animate-bounce-pop">
                <Gem size={38} className="text-yellow-500 fill-yellow-400" />
              </div>

              <h3 className="text-2xl font-black text-[#3c3c3c]">
                {isTa ? "பரிசு கிடைத்தது!" : "CHEST UNLOCKED!"}
              </h3>

              <p className="text-sm font-bold text-[#777] mt-1">
                {isTa
                  ? `நீங்கள் +${chestModal.gems} மணிகளை வென்றுள்ளீர்கள்!`
                  : `You claimed +${chestModal.gems} Knowledge Gems!`}
              </p>

              <button
                onClick={() => setChestModal(null)}
                className="btn-3d btn-3d-gold w-full mt-6 py-3.5 rounded-2xl font-black text-base uppercase"
              >
                {isTa ? "நன்றி!" : "AWESOME!"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Duolingo Unit 1 Guidebook Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {showGuidebook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl border-4 border-[#e5e5e5] p-6 sm:p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#58cc02] flex items-center justify-center">
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#999] tracking-wider">
                      {isTa ? "அலகு 1 கையேடு" : "UNIT 1 GUIDEBOOK"}
                    </span>
                    <h3 className="text-lg font-black text-[#3c3c3c]">
                      {isTa ? "முக்கிய பாடக் குறிப்புகள்" : "Curriculum Mastery Key Notes"}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowGuidebook(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-black flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 py-4 text-sm text-slate-600 leading-relaxed">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <h4 className="font-black text-emerald-800 text-sm mb-1 flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    {isTa ? "பிரிவு நோக்கம்" : "Unit Objective"}
                  </h4>
                  <p className="text-xs text-emerald-900/80 font-medium">
                    {isTa
                      ? "தமிழ்நாடு மாநிலக் கல்வி மற்றும் பொதுத் தேர்வுகளுக்கான முக்கியக் கோட்பாடுகளை விரைவாகவும் முழுமையாகவும் பயிலுதல்."
                      : "Master core state board concepts, laws, and examination patterns through gamified recall, mock arenas, and AI socratic coaching."}
                  </p>
                </div>

                <div>
                  <h4 className="font-black text-slate-800 text-sm mb-2">
                    {isTa ? "அலகு படிகள் & வெகுமதிகள்" : "Step Sequence & XP Yield"}
                  </h4>
                  <div className="space-y-2">
                    {[
                      { step: "Step 1", title: isTa ? "AI குரு (Oracle)" : "AI Oracle", reward: "20 XP" },
                      { step: "Step 2", title: isTa ? "தேர்வுக் களம் (Exam Arena)" : "Exam Arena", reward: "35 XP" },
                      { step: "Step 3", title: isTa ? "அட்டைகள் (Flashcards)" : "Memory Runes", reward: "25 XP" },
                      { step: "Step 4", title: isTa ? "வரைபடம் (Mind Maps)" : "Mind Maps", reward: "30 XP" },
                      { step: "Step 5", title: isTa ? "நேரடிப் போட்டி (Live Quiz)" : "Thunder Colosseum", reward: "40 XP" },
                      { step: "Step 6", title: isTa ? "ஆசிரியர் தளம் (Teacher Hub)" : "Teacher Observatory", reward: "15 XP" }
                    ].map((stepItem, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                      >
                        <span className="text-slate-500 font-mono">{stepItem.step}</span>
                        <span className="text-slate-800">{stepItem.title}</span>
                        <span className="text-[#58cc02] font-black">{stepItem.reward}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
                  <h4 className="font-black text-sky-800 text-sm mb-1">
                    {isTa ? "💡 விரைவு யோசனை" : "💡 Pro Tip"}
                  </h4>
                  <p className="text-xs text-sky-900/80 font-medium">
                    {isTa
                      ? "தினசரி வினாடி வினாக்களில் பங்கேற்று உங்கள் தொடர் வெற்றியை (Streak) தக்கவைத்துக் கொள்ளுங்கள். தொடர் வெற்றி உங்களுக்கு கூடுதல் வைரங்களை வழங்கும்!"
                      : "Complete daily quests consecutively to level up your streak flame and earn bonus mystery chests in the Emerald League!"}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowGuidebook(false)}
                  className="btn-3d btn-3d-green w-full py-3 rounded-xl font-black text-sm uppercase"
                >
                  {isTa ? "புரிந்தது, தொடங்கு" : "GOT IT, LET'S GO!"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Interactive Movie Character Wisdom Modal ──────────────────────── */}
      <AnimatePresence>
        {activeCharacter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 25 }}
              className="bg-white rounded-3xl border-4 border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {activeCharacter.universe}
                </span>
                <button
                  onClick={() => setActiveCharacter(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-black flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Character Avatar Emoji Icon */}
              <div className="w-20 h-20 mx-auto mb-3 flex items-center justify-center bg-slate-50 border-4 border-slate-200 rounded-3xl shadow-inner text-4xl animate-bounce-pop">
                {activeCharacter.emoji}
              </div>

              <h3 className="text-xl font-black text-slate-800">
                {activeCharacter.name}
              </h3>
              <p className="text-xs font-bold text-slate-500 mb-4">
                {isTa ? activeCharacter.taTitle : activeCharacter.title}
              </p>

              {/* Dialogue Speech Bubble */}
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 relative mb-5 text-left">
                <div className="text-sm font-semibold text-slate-700 italic leading-relaxed">
                  "{isTa ? activeCharacter.quoteTa : activeCharacter.quoteEn}"
                </div>
              </div>

              {/* Wisdom Reward Claim Action */}
              <div className="space-y-3">
                {!claimedWisdoms.includes(activeCharacter.id) ? (
                  <button
                    onClick={() => handleClaimWisdom(activeCharacter)}
                    className="btn-3d btn-3d-gold w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 animate-bounce-pop shadow-md"
                  >
                    <Sparkles size={18} className="fill-white" />
                    <span>
                      {isTa
                        ? `ஞான வெகுமதியைப் பெறு (+${activeCharacter.wisdomReward} வைரங்கள்)`
                        : `CLAIM WISDOM BONUS (+${activeCharacter.wisdomReward} GEMS)`}
                    </span>
                  </button>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-black text-emerald-700 flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>{isTa ? "வெகுமதி பெறப்பட்டுவிட்டது!" : "Wisdom bonus already claimed!"}</span>
                  </div>
                )}

                <button
                  onClick={() => setActiveCharacter(null)}
                  className="btn-3d btn-3d-white w-full py-3 rounded-xl font-bold text-xs text-slate-600 uppercase"
                >
                  {isTa ? "நன்றி! தொடர்கிறேன்" : "THANKS! BACK TO TRAIL"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;

