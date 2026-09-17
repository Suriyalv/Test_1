import React, { useState, useEffect, useCallback, useMemo } from "react";
import { fetchFlashcards } from "../../api";
import { getAccent } from "./flashcardTheme";
import { useCardProgress } from "./useCardProgress";
import { isDue, isOverloaded } from "./spacedRepetition";
import { logActivity } from "../../activity";
import {
  Search,
  Layers,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  MousePointerClick,
  CalendarClock,
  Brain,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Soft abstract shapes used on the light card faces ─────────────────────── */
const FaceDecor = () => (
  <>
    <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/50" />
    <div className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-white/40" />
    <div className="pointer-events-none absolute right-6 bottom-10 h-14 w-14 rounded-full bg-white/30" />
  </>
);

/* ── Description rendered as bullet points ─────────────────────────── */
// The API sends an array of points; older saved cards may still be a plain string.
const toPoints = (description) =>
  Array.isArray(description) ? description : description ? [description] : [];

const PointList = ({ points }) => (
  <ul className="mt-4 space-y-2.5">
    {points.map((point, i) => (
      <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-slate-700">
        <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-[#0284c7] to-[#38bdf8]" />
        <span>{point}</span>
      </li>
    ))}
  </ul>
);

/* ── Cognitive-load mitigation: reveal one point at a time instead of all at
   once. Triggered after two "Again" ratings in a row on the same card — the
   whole point list is already broken into small independently-readable
   chunks, so this is purely a rendering-mode switch, no new content needed. */
const ChunkedPointList = ({ points, isTa }) => {
  const [shown, setShown] = useState(1);

  useEffect(() => {
    setShown(1);
  }, [points]);

  const atEnd = shown >= points.length;

  return (
    <div className="mt-4">
      <div className="mb-2.5 flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-700">
        <Brain size={13} />
        {isTa
          ? "எளிதாக்கப்பட்டது — ஒரு புள்ளி ஒரு நேரத்தில்"
          : "Easy mode — one point at a time"}
      </div>
      <ul className="space-y-2.5">
        {points.slice(0, shown).map((point, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex gap-2.5 text-[15px] leading-relaxed text-slate-700"
          >
            <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-[#0284c7] to-[#38bdf8]" />
            <span>{point}</span>
          </motion.li>
        ))}
      </ul>
      {!atEnd && (
        <button
          type="button"
          onClick={() => setShown((s) => Math.min(s + 1, points.length))}
          className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800 transition-all hover:bg-amber-200 active:scale-95"
        >
          {isTa ? "அடுத்த புள்ளி" : "Next point"} ({shown}/{points.length})
        </button>
      )}
    </div>
  );
};

// Bundled card art lives in public/flashcards/ and is stored as "/flashcards/x.webp";
// prefix PUBLIC_URL so it still resolves when the app is served from a sub-path.
const resolveImage = (src) =>
  src && src.startsWith("/") ? `${process.env.PUBLIC_URL || ""}${src}` : src;

/* ── Hero artwork for the detail face ──────────────────────────────────────────
   Uses the card image when one is supplied, and degrades to a light gradient
   panel if the URL is missing or fails to load. Card art is a 16:9 diagram with
   labels baked in, so it is shown whole (contain) rather than cropped. */
const CardHero = ({ card, accent }) => {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [card.id]);

  if (card.image && !broken) {
    return (
      <div className="relative aspect-video max-h-[38vh] w-full overflow-hidden border-b border-slate-100 bg-white">
        <img
          src={resolveImage(card.image)}
          alt={card.title}
          onError={() => setBroken(true)}
          className="h-full w-full object-contain"
        />
        <span className="absolute left-3 top-3 rounded-full bg-slate-900/70 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          {card.deck}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative h-44 w-full overflow-hidden bg-gradient-to-br sm:h-56 ${accent.face}`}
    >
      <FaceDecor />
      <span
        className={`absolute bottom-3 left-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm ${accent.badge}`}
      >
        {card.deck}
      </span>
    </div>
  );
};

/* ── Grid tile: the closed card, title only ──────────────────────────────────── */
const CardTile = ({ card, index, onOpen, isTa, due }) => {
  const accent = getAccent(card.accent);

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.97 }}
      className={`group relative flex aspect-[4/5] w-full flex-col justify-between overflow-hidden rounded-2xl border-2 border-black/5 bg-gradient-to-br p-5 text-left shadow-lg transition-shadow hover:shadow-2xl ${accent.face} ${accent.glow} ${accent.ring}`}
    >
      <FaceDecor />

      <div className="relative flex items-start justify-between gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm ${accent.badge}`}
        >
          {card.deck}
        </span>
        {due && (
          <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#0284c7] backdrop-blur-sm">
            <CalendarClock size={10} />
            {isTa ? "இன்று" : "Due"}
          </span>
        )}
      </div>

      <div className="relative">
        <h3 className={`text-lg font-extrabold leading-snug tracking-tight sm:text-xl ${accent.title}`}>
          {card.title}
        </h3>
        <div className={`mt-3 flex items-center gap-1.5 text-[11px] font-semibold ${accent.muted}`}>
          <MousePointerClick size={13} />
          <span>{isTa ? "திருப்பிப் பார்க்க தட்டவும்" : "Tap to flip"}</span>
        </div>
      </div>
    </motion.button>
  );
};

