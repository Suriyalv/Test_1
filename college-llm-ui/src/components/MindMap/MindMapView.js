import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { fetchMindMaps, fetchMindMap, explainMindMapNode } from "../../api";
import { getBranch, ROOT_THEME } from "./mindMapTheme";
import {
  layoutMindMap,
  collectParentIds,
  searchMindMap,
  nodeFontSize,
} from "./mindMapLayout";
import {
  Search,
  X,
  Plus,
  Minus,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Sparkles,
  Loader2,
  RefreshCw,
  Move,
  Network,
  GitBranch,
  Volume2,
  VolumeX,
  Compass,
  Target,
  Layers,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2.4;

const clampZoom = (value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

/* ── One card on the canvas ───────────────────────────────────────────────────
   The root is obsidian slate with glowing aura; each branch wears its own
   vibrant curriculum theme so students can distinguish concepts instantly. */
const MapNode = ({
  entry,
  isSelected,
  isMatch,
  isDimmed,
  onSelect,
  onToggle,
}) => {
  const { node, depth, w, h, x, y, side, hasChildren, collapsed } = entry;
  const isRoot = depth === 0;
  const branch = getBranch(node.accent);
  const fontSize = nodeFontSize(depth);

  const hiddenCount = collapsed ? (node.children || []).length : 0;
  const toggleOnLeft = side === "left";

  const style = isRoot
    ? {
        background: ROOT_THEME.fill,
        borderColor: isSelected ? "#60A5FA" : ROOT_THEME.stroke,
        color: ROOT_THEME.text,
        boxShadow: isSelected
          ? "0 0 0 4px rgba(96, 165, 250, 0.45), 0 16px 32px -8px rgba(15, 23, 42, 0.6)"
          : "0 8px 24px -6px rgba(15, 23, 42, 0.45)",
      }
    : {
        background: depth === 1 ? branch.tint : "#ffffff",
        borderColor: isSelected || isMatch ? branch.stroke : depth === 1 ? branch.border : "#E2E8F0",
        color: branch.text,
        boxShadow: isSelected
          ? `0 0 0 3px ${branch.stroke}, 0 12px 26px -6px ${branch.glow}`
          : isMatch
          ? `0 0 0 3px #F59E0B, 0 8px 20px -4px rgba(245, 158, 11, 0.35)`
          : depth === 1
          ? `0 4px 14px -3px ${branch.glow}`
          : "0 2px 8px -2px rgba(15, 23, 42, 0.08)",
      };

  return (
    <div
      className="absolute select-none"
      style={{
        left: x,
        top: y - h / 2,
        width: w,
        minHeight: h,
        opacity: isDimmed ? 0.22 : 1,
        transition: "opacity 160ms ease",
        zIndex: isSelected ? 30 : isMatch ? 25 : depth === 0 ? 20 : 10,
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(entry);
        }}
        style={{
          ...style,
          borderWidth: isRoot ? 2.5 : depth === 1 ? 2 : 1.5,
        }}
        className="map-node-card flex w-full flex-col items-start gap-1.5 rounded-2xl border px-3.5 py-2.5 text-left transition-all hover:scale-[1.02] active:scale-[0.99] cursor-pointer focus:outline-none"
      >
        {/* Branch / Level badge indicator */}
        <div className="flex w-full items-center justify-between gap-1 text-[10px] font-bold">
          <span
            className="rounded-md px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide"
            style={{
              background: isRoot
                ? "rgba(255,255,255,0.18)"
                : depth === 1
                ? branch.soft
                : "#F1F5F9",
              color: isRoot ? "#93C5FD" : branch.strong,
            }}
          >
            {isRoot ? "★ Central Core" : depth === 1 ? "Branch" : "Concept"}
          </span>

          {node.points?.length > 0 && (
            <span className="text-[10px] font-semibold opacity-70">
              {node.points.length} {node.points.length === 1 ? "fact" : "facts"}
            </span>
          )}
        </div>

        {/* Node Label */}
        <span
          className="flex w-full items-start gap-1.5 font-bold leading-snug tracking-tight"
          style={{ fontSize }}
        >
          {node.icon && <span className="shrink-0 text-sm leading-none">{node.icon}</span>}
          <span className="break-words font-display">{node.label}</span>
        </span>

        {/* Formula Spotlight Badge */}
        {node.formula && (
          <span
            className="flex items-center gap-1 max-w-full truncate rounded-lg px-2 py-0.5 font-mono text-[11px] font-bold shadow-2xs"
            style={{
              background: isRoot ? "rgba(255,255,255,0.14)" : branch.soft,
              color: isRoot ? "#93C5FD" : branch.strong,
              border: `1px solid ${isRoot ? "rgba(255,255,255,0.2)" : branch.border}`,
            }}
          >
            <span className="text-[9px] opacity-75 font-serif italic">fx</span>
            <span className="truncate">{node.formula}</span>
          </span>
        )}
      </button>

      {/* Collapse / Expand handle sitting on the outer edge */}
      {hasChildren && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(node.id);
          }}
          title={collapsed ? "Expand branch" : "Collapse branch"}
          style={{
            borderColor: isRoot ? ROOT_THEME.stroke : branch.stroke,
            background: collapsed ? (isRoot ? ROOT_THEME.fill : branch.stroke) : "#FFFFFF",
            color: collapsed ? "#FFFFFF" : isRoot ? ROOT_THEME.fill : branch.stroke,
            [toggleOnLeft ? "left" : "right"]: -12,
            boxShadow: `0 2px 8px ${branch.glow}`,
          }}
          className="prevent-canvas-drag absolute top-1/2 z-30 flex h-6 min-w-[24px] -translate-y-1/2 items-center justify-center gap-0.5 rounded-full border-2 px-1 text-[10.5px] font-black transition-transform hover:scale-115 active:scale-95 shadow-sm"
        >
          {collapsed ? (
            <>
              <span>{hiddenCount}</span>
              <Plus size={10} strokeWidth={3.5} />
            </>
          ) : (
            <Minus size={11} strokeWidth={3.5} />
          )}
        </button>
      )}
    </div>
  );
};

