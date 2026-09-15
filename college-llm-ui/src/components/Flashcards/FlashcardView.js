import React, { useState, useEffect, useCallback, useMemo } from "react";
import { fetchFlashcards } from "../../api";
import sounds from "../../utils/soundEffects";
import {
  Search,
  Layers,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  RefreshCw,
  MousePointerClick,
  Volume2,
  VolumeX,
  Star,
  CheckCircle2,
  Shuffle,
  Flame,
  Trophy,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Description rendered as bullet points ─────────────────────────── */
const toPoints = (description) =>
  Array.isArray(description) ? description : description ? [description] : [];

const PointList = ({ points }) => (
  <ul className="mt-4 space-y-2.5">
    {points.map((point, i) => (
      <li key={i} className="flex gap-2.5 text-xs sm:text-[14.5px] font-semibold leading-relaxed text-slate-700">
        <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-[#1cb0f6] shadow-xs" />
        <span>{point}</span>
      </li>
    ))}
  </ul>
);

/* ── Hero artwork for the detail face ────────────────────────────────────────── */
const CardHero = ({ card }) => {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [card.id, card.image]);

  if (card.image && !broken) {
    return (
      <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-100 shrink-0">
        <img
          src={card.image}
          alt={card.title}
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
        <span className="absolute bottom-3 left-4 rounded-xl bg-white/95 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-800 shadow-md backdrop-blur-md border border-white/60">
          {card.deck}
        </span>
      </div>
    );
  }

  return (
    <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 border-b-2 border-[#e5e5e5] flex items-center justify-center shrink-0">
      <Layers size={44} className="text-slate-400 opacity-60" />
      <span className="absolute bottom-3 left-4 rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-white text-slate-700 border border-[#e5e5e5] shadow-xs">
        {card.deck}
      </span>
    </div>
  );
};

/* ── Interactive Grid Tile: with inline flip preview & mastery indicators ───── */
const CardTile = ({ card, index, onOpen, onToggleStar, isStarred, isMastered, isTa }) => {
  const [imgBroken, setImgBroken] = useState(false);

  useEffect(() => {
    setImgBroken(false);
  }, [card.id, card.image]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
      whileHover={{ y: -6 }}
      className="group relative flex aspect-[4/5] w-full flex-col overflow-hidden rounded-3xl border-2 border-[#e5e5e5] bg-white p-0 text-left shadow-[0_4px_0_0_#e5e5e5] transition-all hover:border-[#1cb0f6] hover:shadow-[0_6px_0_0_#1899d6] cursor-pointer select-none"
      onClick={onOpen}
    >
      {/* Top Image Preview Area */}
      <div className="relative h-36 sm:h-44 w-full overflow-hidden bg-slate-100 shrink-0">
        {card.image && !imgBroken ? (
          <img
            src={card.image}
            alt={card.title}
            referrerPolicy="no-referrer"
            onError={() => setImgBroken(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <Layers size={36} className="text-slate-400 opacity-60" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

        {/* Deck Category Pill */}
        <div className="absolute top-3 left-3">
          <span className="rounded-xl px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-white/95 text-slate-800 shadow-sm backdrop-blur-md border border-white/60">
            {card.deck}
          </span>
        </div>

        {/* Interactive Star Bookmark Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar(card.id);
          }}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-400 hover:text-amber-500 shadow-sm backdrop-blur-md transition-all active:scale-90"
          title={isStarred ? "Remove Bookmark" : "Bookmark this concept"}
        >
          <Star size={15} className={isStarred ? "fill-amber-400 text-amber-500" : ""} />
        </button>

        {/* Mastered Badge */}
        {isMastered && (
          <div className="absolute bottom-2.5 left-3 flex items-center gap-1 bg-emerald-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-black shadow-xs">
            <CheckCircle2 size={11} strokeWidth={3} />
            <span>{isTa ? "கற்றது" : "Mastered"}</span>
          </div>
        )}
      </div>

      {/* Bottom Title & Action Bar */}
      <div className="flex flex-1 flex-col justify-between p-4 bg-white">
        <h3 className="text-sm sm:text-base font-extrabold leading-snug tracking-tight text-slate-900 line-clamp-2">
          {card.title}
        </h3>

        <div className="mt-2.5 flex items-center justify-between border-t border-[#f0f2f5] pt-2">
          <div className="flex items-center gap-1 text-[11px] font-black text-[#1cb0f6] group-hover:text-[#007AFF]">
            <MousePointerClick size={13} />
            <span>{isTa ? "தட்டிப் புரட்டு" : "Tap to flip"}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 font-mono">
            #{index + 1}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

/* ── Interactive 3D Flip Card Modal & Active Recall Study Screen ─────────────── */
const ExpandedCard = ({
  card,
  position,
  total,
  onClose,
  onPrev,
  onNext,
  onMarkMastered,
  onMarkReview,
  isMastered,
  isStarred,
  onToggleStar,
  isTa
}) => {
  const [showDetail, setShowDetail] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Flip automatically on card switch
  useEffect(() => {
    setShowDetail(false);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    const timer = setTimeout(() => setShowDetail(true), 120);
    return () => clearTimeout(timer);
  }, [card.id]);

  const handleFlipCard = () => {
    sounds.playPop();
    setShowDetail((prev) => !prev);
  };

  // Text-to-Speech audio reader for concept
  const toggleSpeakConcept = (e) => {
    e.stopPropagation();
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const points = toPoints(card.description);
    const textToRead = `${card.title}. ${points.join(". ")}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = isTa ? "ta-IN" : "en-US";
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="w-full max-w-2xl px-3" style={{ perspective: 2400 }}>
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 12 }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="space-y-4"
      >
        {/* 3D Flip Container */}
        <motion.div
          className="relative w-full cursor-pointer"
          style={{ transformStyle: "preserve-3d" }}
          initial={{ rotateY: 180 }}
          animate={{ rotateY: showDetail ? 0 : 180 }}
          transition={{ type: "spring", stiffness: 85, damping: 15 }}
          onClick={handleFlipCard}
        >
          {/* ─── Detail Face (Back of Card) ──────────────────────────────── */}
          <div
            className="overflow-hidden rounded-3xl bg-white border-2 border-[#e5e5e5] shadow-[0_12px_0_0_#e5e5e5]"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            <CardHero card={card} />

            <div className="max-h-[42vh] overflow-y-auto px-6 py-5 sm:px-7 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900">
                  {card.title}
                </h2>

                {/* Speech audio & Star buttons */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={toggleSpeakConcept}
                    className={`p-2 rounded-xl border-2 transition-all ${
                      isSpeaking
                        ? "bg-emerald-500 text-white border-emerald-600 animate-pulse shadow-sm"
                        : "bg-[#f7f7f7] text-slate-600 border-[#e5e5e5] hover:text-[#1cb0f6] hover:border-[#1cb0f6]"
                    }`}
                    title={isSpeaking ? "Stop Reading" : "Read Aloud"}
                  >
                    {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleStar(card.id)}
                    className="p-2 rounded-xl bg-[#f7f7f7] border-2 border-[#e5e5e5] hover:border-amber-400 text-slate-400 hover:text-amber-500 transition-all shadow-xs"
                    title="Bookmark this card"
                  >
                    <Star size={15} className={isStarred ? "fill-amber-400 text-amber-500" : ""} />
                  </button>
                </div>
              </div>

              <div className="h-1 w-14 rounded-full bg-[#1cb0f6]" />
              <PointList points={toPoints(card.description)} />
            </div>

            {/* Bottom flip prompt & active feedback actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-t-2 border-[#f0f2f5] bg-[#f9fafb] px-6 py-3.5 gap-2.5">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <RotateCcw size={13} />
                  <span>{isTa ? "மீண்டும் திருப்ப தட்டவும்" : "Tap card to flip back"}</span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-[11px] font-mono text-slate-400">[Space] to flip</span>
              </div>

              {/* Active Recall Self-Assessment Buttons */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    onMarkReview(card.id);
                  }}
                  className="btn-3d btn-3d-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-amber-600 hover:text-amber-700"
                  title="Need to practice this more"
                >
                  <RotateCcw size={13} />
                  <span>{isTa ? "பயிற்சி தேவை" : "Review Again"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playSuccess();
                    onMarkMastered(card.id);
                  }}
                  className="btn-3d btn-3d-green flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-white shadow-sm"
                  title="I know this concept!"
                >
                  <CheckCircle2 size={14} strokeWidth={3} />
                  <span>{isTa ? "நன்கு புரிந்தது!" : "Got it!"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ─── Title Face (Front of Card) ──────────────────────────────── */}
          <div
            className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-3xl bg-white border-2 border-[#e5e5e5] p-8 shadow-[0_12px_0_0_#e5e5e5]"
            style={{
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                {card.deck}
              </span>

              {isMastered && (
                <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-lg text-xs font-black">
                  <CheckCircle2 size={13} />
                  <span>{isTa ? "கற்றது" : "Mastered"}</span>
                </span>
              )}
            </div>

            <div className="space-y-3 py-6 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-[#1cb0f6] tracking-wider">
                <Sparkles size={14} />
                <span>{isTa ? "செயல் நினைவாற்றல் சவால்" : "Active Recall Challenge"}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight text-slate-900">
                {card.title}
              </h2>
            </div>

            <div className="flex items-center justify-between pt-4 border-t-2 border-[#f0f2f5]">
              <div className="flex items-center gap-2 text-xs font-black text-[#1cb0f6]">
                <MousePointerClick size={15} />
                <span>{isTa ? "விளக்கத்தைக் காண தட்டவும்" : "Tap or press Space to reveal explanation"}</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {position} / {total}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ─── Tactile Modal Nav Controls Bar ─────────────────────────────── */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrev}
              disabled={total < 2}
              className="btn-3d btn-3d-white p-2.5 rounded-xl text-slate-700 disabled:opacity-30"
              title="Previous Card [Left Arrow]"
            >
              <ChevronLeft size={18} strokeWidth={3} />
            </button>

            <span className="px-3.5 py-1.5 rounded-xl bg-white border-2 border-[#e5e5e5] text-xs font-black text-slate-800 shadow-xs font-mono">
              {position} / {total}
            </span>

            <button
              type="button"
              onClick={onNext}
              disabled={total < 2}
              className="btn-3d btn-3d-white p-2.5 rounded-xl text-slate-700 disabled:opacity-30"
              title="Next Card [Right Arrow]"
            >
              <ChevronRight size={18} strokeWidth={3} />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-3d btn-3d-white flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-slate-700 shadow-sm"
          >
            <X size={15} strokeWidth={3} />
            <span>{isTa ? "மூடு" : "Close"}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ── Main Module: Deck Browser & Active Recall Gym ───────────────────────────── */
const FlashcardView = ({ language = "en" }) => {
  const isTa = language === "ta";

  const [cards, setCards] = useState([]);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & State
  const [activeDeck, setActiveDeck] = useState("All");
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState(null);
  const [onlyStarred, setOnlyStarred] = useState(false);

  // Gamification & Spaced Repetition State (Stored in localStorage)
  const [masteredMap, setMasteredMap] = useState(() => {
    try {
      const saved = localStorage.getItem("ark_flashcard_mastered");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [starredMap, setStarredMap] = useState(() => {
    try {
      const saved = localStorage.getItem("ark_flashcard_starred");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const loadCards = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchFlashcards(language, "All");
      setCards(data.cards || []);
      setDecks(data.decks || []);
    } catch (err) {
      console.error("Failed to load flashcards:", err);
      setError(
        isTa
          ? "அட்டைகளை ஏற்ற முடியவில்லை. சேவையகத்தைச் சரிபார்க்கவும்."
          : "Could not load the cards. Please check the server."
      );
    } finally {
      setLoading(false);
    }
  }, [language, isTa]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // Sync mastery & starred state to localStorage
  const handleToggleStar = (cardId) => {
    sounds.playPop();
    setStarredMap((prev) => {
      const next = { ...prev, [cardId]: !prev[cardId] };
      try {
        localStorage.setItem("ark_flashcard_starred", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleMarkMastered = (cardId) => {
    setMasteredMap((prev) => {
      const next = { ...prev, [cardId]: true };
      try {
        localStorage.setItem("ark_flashcard_mastered", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    // Auto advance to next card after brief moment
    setTimeout(() => {
      step(1);
    }, 400);
  };

  const handleMarkReview = (cardId) => {
    setMasteredMap((prev) => {
      const next = { ...prev, [cardId]: false };
      try {
        localStorage.setItem("ark_flashcard_mastered", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    setTimeout(() => {
      step(1);
    }, 400);
  };

  // Shuffle Cards Deck
  const handleShuffleDeck = () => {
    sounds.playClick();
    setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  const visibleCards = useMemo(() => {
    const term = search.trim().toLowerCase();
    return cards.filter((card) => {
      const inDeck = activeDeck === "All" || card.deck === activeDeck;
      if (!inDeck) return false;
      if (onlyStarred && !starredMap[card.id]) return false;
      if (!term) return true;
      const body = toPoints(card.description).join(" ").toLowerCase();
      return (
        card.title.toLowerCase().includes(term) ||
        body.includes(term) ||
        card.deck.toLowerCase().includes(term)
      );
    });
  }, [cards, activeDeck, search, onlyStarred, starredMap]);

  useEffect(() => {
    setOpenIndex(null);
  }, [activeDeck, search, onlyStarred]);

  const step = useCallback(
    (delta) => {
      sounds.playClick();
      setOpenIndex((current) => {
        if (current === null || visibleCards.length === 0) return current;
        return (current + delta + visibleCards.length) % visibleCards.length;
      });
    },
    [visibleCards.length]
  );

  // Keyboard navigation while modal is open
  useEffect(() => {
    if (openIndex === null) return undefined;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpenIndex(null);
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };

    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex, step]);

  const openCard = openIndex !== null ? visibleCards[openIndex] : null;

  // Deck Stats
  const totalCardsCount = cards.length;
  const masteredCount = useMemo(() => {
    return cards.filter((c) => masteredMap[c.id]).length;
  }, [cards, masteredMap]);
  const starredCount = useMemo(() => {
    return cards.filter((c) => starredMap[c.id]).length;
  }, [cards, starredMap]);
  const masteryPercentage = totalCardsCount > 0 ? Math.round((masteredCount / totalCardsCount) * 100) : 0;

  return (
    <div className="space-y-6">

      {/* ─── Interactive Deck HUD Banner ──────────────────────────────────── */}
      <div className="bg-white border-2 border-[#e5e5e5] p-5 sm:p-6 rounded-3xl shadow-[0_6px_0_0_#e5e5e5] space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#ffc800]">
              <Layers size={14} />
              <span>{isTa ? "செயல் நினைவாற்றல் களஞ்சியம்" : "Vault of Memory Runes"}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {isTa ? "கருத்து நினைவாற்றல் அட்டைகள்" : "Concept Flashcards & Active Recall"}
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {isTa
                ? "கருத்துக்களை நினைவுகூர்ந்து அட்டையைத் தட்டி சரிபாருங்கள். தேர்வுக்குத் தயாராகுங்கள்!"
                : "Active recall flashcards for fast syllabus review. Tap any card to flip and test yourself."}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleShuffleDeck}
              className="btn-3d btn-3d-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-slate-700"
              title="Shuffle Cards Deck"
            >
              <Shuffle size={14} className="text-[#1cb0f6]" />
              <span>{isTa ? "கலக்கு" : "Shuffle"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                loadCards();
              }}
              className="btn-3d btn-3d-white flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-[#ffc800]"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-[#ffc800]" : ""} />
              <span>{isTa ? "புதுப்பிக்க" : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Gamified Mastery Progress Track */}
        <div className="p-3.5 rounded-2xl bg-[#f9fafb] border-2 border-[#e5e5e5] space-y-2">
          <div className="flex items-center justify-between text-xs font-black">
            <div className="flex items-center gap-2">
              <Trophy size={15} className="text-[#ffc800]" />
              <span className="text-slate-600 uppercase tracking-wider">
                {isTa ? "கற்றல் அடைவு முன்னேற்றம்" : "Active Recall Mastery"}
              </span>
              <span className="text-[#58cc02] font-black">
                {masteredCount} / {totalCardsCount}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-amber-600 font-bold flex items-center gap-1">
                <Flame size={13} className="fill-amber-500" />
                {masteryPercentage}% {isTa ? "முழுமை" : "Mastered"}
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden p-0.5 border border-[#e5e5e5] shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-[#ffc800] to-[#58cc02] rounded-full shadow-sm"
              initial={{ width: 0 }}
              animate={{ width: `${masteryPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* ─── Search & Interactive Topic Pill Dock ──────────────────────────── */}
      <div className="bg-white border-2 border-[#e5e5e5] rounded-3xl p-4 sm:p-5 shadow-[0_4px_0_0_#e5e5e5] space-y-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isTa ? "கருத்து அல்லது பாடத்தைத் தேடுங்கள்..." : "Search a concept, topic, or keyword..."}
              className="w-full pl-10 pr-8 py-2 bg-[#f9fafb] border-2 border-[#e5e5e5] rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#1cb0f6] outline-none shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Starred Filter Pill Toggle */}
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setOnlyStarred(!onlyStarred);
            }}
            className={`btn-3d flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black shrink-0 ${
              onlyStarred
                ? "btn-3d-gold text-white"
                : "btn-3d-white text-slate-600 hover:text-amber-600"
            }`}
          >
            <Star size={14} className={onlyStarred ? "fill-white" : "fill-amber-400 text-amber-500"} />
            <span>{isTa ? "குறித்தவை" : "Starred"} ({starredCount})</span>
          </button>
        </div>

        {/* Deck Topic Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-[#f0f2f5]">
          {["All", ...decks].map((deck) => {
            const isActive = activeDeck === deck;
            return (
              <button
                key={deck}
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setActiveDeck(deck);
                }}
                className={`btn-3d px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  isActive
                    ? "btn-3d-blue text-white"
                    : "btn-3d-white text-slate-600 hover:text-slate-900"
                }`}
              >
                {deck === "All" ? (isTa ? "அனைத்து பாடங்கள்" : "All Topics") : deck}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Cards Grid ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="bg-white border-2 border-[#e5e5e5] rounded-3xl p-14 text-center text-slate-500 shadow-xs">
          <RefreshCw size={24} className="animate-spin text-[#ffc800] mx-auto mb-3" />
          <p className="font-black text-sm text-slate-700">
            {isTa ? "நினைவாற்றல் அட்டைகளைத் திரட்டுகிறது..." : "Summoning memory runes..."}
          </p>
        </div>
      ) : error ? (
        <div className="bg-white border-2 border-rose-200 rounded-3xl p-8 text-center text-rose-600 font-bold text-xs">
          {error}
        </div>
      ) : visibleCards.length === 0 ? (
        <div className="bg-white border-2 border-[#e5e5e5] rounded-3xl p-14 text-center text-slate-500 shadow-xs space-y-2">
          <BookOpen size={36} className="text-slate-300 mx-auto" />
          <h3 className="text-base font-black text-slate-800">
            {isTa ? "அட்டைகள் எதுவும் பொருந்தவில்லை" : "No Concept Runes Found"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isTa ? "தேடல் அல்லது வடிகட்டியை மாற்றி முயற்சிக்கவும்." : "Try clearing your search query or switching topics."}
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between text-xs font-black text-slate-500 px-1 mb-3">
            <span>
              {isTa ? "காண்பிக்கப்படும் அட்டைகள்" : "Showing Runes"}:{" "}
              <span className="text-[#1cb0f6] font-black">{visibleCards.length}</span>
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              {isTa ? "விரிவான பார்வைக்கு அட்டையைத் தட்டவும்" : "Tap any card to open 3D recall view"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {visibleCards.map((card, idx) => (
              <CardTile
                key={card.id}
                card={card}
                index={idx}
                onOpen={() => {
                  sounds.playPop();
                  setOpenIndex(idx);
                }}
                onToggleStar={handleToggleStar}
                isStarred={Boolean(starredMap[card.id])}
                isMastered={Boolean(masteredMap[card.id])}
                isTa={isTa}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── 3D Flip Card Modal Overlay ────────────────────────────────────── */}
      <AnimatePresence>
        {openCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md"
            onClick={() => setOpenIndex(null)}
          >
            <ExpandedCard
              card={openCard}
              position={openIndex + 1}
              total={visibleCards.length}
              onClose={() => setOpenIndex(null)}
              onPrev={() => step(-1)}
              onNext={() => step(1)}
              onMarkMastered={handleMarkMastered}
              onMarkReview={handleMarkReview}
              isMastered={Boolean(masteredMap[openCard.id])}
              isStarred={Boolean(starredMap[openCard.id])}
              onToggleStar={handleToggleStar}
              isTa={isTa}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FlashcardView;
