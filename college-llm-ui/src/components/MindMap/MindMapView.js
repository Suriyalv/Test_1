import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { fetchMindMaps, fetchMindMap, explainMindMapNode } from "../../api";
import { getBranch, ROOT_THEME } from "./mindMapTheme";
import {
  layoutMindMap,
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
  ChevronDown,
  Sparkles,
  Loader2,
  RefreshCw,
  Move,
  Network,
  GitBranch,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 1.8;

const clampZoom = (value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

/* ── One card on the canvas ───────────────────────────────────────────────────
   Three looks, so the hierarchy reads at a glance:
   • root     — a glowing gradient pill, the one thing the eye lands on first;
   • branches — solid gradient cards in the branch colour, icon in a bubble;
   • leaves   — clean white cards with a coloured edge tying them to their branch.
   A node with hidden children wears a count badge so nothing feels lost. */
const MapNode = ({ entry, isSelected, isMatch, isDimmed, onSelect, onToggle }) => {
  const { node, depth, w, h, x, y, side, hasChildren, collapsed } = entry;
  const isRoot = depth === 0;
  const isBranch = depth === 1;
  const branch = getBranch(node.accent);
  const fontSize = nodeFontSize(depth);

  const hiddenCount = collapsed ? (node.children || []).length : 0;
  const toggleOnLeft = side === "left";

  const highlight = isSelected || isMatch;

  const style = isRoot
    ? {
        background: `linear-gradient(135deg, ${ROOT_THEME.fill} 0%, ${ROOT_THEME.fillEnd} 100%)`,
        borderColor: "rgba(255,255,255,.35)",
        color: ROOT_THEME.text,
        borderRadius: 22,
        boxShadow: isSelected
          ? `0 0 0 4px #bae6fd, 0 18px 40px -12px ${ROOT_THEME.glow}`
          : `0 14px 34px -12px ${ROOT_THEME.glow}`,
      }
    : isBranch
    ? {
        background: `linear-gradient(135deg, ${branch.stroke} 0%, ${branch.strong} 100%)`,
        borderColor: highlight ? "#ffffff" : "rgba(255,255,255,.25)",
        color: "#ffffff",
        borderRadius: 16,
        boxShadow: highlight
          ? `0 0 0 3px ${branch.border}, 0 12px 26px -10px ${branch.stroke}`
          : `0 8px 20px -10px ${branch.stroke}`,
      }
    : {
        background: highlight ? branch.tint : "#ffffff",
        borderStyle: "solid",
        borderWidth: "1.5px 1.5px 1.5px 5px",
        // Long-hand sides only — mixing borderColor with borderLeftColor makes React warn.
        borderTopColor: highlight ? branch.stroke : branch.border,
        borderRightColor: highlight ? branch.stroke : branch.border,
        borderBottomColor: highlight ? branch.stroke : branch.border,
        borderLeftColor: branch.stroke,
        color: branch.text,
        borderRadius: 12,
        boxShadow: isSelected
          ? `0 0 0 3px ${branch.soft}, 0 10px 22px -10px rgba(15,23,42,.35)`
          : "0 2px 8px -3px rgba(15,23,42,.18)",
      };

  const onDark = isRoot || isBranch;

  return (
    <motion.div
      className="absolute"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: isDimmed ? 0.28 : 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      style={{
        left: x,
        top: y - h / 2,
        width: w,
        minHeight: h,
        zIndex: isSelected ? 20 : 10,
      }}
    >
      <button
        type="button"
        onClick={() => onSelect(entry)}
        style={style}
        className={`flex w-full flex-col items-start gap-1.5 border text-left transition-all duration-150 hover:-translate-y-0.5 hover:brightness-105 ${
          isRoot ? "px-4 py-3" : "px-3 py-2"
        }`}
      >
        <span
          className="flex w-full items-center gap-2 font-bold leading-snug"
          style={{ fontSize }}
        >
          {node.icon && (
            <span
              className={`flex shrink-0 items-center justify-center rounded-full leading-none ${
                isRoot ? "h-8 w-8 text-lg" : onDark ? "h-6 w-6 text-sm" : "text-[13px]"
              }`}
              style={onDark ? { background: "rgba(255,255,255,.22)" } : undefined}
            >
              {node.icon}
            </span>
          )}
          <span className="break-words">{node.label}</span>
        </span>

        {node.formula && (
          <span
            className="max-w-full truncate rounded-md px-1.5 py-0.5 font-mono text-[10.5px] font-bold"
            style={{
              background: onDark ? "rgba(255,255,255,.2)" : branch.soft,
              color: onDark ? "#ffffff" : branch.strong,
            }}
          >
            {node.formula}
          </span>
        )}
      </button>

      {/* Collapse / expand handle, sitting on the side the branch grows towards */}
      {hasChildren && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(node.id);
          }}
          title={collapsed ? "Expand" : "Collapse"}
          style={{
            borderColor: isRoot ? ROOT_THEME.fill : branch.stroke,
            color: isRoot ? ROOT_THEME.fill : branch.stroke,
            [toggleOnLeft ? "left" : "right"]: -11,
          }}
          className="absolute top-1/2 z-30 flex h-[22px] min-w-[22px] -translate-y-1/2 items-center justify-center gap-0.5 rounded-full border-[1.5px] bg-white px-1 text-[10px] font-extrabold shadow-xs transition-transform hover:scale-110"
        >
          {collapsed ? (
            <>
              <span>{hiddenCount}</span>
              <Plus size={9} strokeWidth={3.5} />
            </>
          ) : (
            <Minus size={11} strokeWidth={3.5} />
          )}
        </button>
      )}
    </motion.div>
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

  // A fresh node means the previous explanation no longer applies.
  useEffect(() => {
    setExplanation("");
    setExplainError("");
    setExplaining(false);
  }, [node.id]);

  const runExplain = async () => {
    setExplaining(true);
    setExplainError("");
    try {
      const data = await explainMindMapNode(mapId, node.id, language);
      setExplanation(data.explanation || "");
    } catch (err) {
      setExplainError(
        isTa
          ? "விளக்கத்தைப் பெற முடியவில்லை. மீண்டும் முயற்சிக்கவும்."
          : "Could not get the explanation. Please try again."
      );
    }
    setExplaining(false);
  };

  return (
    <motion.aside
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="absolute bottom-3 right-3 top-3 z-40 flex w-[19rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:w-[21rem]"
    >
      <div
        className="flex items-start justify-between gap-2 px-4 py-3"
        style={{ background: accentColor }}
      >
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wide text-white/70">
            {isRoot
              ? isTa
                ? "மைய தலைப்பு"
                : "Main topic"
              : `${isTa ? "நிலை" : "Level"} ${entry.depth}`}
          </div>
          <h3 className="flex items-start gap-1.5 text-[15px] font-extrabold leading-snug text-white">
            {node.icon && <span className="shrink-0">{node.icon}</span>}
            <span className="break-words">{node.label}</span>
          </h3>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-lg p-1 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          title={isTa ? "மூடு" : "Close"}
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {node.formula && (
          <div
            className="mb-3 rounded-lg border px-3 py-2 text-center font-mono text-sm font-bold"
            style={{ background: branch.tint, borderColor: branch.border, color: branch.strong }}
          >
            {node.formula}
          </div>
        )}

        {node.summary && (
          <p className="text-[13px] leading-relaxed text-slate-700">{node.summary}</p>
        )}

        {node.points?.length > 0 && (
          <ul className="mt-3 space-y-2">
            {node.points.map((point, i) => (
              <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-slate-700">
                <span
                  className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: accentColor }}
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}

        {node.children?.length > 0 && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <GitBranch size={11} />
              <span>
                {isTa ? "உட்பிரிவுகள்" : "Parts of this topic"} ({node.children.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {node.children.map((child) => (
                <span
                  key={child.id}
                  className="rounded-full border px-2 py-0.5 text-[11px] font-semibold"
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

        {!node.summary && !node.points?.length && !node.formula && !node.children?.length && (
          <p className="text-[12.5px] italic text-slate-400">
            {isTa ? "இந்த முனைக்கு குறிப்புகள் இல்லை." : "No notes for this box yet."}
          </p>
        )}

        {/* AI expansion, grounded in what this node already says */}
        <div className="mt-4 border-t border-slate-100 pt-3">
          <button
            onClick={runExplain}
            disabled={explaining}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-bold text-[#0284c7] transition-all hover:bg-brand-100 active:scale-95 disabled:opacity-60"
          >
            {explaining ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            <span>
              {explaining
                ? isTa
                  ? "விளக்கம் தயாராகிறது..."
                  : "Explaining..."
                : explanation
                ? isTa
                  ? "மீண்டும் விளக்கு"
                  : "Explain again"
                : isTa
                ? "AI விளக்கம் பெறு"
                : "Explain with AI"}
            </span>
          </button>

          {explainError && (
            <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11.5px] font-medium text-red-600">
              {explainError}
            </p>
          )}

          {explanation && (
            <div className="mt-2.5 whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2.5 text-[12.5px] leading-relaxed text-slate-700">
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

  const [zoom, setZoom] = useState(0.75);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const viewportRef = useRef(null);
  const dragRef = useRef(null);

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
      // Start fully collapsed to just the branches: the student sees the shape
      // of the topic at a glance and opens branches themselves, rather than
      // landing on an already-busy canvas.
      const branchIds = new Set((data.map.root.children || []).map((b) => b.id));
      setCollapsed(branchIds);
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

  /* Search widens the tree so every hit is actually on screen */
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
   * Fit the drawing into the viewport.
   *
   * `floor` keeps the opening view readable: when a map is too big to shrink
   * into the frame without turning the labels to dust, it stays at the floor
   * and centres on the root instead, leaving the student to pan.
   * Returns false when the viewport has not been measured yet, so the caller
   * knows the fit still has to happen.
   */
  const fitToScreen = useCallback(
    (floor = MIN_ZOOM) => {
      const viewport = viewportRef.current;
      if (!viewport || !layout.width || !layout.height) return false;

      const { clientWidth, clientHeight } = viewport;
      if (!clientWidth || !clientHeight) return false;

      const ideal = Math.min(clientWidth / layout.width, clientHeight / layout.height) * 0.94;
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

  // Fit once per map, not on every expand — otherwise the canvas would jump
  // around under the student while they are opening branches.
  const needsFitRef = useRef(false);

  // Opening or folding a limb changes the drawing's size, which moves every
  // coordinate including the root's. Counter that shift so the central topic
  // stays exactly where it was on screen and the map grows around it.
  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const lastRootRef = useRef(null);
  useEffect(() => {
    const previous = lastRootRef.current;
    const current = layout.rootPoint;
    lastRootRef.current = current;

    // A pending fit is about to position the canvas itself; don't fight it.
    if (!previous || needsFitRef.current) return;

    const dx = (current.x - previous.x) * zoomRef.current;
    const dy = (current.y - previous.y) * zoomRef.current;
    if (dx || dy) setPan((p) => ({ x: p.x - dx, y: p.y - dy }));
  }, [layout.rootPoint]);

  useEffect(() => {
    if (mindMap) needsFitRef.current = true;
  }, [mindMap]);

  // The viewport can still measure zero on the first paint (a hidden tab, a
  // panel mid-transition), so wait for a real size before fitting.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    const tryFit = () => {
      if (needsFitRef.current && fitToScreen(0.42)) needsFitRef.current = false;
    };

    tryFit();
    const observer = new ResizeObserver(tryFit);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [fitToScreen]);

  /* Drag to pan */
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    // Let clicks on a card or its expand handle through — capturing the pointer
    // here would swallow the click those buttons are waiting for.
    if (e.target.closest?.("button")) return;
    dragRef.current = { x: e.clientX, y: e.clientY, pan: { ...pan } };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    setPan({
      x: drag.pan.x + (e.clientX - drag.x),
      y: drag.pan.y + (e.clientY - drag.y),
    });
  };

  const endDrag = (e) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  /* Ctrl/⌘ + wheel zooms; a plain wheel keeps scrolling the page */
  const onWheel = (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom((z) => clampZoom(z - e.deltaY * 0.0015));
  };

  const toggleNode = (id) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const expandAll = () => setCollapsed(new Set());

  // Fold every limb shut, leaving the central topic and its ten branches — the
  // bird's-eye view of the chapter.
  const collapseToBranches = () => {
    if (!mindMap) return;
    setCollapsed(new Set((mindMap.root.children || []).map((branch) => branch.id)));
  };

  /* Centre one branch in the viewport, used by the legend chips */
  const focusNode = (nodeId) => {
    const viewport = viewportRef.current;
    const entry = layout.nodes.find((n) => n.id === nodeId);
    if (!viewport || !entry) return;
    setPan({
      x: viewport.clientWidth / 2 - (entry.x + entry.w / 2) * zoom,
      y: viewport.clientHeight / 2 - entry.y * zoom,
    });
    setSelectedId(nodeId);
  };

  const searching = query.trim().length > 0;

  if (loading && !mindMap) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 size={28} className="animate-spin text-[#0284c7]" />
        <p className="text-sm font-semibold">
          {isTa ? "கருத்து வரைபடம் ஏற்றப்படுகிறது..." : "Loading the mind map..."}
        </p>
      </div>
    );
  }

  if (error || !mindMap) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <Network size={30} className="text-slate-300" />
        <p className="text-sm font-semibold text-slate-600">
          {isTa
            ? "வரைபடத்தை ஏற்ற முடியவில்லை. சேவையகம் இயங்குகிறதா எனச் சரிபார்க்கவும்."
            : "Could not load the mind map. Please try again."}
        </p>
        <button
          onClick={loadMap}
          className="flex items-center gap-1.5 rounded-lg bg-[#0284c7] px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-[#026aa2] active:scale-95"
        >
          <RefreshCw size={13} />
          <span>{isTa ? "மீண்டும் முயற்சி" : "Try again"}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-xs">
        {maps.length > 1 && (
          <select
            value={activeMapId}
            onChange={(e) => setActiveMapId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-brand-400"
          >
            {maps.map((m) => (
              <option key={m.id} value={m.id}>
                {m.icon} {m.title}
              </option>
            ))}
          </select>
        )}

        <div className="relative min-w-[10rem] flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isTa ? "கருத்து அல்லது சூத்திரம் தேடு..." : "Search a topic or formula..."}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-8 text-xs font-medium text-slate-700 outline-none transition-colors focus:border-brand-400 focus:bg-white"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {searching && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
            {matches.size} {isTa ? "பொருத்தம்" : matches.size === 1 ? "match" : "matches"}
          </span>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={expandAll}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition-all hover:border-brand-300 hover:text-[#0284c7] active:scale-95"
            title={isTa ? "அனைத்தையும் விரி" : "Expand all"}
          >
            <ChevronDown size={13} />
            <span className="hidden sm:inline">{isTa ? "அனைத்தும்" : "Expand"}</span>
          </button>
          <button
            onClick={collapseToBranches}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition-all hover:border-brand-300 hover:text-[#0284c7] active:scale-95"
            title={isTa ? "கிளைகளாக மடக்கு" : "Close all branches"}
          >
            <ChevronRight size={13} />
            <span className="hidden sm:inline">{isTa ? "மடக்கு" : "Collapse"}</span>
          </button>
        </div>

        <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          <button
            onClick={() => setZoom((z) => clampZoom(z - 0.15))}
            className="rounded-md p-1.5 text-slate-600 transition-colors hover:bg-white hover:text-[#0284c7]"
            title={isTa ? "சிறிதாக்கு" : "Zoom out"}
          >
            <Minus size={13} />
          </button>
          <span className="w-9 text-center text-[10px] font-bold text-slate-500">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => clampZoom(z + 0.15))}
            className="rounded-md p-1.5 text-slate-600 transition-colors hover:bg-white hover:text-[#0284c7]"
            title={isTa ? "பெரிதாக்கு" : "Zoom in"}
          >
            <Plus size={13} />
          </button>
          <button
            onClick={() => fitToScreen()}
            className="rounded-md p-1.5 text-slate-600 transition-colors hover:bg-white hover:text-[#0284c7]"
            title={isTa ? "திரைக்கு பொருத்து" : "Fit to screen"}
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Branch legend — a click flies the canvas to that limb */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {isTa ? "கிளைகள்" : "Branches"}
        </span>
        {(mindMap.root.children || []).map((branch) => {
          const theme = getBranch(branch.accent);
          return (
            <button
              key={branch.id}
              onClick={() => focusNode(branch.id)}
              className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-transform hover:scale-105 active:scale-95"
              style={{ background: theme.tint, borderColor: theme.border, color: theme.text }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: theme.stroke }}
              />
              {branch.icon && <span>{branch.icon}</span>}
              <span>{branch.label}</span>
            </button>
          );
        })}
      </div>

      {/* Canvas */}
      <div
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onWheel}
        className="relative h-[70vh] min-h-[26rem] cursor-grab touch-none select-none overflow-hidden rounded-2xl border border-slate-200 bg-white active:cursor-grabbing"
        style={{
          backgroundColor: "#f8fbff",
          backgroundImage: [
            "radial-gradient(circle at 1px 1px, #dbe4f0 1px, transparent 0)",
            "radial-gradient(ellipse at 50% 45%, rgba(56,189,248,.12) 0%, transparent 60%)",
          ].join(", "),
          backgroundSize: "24px 24px, 100% 100%",
        }}
      >
        <div
          style={{
            width: layout.width,
            height: layout.height,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
          className="relative"
        >
          {/* Connectors sit behind the cards */}
          <svg
            width={layout.width}
            height={layout.height}
            className="pointer-events-none absolute inset-0"
          >
            {layout.links.map((link) => {
              const theme = getBranch(link.accent);
              const dim = searching && !matches.has(link.id.split("->")[1]);
              const width = link.depth === 1 ? 5 : link.depth === 2 ? 2.6 : 1.8;
              return (
                <g key={link.id} opacity={dim ? 0.16 : 1}>
                  {/* Soft halo under the main branches so they read as thick limbs */}
                  {link.depth === 1 && (
                    <path
                      d={link.d}
                      fill="none"
                      stroke={theme.stroke}
                      strokeWidth={14}
                      strokeLinecap="round"
                      opacity={0.12}
                    />
                  )}
                  {/* Draws itself outward the first time the connector appears */}
                  <motion.path
                    d={link.d}
                    fill="none"
                    stroke={theme.stroke}
                    strokeWidth={width}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: link.depth === 1 ? 0.9 : 0.65 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                  />
                </g>
              );
            })}
          </svg>

          {layout.nodes.map((entry) => (
            <MapNode
              key={entry.id}
              entry={entry}
              isSelected={entry.id === selectedId}
              isMatch={searching && matches.has(entry.id)}
              isDimmed={searching && !matches.has(entry.id)}
              onSelect={(e) => setSelectedId(e.id)}
              onToggle={toggleNode}
            />
          ))}
        </div>

        {/* Drag hint, and the detail drawer */}
        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10.5px] font-semibold text-slate-500 shadow-xs backdrop-blur-sm">
          <Move size={11} />
          <span>
            {isTa
              ? "இழுத்து நகர்த்தவும் • Ctrl+சக்கரம் பெரிதாக்க • முனையைத் தட்டவும்"
              : "Drag to move • Ctrl + mouse wheel to zoom • Tap a box to read more"}
          </span>
        </div>

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

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] font-semibold text-slate-400">
        <span>
          {mindMap.nodeCount} {isTa ? "முனைகள்" : "concepts"} • {mindMap.branchCount}{" "}
          {isTa ? "முதன்மைக் கிளைகள்" : "main branches"}
        </span>
        <span>{mindMap.blurb}</span>
      </div>
    </div>
  );
};

export default MindMapView;
