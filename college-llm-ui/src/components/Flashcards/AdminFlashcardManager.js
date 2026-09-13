import React, { useState, useEffect, useCallback, useMemo } from "react";
import { fetchFlashcards, addFlashcard, deleteFlashcard } from "../../api";
import { ACCENT_KEYS, getAccent } from "./flashcardTheme";
import {
  PlusCircle,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Image as ImageIcon,
  Check,
  Eye,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// One point per line in the form; the backend splits and cleans them.
const linesToPoints = (text) =>
  text
    .split("\n")
    .map((line) => line.replace(/^[-\u2022*]\s*/, "").trim())
    .filter(Boolean);

const toPoints = (description) =>
  Array.isArray(description) ? description : description ? [description] : [];

/* ── Live preview of the card being composed ─────────────────────────────────── */
const PreviewCard = ({ deck, title, description, accent, image, isTa }) => {
  const [side, setSide] = useState("front");
  const [broken, setBroken] = useState(false);
  const theme = getAccent(accent);

  useEffect(() => {
    setBroken(false);
  }, [image]);

  const placeholderTitle = isTa ? "தலைப்பு இங்கே தோன்றும்" : "Your topic title appears here";
  const placeholderBody = isTa
    ? "விளக்கம் இங்கே புள்ளிகளாகத் தோன்றும்."
    : "Each line you type appears here as its own bullet point.";

  const previewPoints = linesToPoints(description);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#0284c7]">
          <Eye size={13} /> {isTa ? "நேரலை முன்னோட்டம்" : "Live Preview"}
        </div>
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-0.5">
          {["front", "back"].map((face) => (
            <button
              key={face}
              type="button"
              onClick={() => setSide(face)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
                side === face ? "bg-[#0284c7] text-white" : "text-slate-600 hover:text-[#0284c7]"
              }`}
            >
              {face === "front"
                ? isTa ? "முன் பக்கம்" : "Front"
                : isTa ? "பின் பக்கம்" : "Back"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ perspective: 1400 }}>
        <motion.div
          className="relative"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: side === "front" ? 0 : 180 }}
          transition={{ type: "spring", stiffness: 110, damping: 16 }}
        >
          {/* Front — title face, sets the height */}
          <div
            className={`relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-2xl border-2 border-black/5 bg-gradient-to-br p-5 shadow-lg ${theme.face}`}
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/50" />
            <div className="pointer-events-none absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-white/40" />

            <div className="relative flex justify-end">
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm ${theme.badge}`}
              >
                {deck.trim() || (isTa ? "தலைப்பு" : "Deck")}
              </span>
            </div>
            <h3 className={`relative text-lg font-extrabold leading-snug tracking-tight ${theme.title}`}>
              {title.trim() || placeholderTitle}
            </h3>
          </div>

          {/* Back — detail face */}
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5"
            style={{
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            {image.trim() && !broken ? (
              <img
                src={image.trim()}
                alt=""
                onError={() => setBroken(true)}
                className="h-24 w-full object-cover"
              />
            ) : (
              <div className={`relative h-24 w-full overflow-hidden bg-gradient-to-br ${theme.face}`}>
                <div className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full bg-white/50" />
                <div className="pointer-events-none absolute -bottom-8 left-4 h-16 w-16 rounded-full bg-white/40" />
              </div>
            )}
            <div className="h-[calc(100%-6rem)] overflow-y-auto px-4 py-3">
              <h4 className="text-sm font-extrabold text-slate-900">
                {title.trim() || placeholderTitle}
              </h4>
              <ul className="mt-1.5 space-y-1">
                {(previewPoints.length ? previewPoints : [placeholderBody]).map((point, i) => (
                  <li key={i} className="flex gap-1.5 text-[11px] leading-relaxed text-slate-600">
                    <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-gradient-to-br from-[#0284c7] to-[#38bdf8]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500">
        {isTa
          ? "படத்தின் URL காலியாக இருந்தால், தேர்ந்தெடுத்த நிறப் பலகை காட்டப்படும்."
          : "Leave the image URL blank and the card falls back to the colour panel you picked."}
      </p>
    </div>
  );
};

/* ── Module: card builder + repository ───────────────────────────────────────── */
const AdminFlashcardManager = ({ language = "en" }) => {
  const isTa = language === "ta";

  const [cards, setCards] = useState([]);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null); // { type: "ok" | "error", text }

  // Form state
  const [deck, setDeck] = useState("");
  const [title, setTitle] = useState("");
  const [titleTa, setTitleTa] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionTa, setDescriptionTa] = useState("");
  const [image, setImage] = useState("");
  const [accent, setAccent] = useState("blue");

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFlashcards("en", "All");
      setCards(data.cards || []);
      setDecks(data.decks || []);
    } catch (err) {
      console.error("Failed to load flashcards:", err);
      setNotice({
        type: "error",
        text: isTa ? "அட்டைகளை ஏற்ற முடியவில்லை." : "Could not load the existing cards.",
      });
    } finally {
      setLoading(false);
    }
  }, [isTa]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // Auto-dismiss the banner so it never piles up over the form.
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const resetForm = () => {
    setDeck("");
    setTitle("");
    setTitleTa("");
    setDescription("");
    setDescriptionTa("");
    setImage("");
    setAccent("blue");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setNotice({
        type: "error",
        text: isTa ? "அட்டையின் தலைப்பை உள்ளிடவும்." : "Please enter a title for the card.",
      });
      return;
    }
    if (linesToPoints(description).length === 0) {
      setNotice({
        type: "error",
        text: isTa
          ? "குறைந்தது ஒரு விளக்கப் புள்ளியையாவது உள்ளிடவும்."
          : "Please add at least one description point.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await addFlashcard({
        deck: deck.trim() || "General",
        title: title.trim(),
        titleTa: titleTa.trim(),
        description: description.trim(),
        descriptionTa: descriptionTa.trim(),
        image: image.trim(),
        accent,
      });
      resetForm();
      await loadCards();
      setNotice({
        type: "ok",
        text: isTa ? "அட்டை வெற்றிகரமாகச் சேர்க்கப்பட்டது." : "Card added to the deck.",
      });
    } catch (err) {
      console.error("Failed to add flashcard:", err);
      setNotice({
        type: "error",
        text: isTa ? "அட்டையைச் சேமிக்க முடியவில்லை." : "Could not save the card. Please check the server.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (card) => {
    const prompt = isTa
      ? `"${card.title}" அட்டையை நீக்கவா?`
      : `Delete the card "${card.title}"?`;
    if (!window.confirm(prompt)) return;

    try {
      await deleteFlashcard(card.id);
      setCards((prev) => prev.filter((c) => c.id !== card.id));
    } catch (err) {
      console.error("Error deleting flashcard:", err);
      setNotice({
        type: "error",
        text: isTa ? "அட்டையை நீக்க முடியவில்லை." : "Could not delete the card.",
      });
    }
  };

  const groupedCount = useMemo(() => {
    return cards.reduce((acc, card) => {
      acc[card.deck] = (acc[card.deck] || 0) + 1;
      return acc;
    }, {});
  }, [cards]);

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100";
  const labelClass = "mb-1.5 block text-xs font-bold text-slate-700";

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#0284c7]">
            <ShieldCheck size={14} />
            {isTa ? "ஆசிரியர் அட்டை மேலாண்மை" : "Faculty Card Management"}
          </div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
            {isTa ? "கருத்து அட்டை உருவாக்கி" : "Flashcard Builder"}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {isTa
              ? "தலைப்பு, படம் மற்றும் விளக்கத்தை உள்ளிட்டு புதிய அட்டையை உருவாக்கவும்."
              : "Add a topic title, a picture and the explanation students see after the flip."}
          </p>
        </div>

        <button
          type="button"
          onClick={loadCards}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 hover:text-[#0284c7] active:scale-95"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-[#0284c7]" : ""} />
          {isTa ? "புதுப்பிக்க" : "Refresh"}
        </button>
      </div>

      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold ${
              notice.type === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {notice.type === "ok" ? <Check size={16} /> : <Trash2 size={16} />}
            {notice.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Builder */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
          <PlusCircle size={16} className="text-[#0284c7]" />
          <h3 className="text-sm font-bold text-slate-900 sm:text-base">
            {isTa ? "புதிய அட்டையை உருவாக்கு" : "Create a New Flashcard"}
          </h3>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Deck */}
            <div>
              <label className={labelClass} htmlFor="fc-deck">
                {isTa ? "தலைப்புப் பிரிவு" : "Topic / Deck"}
              </label>
              <input
                id="fc-deck"
                type="text"
                list="fc-deck-options"
                value={deck}
                onChange={(e) => setDeck(e.target.value)}
                placeholder={isTa ? "எ.கா. பைத்தான் நிரலாக்கம்" : "e.g. Python Programming"}
                className={inputClass}
              />
              <datalist id="fc-deck-options">
                {decks.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
              <p className="mt-1 text-[11px] text-slate-400">
                {isTa
                  ? "காலியாக விட்டால் 'General' பிரிவில் சேர்க்கப்படும்."
                  : "Left blank, the card goes into the 'General' deck."}
              </p>
            </div>

            {/* Title */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="fc-title">
                  {isTa ? "தலைப்பு (ஆங்கிலம்)" : "Card Title (English)"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="fc-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isTa ? "எ.கா. Bubble Sort" : "e.g. Bubble Sort"}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="fc-title-ta">
                  {isTa ? "தலைப்பு (தமிழ்)" : "Card Title (Tamil)"}
                </label>
                <input
                  id="fc-title-ta"
                  type="text"
                  value={titleTa}
                  onChange={(e) => setTitleTa(e.target.value)}
                  placeholder={isTa ? "எ.கா. குமிழி வரிசையாக்கம்" : "Optional Tamil title"}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={labelClass} htmlFor="fc-desc">
                {isTa ? "விளக்கப் புள்ளிகள் (ஆங்கிலம்)" : "Description Points (English)"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                id="fc-desc"
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  isTa
                    ? "ஒரு வரிக்கு ஒரு புள்ளி — எ.கா. சார்பு என்பது மீண்டும் பயன்படும் நிரல் தொகுதி."
                    : "One point per line — e.g. A function is a reusable block of code."
                }
                className={`${inputClass} resize-y leading-relaxed`}
              />
              <p className="mt-1 text-[11px] text-slate-400">
                {isTa
                  ? "ஒவ்வொரு வரியும் அட்டையில் தனிப் புள்ளியாகக் காட்டப்படும்."
                  : "Every line becomes its own bullet point on the card."}
              </p>
            </div>

            <div>
              <label className={labelClass} htmlFor="fc-desc-ta">
                {isTa ? "விளக்கப் புள்ளிகள் (தமிழ்)" : "Description Points (Tamil)"}
              </label>
              <textarea
                id="fc-desc-ta"
                rows={5}
                value={descriptionTa}
                onChange={(e) => setDescriptionTa(e.target.value)}
                placeholder={
                  isTa
                    ? "தமிழ் புள்ளிகள் — ஒரு வரிக்கு ஒரு புள்ளி (விருப்பத்தேர்வு)"
                    : "Optional Tamil points, one per line"
                }
                className={`${inputClass} resize-y leading-relaxed`}
              />
              <p className="mt-1 text-[11px] text-slate-400">
                {isTa
                  ? "தமிழ் புலங்கள் காலியாக இருந்தால், ஆங்கில உரையே இரு மொழிகளிலும் காட்டப்படும்."
                  : "If the Tamil fields are blank, the English text is shown in both languages."}
              </p>
            </div>

            {/* Image */}
            <div>
              <label className={labelClass} htmlFor="fc-image">
                <span className="inline-flex items-center gap-1.5">
                  <ImageIcon size={13} /> {isTa ? "படத்தின் URL" : "Image URL"}
                </span>
              </label>
              <input
                id="fc-image"
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/topic-image.jpg"
                className={inputClass}
              />
            </div>

            {/* Accent */}
            <div>
              <span className={labelClass}>{isTa ? "அட்டையின் நிறம்" : "Card Colour"}</span>
              <div className="flex flex-wrap gap-2">
                {ACCENT_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAccent(key)}
                    title={getAccent(key).label}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border border-black/5 transition-all active:scale-95 ${getAccent(key).swatch} ${
                      accent === key
                        ? "ring-2 ring-slate-900 ring-offset-2"
                        : "opacity-80 hover:opacity-100"
                    }`}
                  >
                    {accent === key && <Check size={15} className="text-slate-900" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-lg bg-[#0284c7] px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-all hover:bg-[#026aa2] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <RefreshCw size={15} className="animate-spin" /> : <PlusCircle size={15} />}
                {submitting
                  ? isTa ? "சேமிக்கிறது..." : "Saving..."
                  : isTa ? "அட்டையைச் சேர்" : "Add Flashcard"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
              >
                {isTa ? "படிவத்தை அழி" : "Clear Form"}
              </button>
            </div>
          </form>

          <PreviewCard
            deck={deck}
            title={title}
            description={description}
            accent={accent}
            image={image}
            isTa={isTa}
          />
        </div>
      </div>

      {/* Repository */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-[#0284c7]" />
            <h3 className="text-sm font-bold text-slate-900 sm:text-base">
              {isTa ? "தற்போதுள்ள அட்டைகள்" : "Existing Cards"}
            </h3>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-[#0284c7]">
              {cards.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(groupedCount).map(([name, count]) => (
              <span
                key={name}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600"
              >
                {name} · {count}
              </span>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {isTa
              ? "இன்னும் அட்டைகள் எதுவும் இல்லை. மேலே முதல் அட்டையை உருவாக்குங்கள்."
              : "No cards yet. Create the first one using the form above."}
          </p>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {cards.map((card) => (
                <motion.li
                  key={card.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-brand-200 hover:bg-white"
                >
                  {/* Colour bar standing in for the card's accent */}
                  <div
                    className={`h-11 w-2.5 shrink-0 rounded-full bg-gradient-to-b ${getAccent(card.accent).face}`}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-900">{card.title}</p>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getAccent(card.accent).chip}`}
                      >
                        {card.deck}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {toPoints(card.description).join(" · ")}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(card)}
                    title={isTa ? "நீக்கு" : "Delete"}
                    className="shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-slate-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95"
                  >
                    <Trash2 size={15} />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminFlashcardManager;