/* ── Detail drawer for the selected node ─────────────────────────────────────── */
const NodeDetail = ({ mapId, entry, language, onClose }) => {
  const isTa = language === "ta";
  const node = entry.node;
  const branch = getBranch(node.accent);
  const isRoot = entry.depth === 0;
  const accentColor = isRoot ? ROOT_THEME.fill : branch.stroke;

  const [explanation, setExplanation] = useState("");
  const [explaining, setExplaining] = useState(false);
  const [explainError, setExplainError] = useState("");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    setExplanation("");
    setExplainError("");
    setExplaining(false);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsPlayingAudio(false);
  }, [node.id]);

  const runExplain = async (promptType = "") => {
    setExplaining(true);
    setExplainError("");
    try {
      const data = await explainMindMapNode(mapId, node.id, language, promptType);
      setExplanation(data.explanation || "");
    } catch (err) {
      setExplainError(
        isTa
          ? "விளக்கத்தைப் பெற முடியவில்லை. மீண்டும் முயற்சிக்கவும்."
          : "Could not fetch an explanation. Please try again."
      );
    }
    setExplaining(false);
  };

  // Text-to-speech reading for auditory student comprehension
  const toggleSpeech = () => {
    if (!window.speechSynthesis) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const textToRead = [
      node.label,
      node.formula ? `${isTa ? "சூத்திரம்:" : "Formula:"} ${node.formula}` : "",
      node.summary || "",
      ...(node.points || []),
      explanation || "",
    ]
      .filter(Boolean)
      .join(". ");

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = isTa ? "ta-IN" : "en-US";
    utterance.rate = 0.95;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  return (
    <motion.aside
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 60, opacity: 0 }}
      transition={{ type: "spring", stiffness: 340, damping: 30 }}
      className="absolute bottom-3 right-3 top-3 z-40 flex w-[20rem] sm:w-[22rem] flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-2xl shadow-2xl"
    >
      {/* Header Banner */}
      <div
        className="flex items-start justify-between gap-2 px-5 py-4 text-white shadow-sm"
        style={{ background: `linear-gradient(135deg, ${accentColor}, ${branch.strong || accentColor})` }}
      >
        <div className="min-w-0">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
            <BookOpen size={12} />
            <span>
              {isRoot
                ? isTa
                  ? "மையக் கருத்து"
                  : "Central Curriculum Core"
                : `${isTa ? "நிலை" : "Taxonomy Level"} ${entry.depth} • ${branch.label}`}
            </span>
          </div>
          <h3 className="mt-1 flex items-start gap-2 text-base sm:text-lg font-black leading-snug text-white font-display">
            {node.icon && <span className="shrink-0">{node.icon}</span>}
            <span className="break-words">{node.label}</span>
          </h3>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={toggleSpeech}
            className={`p-1.5 rounded-xl transition-all ${
              isPlayingAudio ? "bg-white text-indigo-700 shadow-sm" : "text-white/80 hover:bg-white/20 hover:text-white"
            }`}
            title={isPlayingAudio ? "Stop reading" : "Read aloud"}
          >
            {isPlayingAudio ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            title={isTa ? "மூடு" : "Close"}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Prominent Formula Callout */}
        {node.formula && (
          <div
            className="rounded-2xl border-2 p-3 text-center font-mono shadow-xs"
            style={{
              background: branch.tint,
              borderColor: branch.border,
              color: branch.strong,
            }}
          >
            <span className="text-[10px] font-black uppercase tracking-wider block opacity-75 mb-0.5">
              {isTa ? "முக்கிய கணிதச் சூத்திரம்" : "Key Curriculum Formula"}
            </span>
            <div className="text-base sm:text-lg font-bold tracking-wide">
              {node.formula}
            </div>
          </div>
        )}

        {/* Conceptual Summary */}
        {node.summary && (
          <div className="text-[13px] leading-relaxed text-slate-700 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              {isTa ? "கருத்துச் சுருக்கம்" : "Concept Overview"}
            </span>
            <p className="font-medium">{node.summary}</p>
          </div>
        )}

        {/* Key Takeaways / Points */}
        {node.points?.length > 0 && (
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
              {isTa ? "கற்றல் குறிப்புகள்" : "Key Study Takeaways"}
            </span>
            <ul className="space-y-2">
              {node.points.map((point, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs"
                >
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: accentColor }}
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Child Sub-Branches */}
        {node.children?.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <GitBranch size={12} className="text-slate-500" />
              <span>
                {isTa ? "உட்பிரிவுகள்" : "Child Branches"} ({node.children.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {node.children.map((child) => (
                <span
                  key={child.id}
                  className="rounded-xl border px-2.5 py-1 text-[11px] font-bold shadow-2xs"
                  style={{
                    background: branch.tint,
                    borderColor: branch.border,
                    color: branch.text,
                  }}
                >
                  {child.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Socratic AI Study Assistant */}
        <div className="border-t border-slate-200 pt-3.5 space-y-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            {isTa ? "AI சாக்ரடிக் வழிகாட்டி" : "Socratic Concept Explainer"}
          </span>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => runExplain("summary")}
              disabled={explaining}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-indigo-400 active:scale-95 disabled:opacity-50 shadow-2xs"
            >
              <Sparkles size={12} className="text-indigo-600" />
              <span>{isTa ? "எளிய விளக்கம்" : "Simple Analogy"}</span>
            </button>

            <button
              onClick={() => runExplain("exam")}
              disabled={explaining}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-amber-400 active:scale-95 disabled:opacity-50 shadow-2xs"
            >
              <Target size={12} className="text-amber-500" />
              <span>{isTa ? "தேர்வுக் குறிப்புகள்" : "Exam Tips"}</span>
            </button>
          </div>

          {explaining && (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-indigo-50/70 p-3 text-xs font-bold text-indigo-700">
              <Loader2 size={14} className="animate-spin text-indigo-600" />
              <span>{isTa ? "AI விளக்கம் திரட்டுகிறது..." : "Synthesizing student explanation..."}</span>
            </div>
          )}

          {explainError && (
            <p className="rounded-xl bg-red-50 p-2.5 text-[11.5px] font-semibold text-red-600 border border-red-200">
              {explainError}
            </p>
          )}

          {explanation && (
            <div className="whitespace-pre-wrap rounded-2xl bg-slate-50 border border-slate-200 p-3.5 text-[12.5px] leading-relaxed text-slate-800 shadow-inner">
              {explanation}
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

/* ── The module's student-facing canvas ───────────────────────────────────────── */
const MindMapView = ({ language = "en", refreshToken = 0 }) => {
  const isTa = language === "ta";

  const [maps, setMaps] = useState([]);
  const [activeMapId, setActiveMapId] = useState("");
  const [mindMap, setMindMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [collapsed, setCollapsed] = useState(new Set());
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");

  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const viewportRef = useRef(null);
  const dragRef = useRef(null);
  const hasMovedRef = useRef(false);

  /* Catalogue of maps */
  useEffect(() => {
    let cancelled = false;
    fetchMindMaps(language)
      .then((data) => {
        if (cancelled) return;
        const list = data.maps || [];
        setMaps(list);
        setActiveMapId((current) => current || (list[0] ? list[0].id : ""));
      })
      .catch(() => {
        if (!cancelled) setError("catalogue");
      });
    return () => {
      cancelled = true;
    };
  }, [language, refreshToken]);

  /* The active map's full tree */
  const loadMap = useCallback(async () => {
    if (!activeMapId) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchMindMap(activeMapId, language);
      setMindMap(data.map);
      // Open two levels deep by default so the tree is immediately rich and legible
      const branchIds = new Set((data.map.root.children || []).map((b) => b.id));
      const folded = (data.map.root.children || [])
        .flatMap((branch) => collectParentIds(branch))
        .filter((id) => !branchIds.has(id));
      setCollapsed(new Set(folded));
      setSelectedId("");
    } catch (err) {
      setError("map");
      setMindMap(null);
    }
    setLoading(false);
  }, [activeMapId, language]);

  useEffect(() => {
    loadMap();
  }, [loadMap, refreshToken]);

  /* Search widens the tree so every hit is on screen */
  const { matches, ancestors } = useMemo(
    () => searchMindMap(mindMap?.root, query),
    [mindMap, query]
  );

  useEffect(() => {
    if (!query.trim() || !ancestors.size) return;
    setCollapsed((prev) => {
      const next = new Set(prev);
      ancestors.forEach((id) => next.delete(id));
      return next;
    });
  }, [query, ancestors]);

  const layout = useMemo(
    () => layoutMindMap(mindMap?.root, collapsed, isTa),
    [mindMap, collapsed, isTa]
  );

  const selectedEntry = useMemo(
    () => layout.nodes.find((n) => n.id === selectedId) || null,
    [layout, selectedId]
  );

  /**
   * Fit the drawing into the viewport with student readability floor
   */
  const fitToScreen = useCallback(
    (floor = 0.5) => {
      const viewport = viewportRef.current;
      if (!viewport || !layout.width || !layout.height) return false;

      const { clientWidth, clientHeight } = viewport;
      if (!clientWidth || !clientHeight) return false;

      const ideal = Math.min(clientWidth / layout.width, clientHeight / layout.height) * 0.92;
      const scale = clampZoom(Math.max(ideal, floor));
      setZoom(scale);

      if (ideal >= floor) {
        setPan({
          x: (clientWidth - layout.width * scale) / 2,
          y: (clientHeight - layout.height * scale) / 2,
        });
      } else {
        setPan({
          x: clientWidth / 2 - layout.rootPoint.x * scale,
          y: clientHeight / 2 - layout.rootPoint.y * scale,
        });
      }
      return true;
    },
    [layout.width, layout.height, layout.rootPoint]
  );

  const needsFitRef = useRef(false);
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  const lastRootRef = useRef(null);
  useEffect(() => {
    const previous = lastRootRef.current;
    const current = layout.rootPoint;
    lastRootRef.current = current;

    if (!previous || needsFitRef.current) return;

    const dx = (current.x - previous.x) * zoomRef.current;
    const dy = (current.y - previous.y) * zoomRef.current;
    if (dx || dy) setPan((p) => ({ x: p.x - dx, y: p.y - dy }));
  }, [layout.rootPoint]);

  useEffect(() => {
    if (mindMap) needsFitRef.current = true;
  }, [mindMap]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    const tryFit = () => {
      if (needsFitRef.current && fitToScreen(0.55)) needsFitRef.current = false;
    };

    tryFit();
    const observer = new ResizeObserver(tryFit);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [fitToScreen]);

  /* ── Direct Mouse Scroll Wheel Zoom (Cursor-Centric Zoom) ───────────────────
     Scrolling the mouse wheel zooms in/out centered directly at the cursor position.
     Calling preventDefault() and stopPropagation() on non-passive listeners
     completely blocks unwanted browser-level page/document zooming! */
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const viewport = viewportRef.current;
    if (!viewport) return;

    const rect = viewport.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Direct scroll wheel zoom:
    // deltaY < 0 (scrolling up) -> zoom in
    // deltaY > 0 (scrolling down) -> zoom out
    const zoomFactor = e.deltaY < 0 ? 1.10 : 0.90;

    const currentZoom = zoomRef.current;
    const nextZoom = clampZoom(currentZoom * zoomFactor);
    if (nextZoom === currentZoom) return;

    const currentPan = panRef.current;
    const nextPanX = mouseX - (mouseX - currentPan.x) * (nextZoom / currentZoom);
    const nextPanY = mouseY - (mouseY - currentPan.y) * (nextZoom / currentZoom);

    zoomRef.current = nextZoom;
    panRef.current = { x: nextPanX, y: nextPanY };

    setZoom(nextZoom);
    setPan({ x: nextPanX, y: nextPanY });
  }, []);

  // Attach non-passive wheel listener directly to canvas viewport
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", handleWheel);
    };
  }, [mindMap, loading, handleWheel]);

  // Window-level guard: intercept Ctrl + scroll when cursor is over the canvas to stop browser zoom
  useEffect(() => {
    const handleGlobalWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        const viewport = viewportRef.current;
        if (!viewport) return;
        const rect = viewport.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          e.preventDefault();
          handleWheel(e);
        }
      }
    };

    window.addEventListener("wheel", handleGlobalWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleGlobalWheel);
  }, [handleWheel]);

  /* ── Robust Click & Move (Drag to Pan) ──────────────────────────────────────
     Clicking and moving the mouse effortlessly pans the whole map canvas.
     Small clicks open node details; deliberate drags move the canvas without
     accidentally triggering node clicks. */
  const onPointerDown = (e) => {
    if (e.button !== 0 && e.button !== 1) return;
    // Don't capture pointer when clicking on cards, buttons, or drawers
    if (e.target.closest?.(".prevent-canvas-drag, .map-node-card, button, input, select, aside")) {
      return;
    }

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
      pointerId: e.pointerId,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (!hasMovedRef.current && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      hasMovedRef.current = true;
      setIsDragging(true);
    }

    if (hasMovedRef.current) {
      setPan({
        x: drag.startPanX + dx,
        y: drag.startPanY + dy,
      });
    }
  };

  const endDrag = (e) => {
    if (!dragRef.current) return;
    if (e.currentTarget.hasPointerCapture?.(dragRef.current.pointerId)) {
      e.currentTarget.releasePointerCapture(dragRef.current.pointerId);
    }
    dragRef.current = null;
    setTimeout(() => {
      setIsDragging(false);
      hasMovedRef.current = false;
    }, 60);
  };

  const toggleNode = (id) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const expandAll = () => setCollapsed(new Set());

  const collapseToBranches = () => {
    if (!mindMap) return;
    setCollapsed(new Set((mindMap.root.children || []).map((branch) => branch.id)));
  };

  /* Focus and center smoothly on any branch */
  const focusNode = (nodeId) => {
    const viewport = viewportRef.current;
    const entry = layout.nodes.find((n) => n.id === nodeId);
    if (!viewport || !entry) return;

    // Ensure parents and children are visible
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.delete(nodeId);
      return next;
    });

    setPan({
      x: viewport.clientWidth / 2 - (entry.x + entry.w / 2) * zoom,
      y: viewport.clientHeight / 2 - entry.y * zoom,
    });
    setSelectedId(nodeId);
  };

  /* Step-by-Step Concept Tour for Students */
  const topBranches = useMemo(() => mindMap?.root?.children || [], [mindMap]);
  const [tourIndex, setTourIndex] = useState(0);

  const nextTourStep = () => {
    if (!topBranches.length) return;
    const nextIdx = (tourIndex + 1) % topBranches.length;
    setTourIndex(nextIdx);
    focusNode(topBranches[nextIdx].id);
  };

  const prevTourStep = () => {
    if (!topBranches.length) return;
    const prevIdx = (tourIndex - 1 + topBranches.length) % topBranches.length;
    setTourIndex(prevIdx);
    focusNode(topBranches[prevIdx].id);
  };

  const searching = query.trim().length > 0;

  if (loading && !mindMap) {
    return (
      <div className="flex h-[65vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
        <p className="text-sm font-bold text-slate-700">
          {isTa ? "பாடத்திட்ட கருத்து இணைப்பு வரைபடம் ஏற்றப்படுகிறது..." : "Loading curriculum knowledge constellation..."}
        </p>
      </div>
    );
  }

  if (error || !mindMap) {
    return (
      <div className="flex h-[65vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <Network size={36} className="text-slate-300" />
        <p className="text-sm font-bold text-slate-600">
          {isTa
            ? "வரைபடத்தை ஏற்ற முடியவில்லை. சேவையகம் இயங்குகிறதா எனச் சரிபார்க்கவும்."
            : "Could not load the mind map. Please check server connection."}
        </p>
        <button
          onClick={loadMap}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95"
        >
          <RefreshCw size={14} />
          <span>{isTa ? "மீண்டும் முயற்சி" : "Try again"}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* ── Top Navigation & Interactive Student Toolbar ────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xs">
        <div className="flex flex-1 items-center gap-2 min-w-[280px]">
          {maps.length > 1 && (
            <select
              value={activeMapId}
              onChange={(e) => setActiveMapId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
            >
              {maps.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.icon} {m.title}
                </option>
              ))}
            </select>
          )}

          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isTa ? "கருத்து அல்லது சூத்திரம் தேடவும் (எ.கா: F = ma, நியூட்டன்)..." : "Search a concept, formula, or law (e.g. F = ma, Inertia)..."}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-8 text-xs font-semibold text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {searching && (
            <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 shrink-0">
              {matches.size} {isTa ? "பொருத்தம்" : matches.size === 1 ? "match" : "matches"}
            </span>
          )}
        </div>

        {/* Action Controls & Zoom HUD */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Student Guided Tour Control */}
          <div className="flex items-center gap-1 rounded-xl bg-indigo-50/80 border border-indigo-200/80 px-2 py-1">
            <button
              onClick={prevTourStep}
              className="p-1 rounded text-indigo-700 hover:bg-indigo-100/60"
              title="Previous topic"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              onClick={nextTourStep}
              className="flex items-center gap-1 text-[11px] font-extrabold text-indigo-800 hover:text-indigo-900"
              title="Next topic"
            >
              <Compass size={12} className="text-indigo-600" />
              <span>{isTa ? "வழிகாட்டப்பட்ட உலா" : "Concept Tour"}</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Expand / Collapse */}
          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              onClick={expandAll}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition-all hover:bg-white active:scale-95"
              title={isTa ? "அனைத்தையும் விரி" : "Expand all"}
            >
              <ChevronDown size={13} />
              <span className="hidden sm:inline">{isTa ? "விரி" : "Expand"}</span>
            </button>
            <button
              onClick={collapseToBranches}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition-all hover:bg-white active:scale-95"
              title={isTa ? "கிளைகளாக மடக்கு" : "Collapse"}
            >
              <ChevronRight size={13} />
              <span className="hidden sm:inline">{isTa ? "மடக்கு" : "Collapse"}</span>
            </button>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-0.5">
            <button
              onClick={() => setZoom((z) => clampZoom(z - 0.15))}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-white hover:text-indigo-600 shadow-2xs"
              title={isTa ? "சிறிதாக்கு" : "Zoom out"}
            >
              <Minus size={13} />
            </button>
            <span className="w-10 text-center text-[10px] font-black text-slate-600">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => clampZoom(z + 0.15))}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-white hover:text-indigo-600 shadow-2xs"
              title={isTa ? "பெரிதாக்கு" : "Zoom in"}
            >
              <Plus size={13} />
            </button>
            <button
              onClick={() => fitToScreen()}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-white hover:text-indigo-600 shadow-2xs"
              title={isTa ? "திரைக்கு பொருத்து" : "Fit to screen"}
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Branch Legend Pills (Instant Jump & Highlight) ──────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 px-1">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
          <Layers size={11} />
          <span>{isTa ? "பாடப் பிரிவுகள்:" : "Branches:"}</span>
        </span>
        {topBranches.map((branch) => {
          const theme = getBranch(branch.accent);
          const isCurrent = selectedEntry?.branchId === branch.id || selectedEntry?.id === branch.id;
          return (
            <button
              key={branch.id}
              onClick={() => focusNode(branch.id)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all hover:scale-105 active:scale-95 ${
                isCurrent ? "ring-2 ring-indigo-500/40 shadow-xs scale-105" : "shadow-2xs"
              }`}
              style={{
                background: isCurrent ? theme.soft : theme.tint,
                borderColor: theme.stroke,
                color: theme.text,
              }}
            >
              <span
                className="h-2 w-2 rounded-full shrink-0 shadow-xs"
                style={{ background: theme.stroke }}
              />
              {branch.icon && <span>{branch.icon}</span>}
              <span>{branch.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Interactive Mind Map Canvas (Scroll to Zoom • Drag to Pan) ──────── */}
      <div
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={handleWheel}
        className={`relative h-[74vh] min-h-[30rem] touch-none select-none overflow-hidden rounded-3xl border border-slate-200 bg-[#F8FAFC] shadow-inner transition-colors overscroll-contain ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          backgroundImage:
            "radial-gradient(circle at 1.5px 1.5px, #CBD5E1 1.5px, transparent 0)",
          backgroundSize: "28px 28px",
          overscrollBehavior: "contain",
        }}
      >
        <div
          style={{
            width: layout.width,
            height: layout.height,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
          className="relative pointer-events-auto"
        >
          {/* Luminous Connector Curves */}
          <svg
            width={layout.width}
            height={layout.height}
            className="pointer-events-none absolute inset-0"
          >
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {layout.links.map((link) => {
              const theme = getBranch(link.accent);
              const dim = searching && !matches.has(link.id.split("->")[1]);
              const isHighlighted = selectedEntry && link.id.includes(selectedEntry.id);
              return (
                <g key={link.id}>
                  {/* Subtle ambient branch glow */}
                  <path
                    d={link.d}
                    fill="none"
                    stroke={theme.stroke}
                    strokeWidth={link.depth === 1 ? 6 : 4}
                    strokeLinecap="round"
                    opacity={dim ? 0.03 : isHighlighted ? 0.4 : 0.16}
                  />
                  {/* Main connection line */}
                  <path
                    d={link.d}
                    fill="none"
                    stroke={theme.stroke}
                    strokeWidth={link.depth === 1 ? 2.8 : link.depth === 2 ? 2.0 : 1.5}
                    strokeLinecap="round"
                    opacity={dim ? 0.12 : isHighlighted ? 1 : 0.85}
                  />
                </g>
              );
            })}
          </svg>

          {/* Cards for each curriculum concept */}
          {layout.nodes.map((entry) => (
            <MapNode
              key={entry.id}
              entry={entry}
              isSelected={entry.id === selectedId}
              isMatch={searching && matches.has(entry.id)}
              isDimmed={searching && !matches.has(entry.id)}
              onSelect={(selectedNodeEntry) => setSelectedId(selectedNodeEntry.id)}
              onToggle={toggleNode}
            />
          ))}
        </div>

        {/* Floating Navigation Instructions HUD */}
        <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-2xl bg-white/90 px-3.5 py-2 text-[11px] font-bold text-slate-600 border border-slate-200 shadow-md backdrop-blur-md">
          <Move size={14} className="text-indigo-600" />
          <span>
            {isTa
              ? "🖱️ சக்கரத்தை உருட்டி பெரிதாக்கவும் • கிளிக் செய்து இழுக்கவும் • முனையைத் தட்டவும்"
              : "🖱️ Scroll mouse to zoom • Click & drag to move • Tap any concept to learn"}
          </span>
        </div>

        {/* Reset to Center Button */}
        <button
          onClick={() => fitToScreen()}
          className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-2xl bg-white/90 border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 shadow-md backdrop-blur-md hover:bg-white active:scale-95"
          title="Recenter view"
        >
          <Target size={14} className="text-indigo-600" />
          <span>{isTa ? "மையப்படுத்து" : "Center Map"}</span>
        </button>

        {/* Selected Node Details Drawer */}
        <AnimatePresence>
          {selectedEntry && (
            <NodeDetail
              key={selectedEntry.id}
              mapId={mindMap.id}
              entry={selectedEntry}
              language={language}
              onClose={() => setSelectedId("")}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Footer Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-bold text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>
            {mindMap.nodeCount} {isTa ? "கற்றல் கருத்துகள்" : "curriculum concepts"} • {mindMap.branchCount}{" "}
            {isTa ? "முதன்மை பிரிவுகள்" : "core branches"}
          </span>
        </span>
        <span className="text-slate-400 font-medium">{mindMap.blurb}</span>
      </div>
    </div>
  );
};

export default MindMapView;
