import React from "react";
import {
  ArrowLeft,
  MessageSquare,
  GraduationCap,
  Layers,
  Network,
  Trophy,
  Flame,
  Gem,
  Heart,
  Trash2,
} from "lucide-react";
import BrandLogo from "../BrandLogo";

/**
 * Unified Global Navigation Header
 * Matches the platform standard:
 * [BrandLogo | ← Trail]  [Tutor | Trials | Runes | MindMap | Arena]  [🔥 Streak | 💎 Gems | ❤️ Hearts | EN]
 */
const AppHeader = ({
  currentPath = "/",
  onNavigate,
  onBack,
  canGoBack = true,
  streak = 4,
  gems = 345,
  hearts = 5,
  language = "en",
  onToggleLanguage,
  onClearChat = null,
}) => {
  const isTa = language === "ta";

  const NAV_ITEMS = [
    {
      id: "tutor",
      path: "/chat",
      labelEn: "Tutor",
      labelTa: "ஆசான்",
      icon: MessageSquare,
      color: "#58cc02",
      activeBg: "bg-white text-[#58cc02] shadow-sm border border-[#e5e5e5]",
      inactiveText: "text-[#555] hover:text-[#58cc02] hover:bg-white",
    },
    {
      id: "trials",
      path: "/test",
      labelEn: "Trials",
      labelTa: "தேர்வுகள்",
      icon: GraduationCap,
      color: "#1cb0f6",
      activeBg: "bg-white text-[#1cb0f6] shadow-sm border border-[#e5e5e5]",
      inactiveText: "text-[#555] hover:text-[#1cb0f6] hover:bg-white",
    },
    {
      id: "runes",
      path: "/flashcards",
      labelEn: "Runes",
      labelTa: "அட்டைகள்",
      icon: Layers,
      color: "#ffc800",
      activeBg: "bg-white text-[#ffc800] shadow-sm border border-[#e5e5e5]",
      inactiveText: "text-[#555] hover:text-[#ffc800] hover:bg-white",
    },
    {
      id: "mindmap",
      path: "/mindmap",
      labelEn: "MindMap",
      labelTa: "வரைபடம்",
      icon: Network,
      color: "#af70e6",
      activeBg: "bg-white text-[#af70e6] shadow-sm border border-[#e5e5e5]",
      inactiveText: "text-[#555] hover:text-[#af70e6] hover:bg-white",
    },
    {
      id: "arena",
      path: "/kahoot",
      labelEn: "Arena",
      labelTa: "வினாடி வினா",
      icon: Trophy,
      color: "#ff4b4b",
      activeBg: "bg-white text-[#ff4b4b] shadow-sm border border-[#e5e5e5]",
      inactiveText: "text-[#555] hover:text-[#ff4b4b] hover:bg-white",
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-[#e5e5e5] px-3 sm:px-6 py-2.5 shadow-sm select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
        
        {/* ─── Left: Brand Logo & Trail Back Button ───────────────────────── */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => onNavigate("/")}
            className="cursor-pointer hover:opacity-85 transition-opacity flex items-center"
            title={isTa ? "முகப்புப் பக்கம் (பாதை)" : "ArkEngine Home (Trail)"}
          >
            <BrandLogo height={28} />
          </button>

          <div className="h-5 w-px bg-[#e5e5e5] hidden sm:block" />

          <button
            onClick={onBack}
            disabled={!canGoBack && currentPath === "/"}
            className={`btn-3d btn-3d-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-colors ${
              !canGoBack && currentPath === "/"
                ? "opacity-50 cursor-not-allowed text-slate-400"
                : "text-[#4b4b4b] hover:text-[#58cc02] cursor-pointer"
            }`}
            title={isTa ? "முந்தைய பக்கத்திற்குத் திரும்பு" : "Go back to previous page"}
          >
            <ArrowLeft size={15} className="text-[#58cc02]" strokeWidth={3} />
            <span className="font-bold">
              {isTa ? "பாதை" : "Trail"}
            </span>
          </button>
        </div>

        {/* ─── Center: Dedicated Module Navigation Hub ────────────────────── */}
        <nav className="hidden sm:flex items-center bg-[#f7f7f7] p-1 rounded-2xl border border-[#e5e5e5] shadow-inner gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  isActive ? item.activeBg : item.inactiveText
                }`}
                title={isTa ? item.labelTa : item.labelEn}
              >
                <Icon
                  size={15}
                  style={{ color: item.color }}
                  className="shrink-0"
                />
                <span>{isTa ? item.labelTa : item.labelEn}</span>
              </button>
            );
          })}
        </nav>

        {/* ─── Right: Gamification Stats HUD & Controls ───────────────────── */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Streak */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-50 text-orange-500 font-black text-xs border border-orange-200 shadow-sm"
            title={isTa ? "தினசரி தொடர்" : "Day Streak"}
          >
            <Flame size={15} className="fill-orange-500 animate-pulse" />
            <span>{streak}</span>
          </div>

          {/* Gems */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-50 text-sky-500 font-black text-xs border border-sky-200 shadow-sm"
            title={isTa ? "அறிவு மணிகள்" : "Knowledge Gems"}
          >
            <Gem size={15} className="fill-sky-500" />
            <span>{gems}</span>
          </div>

          {/* Hearts */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-500 font-black text-xs border border-rose-200 shadow-sm"
            title={isTa ? "உயிர்கள்" : "Hearts Remaining"}
          >
            <Heart size={15} className="fill-rose-500" />
            <span>{hearts}</span>
          </div>

          <div className="h-5 w-px bg-[#e5e5e5] mx-0.5 hidden sm:block" />

          {/* Language Toggle */}
          <button
            onClick={onToggleLanguage}
            title={isTa ? "Switch to English" : "தமிழுக்கு மாற்றவும்"}
            className="btn-3d btn-3d-white px-2.5 py-1.5 rounded-xl text-xs font-black text-[#1cb0f6]"
          >
            {isTa ? "தமிழ்" : "EN"}
          </button>

          {/* Clear Chat Button (visible only when in /chat with active messages) */}
          {currentPath === "/chat" && onClearChat && (
            <button
              onClick={onClearChat}
              className="btn-3d btn-3d-white p-2 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
              title={isTa ? "உரையாடலை அழிக்க" : "Clear Chat"}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

export default AppHeader;