/* ── Expanded overlay: flips open to reveal image + description ──────────────── */
const ExpandedCard = ({ card, position, total, onClose, onPrev, onNext, isTa, progress, onRate }) => {
  const accent = getAccent(card.accent);
  const chunked = isOverloaded(progress);
  // Starts on the title face and holds there for a beat — long enough for the
  // student to actually read which topic this is — then flips to the detail
  // face. The hold only starts once the pop-in has actually finished (via
  // onAnimationComplete below), so the flip's 3D repaint never overlaps the
  // modal's own entrance animation.
  const [showDetail, setShowDetail] = useState(false);
  const holdTimerRef = React.useRef(null);

  useEffect(() => {
    setShowDetail(false);
    return () => clearTimeout(holdTimerRef.current);
  }, [card.id]);

  const startHold = () => {
    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => setShowDetail(true), 1500);
  };

  return (
    <div className="w-full max-w-2xl" style={{ perspective: 2200 }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onAnimationComplete={startHold}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          className="relative w-full cursor-pointer"
          style={{ transformStyle: "preserve-3d" }}
          initial={{ rotateY: 180 }}
          animate={{ rotateY: showDetail ? 0 : 180 }}
          transition={{ duration: 0.45, ease: [0.45, 0, 0.2, 1] }}
          onClick={() => {
            clearTimeout(holdTimerRef.current);
            setShowDetail((v) => !v);
          }}
        >
          {/* Detail face — sits in normal flow, so it sets the card's height */}
          <div
            className="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            <CardHero card={card} accent={accent} />

            <div className="max-h-[42vh] overflow-y-auto px-6 py-5 sm:px-7">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                {card.title}
              </h2>
              <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-[#0284c7] to-[#38bdf8]" />
              {chunked ? (
                <ChunkedPointList points={toPoints(card.description)} isTa={isTa} />
              ) : (
                <PointList points={toPoints(card.description)} />
              )}
            </div>

            {/* Recall-quality rating — this is the spaced-repetition review
                action itself: rating schedules the card's next due date and
                (for the two-buttons-in-a-row case) can trigger chunked mode
                on the next open. Click elsewhere on the card just flips it
                back to the title face without rating anything. */}
            <div
              className="border-t border-slate-100 bg-slate-50 px-4 py-3"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
                {isTa ? "நீங்கள் எவ்வளவு நன்றாக நினைவில் வைத்தீர்கள்?" : "How well did you remember this?"}
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => onRate("again")}
                  className="rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] font-bold text-red-700 transition-all hover:bg-red-100 active:scale-95"
                >
                  {isTa ? "மீண்டும்" : "Again"}
                </button>
                <button
                  type="button"
                  onClick={() => onRate("hard")}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] font-bold text-amber-700 transition-all hover:bg-amber-100 active:scale-95"
                >
                  {isTa ? "கடினம்" : "Hard"}
                </button>
                <button
                  type="button"
                  onClick={() => onRate("good")}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] font-bold text-emerald-700 transition-all hover:bg-emerald-100 active:scale-95"
                >
                  {isTa ? "நல்லது" : "Good"}
                </button>
                <button
                  type="button"
                  onClick={() => onRate("easy")}
                  className="rounded-lg border border-brand-200 bg-brand-50 px-2 py-1.5 text-[11px] font-bold text-brand-700 transition-all hover:bg-brand-100 active:scale-95"
                >
                  {isTa ? "எளிது" : "Easy"}
                </button>
              </div>
            </div>
          </div>

          {/* Title face — overlaid, pre-rotated so it faces out when closed */}
          <div
            className={`absolute inset-0 flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br p-8 shadow-2xl ring-1 ring-black/5 ${accent.face}`}
            style={{
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <FaceDecor />

            <div className="relative flex justify-end">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${accent.badge}`}
              >
                {card.deck}
              </span>
            </div>
            <h2 className={`relative text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl ${accent.title}`}>
              {card.title}
            </h2>
            <div className={`relative flex items-center gap-1.5 text-xs font-semibold ${accent.muted}`}>
              <Sparkles size={14} />
              {isTa ? "விளக்கத்தைக் காண தட்டவும்" : "Tap to see the notes"}
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onPrev}
            disabled={total < 2}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25 active:scale-95 disabled:opacity-30"
            title={isTa ? "முந்தையது" : "Previous"}
          >
            <ChevronLeft size={20} />
          </button>

          <span className="min-w-[74px] rounded-full bg-white/15 px-4 py-1.5 text-center text-xs font-bold text-white backdrop-blur-sm">
            {position} / {total}
          </span>

          <button
            type="button"
            onClick={onNext}
            disabled={total < 2}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25 active:scale-95 disabled:opacity-30"
            title={isTa ? "அடுத்தது" : "Next"}
          >
            <ChevronRight size={20} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="ml-2 flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-lg transition hover:bg-slate-100 active:scale-95"
          >
            <X size={15} />
            {isTa ? "மூடு" : "Close"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ── Module: deck browser ────────────────────────────────────────────────────── */
const FlashcardView = ({ language = "en" }) => {
  const isTa = language === "ta";

  const [cards, setCards] = useState([]);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDeck, setActiveDeck] = useState("All");
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState(null);
  const [dueOnly, setDueOnly] = useState(false);

  const { progressById, rateCard } = useCardProgress();

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
          : "Could not load the cards. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [language, isTa]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const dueCount = useMemo(
    () => cards.filter((card) => isDue(progressById[card.id])).length,
    [cards, progressById]
  );

  const visibleCards = useMemo(() => {
    const term = search.trim().toLowerCase();
    return cards.filter((card) => {
      const inDeck = activeDeck === "All" || card.deck === activeDeck;
      if (!inDeck) return false;
      if (dueOnly && !isDue(progressById[card.id])) return false;
      if (!term) return true;
      const body = toPoints(card.description).join(" ").toLowerCase();
      return (
        card.title.toLowerCase().includes(term) ||
        body.includes(term) ||
        card.deck.toLowerCase().includes(term)
      );
    });
  }, [cards, activeDeck, search, dueOnly, progressById]);

  // Filtering while a card is open would leave the overlay on a stale index.
  useEffect(() => {
    setOpenIndex(null);
  }, [activeDeck, search, dueOnly]);

  const step = useCallback(
    (delta) => {
      setOpenIndex((current) => {
        if (current === null || visibleCards.length === 0) return current;
        return (current + delta + visibleCards.length) % visibleCards.length;
      });
    },
    [visibleCards.length]
  );

  // Keyboard control + scroll lock while the overlay is up.
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

  const handleRate = useCallback(
    async (card, rating) => {
      await rateCard(card, rating);
      logActivity("flashcards", "card_reviewed", { cardId: card.id, deck: card.deck, rating });
      // Move on so a review session flows card-to-card without extra taps.
      step(1);
    },
    [rateCard, step]
  );

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#0284c7]">
            <Layers size={14} />
            {isTa ? "விரைவு திருப்புதல் கற்றல்" : "Quick Revision"}
          </div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
            {isTa ? "கருத்து அட்டைகள்" : "Concept Flashcards"}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {isTa
              ? "தலைப்பைப் படித்து யோசியுங்கள். பிறகு அட்டையைத் தட்டி படத்துடன் விளக்கத்தைப் பாருங்கள்."
              : "Read the topic. Try to remember it. Then tap the card to see the picture and notes."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDueOnly((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              dueOnly
                ? "border-[#0284c7] bg-[#0284c7] text-white shadow-xs"
                : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-[#0284c7]"
            }`}
          >
            <CalendarClock size={14} />
            {isTa ? "இன்று திருப்பிப் பார்க்க வேண்டியவை" : "Due Today"}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                dueOnly ? "bg-white/20" : "bg-slate-200 text-slate-600"
              }`}
            >
              {dueCount}
            </span>
          </button>

          <button
            type="button"
            onClick={loadCards}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 hover:text-[#0284c7] active:scale-95"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-[#0284c7]" : ""} />
            {isTa ? "புதுப்பிக்க" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Search + deck filter */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isTa ? "தலைப்பைத் தேடுங்கள்..." : "Search a topic..."}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {["All", ...decks].map((deck) => (
            <button
              key={deck}
              type="button"
              onClick={() => setActiveDeck(deck)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                activeDeck === deck
                  ? "border-[#0284c7] bg-[#0284c7] text-white shadow-xs"
                  : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-[#0284c7]"
              }`}
            >
              {deck === "All" ? (isTa ? "அனைத்தும்" : "All Topics") : deck}
            </button>
          ))}
        </div>
      </div>

      {/* Deck grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : visibleCards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-200 bg-brand-50 text-[#0284c7]">
            <Layers size={22} />
          </div>
          <p className="text-sm font-bold text-slate-800">
            {isTa ? "அட்டைகள் எதுவும் இல்லை" : "No cards here yet"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {isTa
              ? "வேறு தலைப்பைத் தேர்ந்தெடுக்கவும், அல்லது நிர்வாகப் பக்கத்தில் புதிய அட்டையைச் சேர்க்கவும்."
              : "Try another topic."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visibleCards.map((card, index) => (
            <CardTile
              key={card.id}
              card={card}
              index={index}
              isTa={isTa}
              due={isDue(progressById[card.id])}
              onOpen={() => setOpenIndex(index)}
            />
          ))}
        </div>
      )}

      {/* Expanded overlay */}
      <AnimatePresence>
        {openCard && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-900/80 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpenIndex(null)}
          >
            <ExpandedCard
              key={openCard.id}
              card={openCard}
              position={openIndex + 1}
              total={visibleCards.length}
              isTa={isTa}
              progress={progressById[openCard.id]}
              onRate={(rating) => handleRate(openCard, rating)}
              onClose={() => setOpenIndex(null)}
              onPrev={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              onNext={(e) => {
                e.stopPropagation();
                step(1);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FlashcardView;
