import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Clapperboard,
  Languages,
  Play,
  Atom,
  Sigma,
  Lightbulb,
  HelpCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Film,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MOVIE_SCENES from "./movieScenes";
import { logActivity } from "../../activity";

/* Full class strings (not built dynamically) so Tailwind keeps them in the build. */
const ACCENTS = {
  amber: { chip: "bg-amber-100 text-amber-800", ring: "ring-amber-400", bar: "from-amber-500 to-orange-500" },
  blue: { chip: "bg-sky-100 text-sky-800", ring: "ring-sky-400", bar: "from-sky-500 to-blue-600" },
  violet: { chip: "bg-violet-100 text-violet-800", ring: "ring-violet-400", bar: "from-violet-500 to-fuchsia-600" },
  rose: { chip: "bg-rose-100 text-rose-800", ring: "ring-rose-400", bar: "from-rose-500 to-pink-600" },
  emerald: { chip: "bg-emerald-100 text-emerald-800", ring: "ring-emerald-400", bar: "from-emerald-500 to-teal-600" },
};

const thumbnail = (youtubeId) => `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;

/* ── One topic in the playlist ──────────────────────────────────────────────── */
const SceneTile = ({ scene, index, active, onSelect, t }) => {
  const accent = ACCENTS[scene.accent] || ACCENTS.blue;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex w-full items-center gap-3 rounded-2xl border bg-white p-2.5 text-left transition-all active:scale-[0.98] ${
        active
          ? `border-transparent shadow-md ring-2 ${accent.ring}`
          : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-xl bg-slate-200">
        <img
          src={thumbnail(scene.youtubeId)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/25">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-900">
            <Play size={13} className="ml-0.5" fill="currentColor" />
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {index + 1}. {t(scene.movie)}
        </div>
        <div className="mt-0.5 text-sm font-extrabold leading-snug text-slate-900">{t(scene.topic)}</div>
      </div>
    </button>
  );
};

/* ── A titled block in the explanation panel ────────────────────────────────── */
const Section = ({ icon: Icon, title, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
      <Icon size={15} className="text-brand-600" />
      {title}
    </h3>
    <div className="mt-3">{children}</div>
  </div>
);

const MoviePhysicsModule = ({ onBackToHome, initialLanguage = "en" }) => {
  const [language, setLanguage] = useState(initialLanguage);
  const [activeIndex, setActiveIndex] = useState(0);
  const topRef = useRef(null);

  const isTa = language === "ta";
  const t = (field) => (field ? (isTa ? field.ta : field.en) : "");

  const scene = MOVIE_SCENES[activeIndex];
  const accent = ACCENTS[scene.accent] || ACCENTS.blue;

  useEffect(() => {
    logActivity("movie_physics", "scene_opened", { sceneId: scene.id });
  }, [scene.id]);

  const select = (index) => {
    setActiveIndex(index);
    // On phones the playlist sits below the player, so bring the player back into view.
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const step = (delta) => select((activeIndex + delta + MOVIE_SCENES.length) % MOVIE_SCENES.length);

  return (
    <div className="min-h-screen bg-[#faf8ff] pb-16 font-sans text-slate-900 selection:bg-brand-600 selection:text-white">
      <div className="tngov-tricolor-strip fixed left-0 right-0 top-0 z-50"></div>

      <header className="sticky top-[3px] z-40 flex items-center justify-between gap-3 border-b border-brand-100 bg-white/95 px-4 py-2.5 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200 hover:text-[#0284c7] active:scale-95"
              title="Back to Home"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">{isTa ? "முகப்பு" : "Home"}</span>
            </button>
          )}

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#0284c7]">
              {isTa ? "திரைப்படங்களில் அறிவியல்" : "Science at the Movies"}
            </div>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
              {isTa ? "திரைப்பட இயற்பியல்" : "Movie Physics"}
            </h1>
          </div>
        </div>

        <button
          onClick={() => setLanguage(isTa ? "en" : "ta")}
          title={isTa ? "Switch to English" : "தமிழுக்கு மாற்றவும்"}
          className="flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-bold text-[#0284c7] transition-all hover:bg-brand-100 active:scale-95"
        >
          <Languages size={14} />
          <span>{isTa ? "English" : "தமிழ்"}</span>
        </button>
      </header>

      <main ref={topRef} className="mx-auto max-w-6xl scroll-mt-16 px-4 pt-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Player + explanation */}
          <div className="min-w-0 space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={scene.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <div className="overflow-hidden rounded-3xl bg-slate-900 shadow-xl">
                  <div className="relative aspect-video w-full">
                    <iframe
                      key={scene.youtubeId}
                      className="absolute inset-0 h-full w-full"
                      src={`https://www.youtube-nocookie.com/embed/${scene.youtubeId}?rel=0&modestbranding=1`}
                      title={`${t(scene.topic)} — ${t(scene.movie)}`}
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                    />
                  </div>
                </div>

                {/* Title row */}
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${accent.chip}`}>
                      <Film size={12} />
                      {t(scene.movie)}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      {isTa ? "தலைப்பு" : "Topic"} {activeIndex + 1} / {MOVIE_SCENES.length}
                    </span>
                  </div>
                  <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl font-display">
                    {t(scene.topic)}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{t(scene.scene)}</p>
                  <div className={`mt-4 h-1 w-14 rounded-full bg-gradient-to-r ${accent.bar}`} />
                  <p className="mt-4 text-[15px] leading-relaxed text-slate-700">{t(scene.story)}</p>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => step(-1)}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
                      >
                        <ChevronLeft size={14} />
                        {isTa ? "முந்தையது" : "Previous"}
                      </button>
                      <button
                        type="button"
                        onClick={() => step(1)}
                        className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-brand-600 to-cyan-600 px-3 py-1.5 text-xs font-bold text-white shadow-pop transition-all hover:brightness-110 active:scale-95"
                      >
                        {isTa ? "அடுத்தது" : "Next"}
                        <ChevronRight size={14} />
                      </button>
                    </div>
                    <a
                      href={`https://youtu.be/${scene.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-[#0284c7]"
                    >
                      <ExternalLink size={13} />
                      {isTa ? "YouTube-இல் திற" : "Open on YouTube"}
                    </a>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Section icon={Atom} title={isTa ? "இதில் உள்ள இயற்பியல்" : "The physics in this scene"}>
                      <ul className="space-y-2.5">
                        {t(scene.physics).map((point, i) => (
                          <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-slate-700">
                            <span className={`mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br ${accent.bar}`} />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </Section>
                  </div>

                  <Section icon={Sigma} title={isTa ? "முக்கியச் சூத்திரம்" : "Key formula"}>
                    <div className="rounded-xl bg-slate-900 px-4 py-4 text-center font-mono text-xl font-bold tracking-wide text-white">
                      {scene.formula}
                    </div>
                  </Section>

                  <Section icon={Lightbulb} title={isTa ? "அன்றாட வாழ்க்கையில்" : "In real life"}>
                    <p className="text-sm leading-relaxed text-slate-700">{t(scene.realLife)}</p>
                  </Section>

                  <div className="md:col-span-2">
                    <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                      <HelpCircle size={20} className="mt-0.5 shrink-0 text-amber-600" />
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-amber-700">
                          {isTa ? "யோசித்துப் பார்" : "Think about it"}
                        </div>
                        <p className="mt-1 text-sm font-semibold leading-relaxed text-amber-900">{t(scene.question)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Playlist */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#0284c7]">
              <Clapperboard size={14} />
              {isTa ? "அனைத்துக் காட்சிகள்" : "All scenes"}
            </div>
            <div className="space-y-2.5">
              {MOVIE_SCENES.map((item, index) => (
                <SceneTile
                  key={item.id}
                  scene={item}
                  index={index}
                  active={index === activeIndex}
                  onSelect={() => select(index)}
                  t={t}
                />
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default MoviePhysicsModule;
