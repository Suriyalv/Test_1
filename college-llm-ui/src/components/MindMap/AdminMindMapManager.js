import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  fetchMindMaps,
  fetchMindMap,
  addMindMapNode,
  updateMindMapNode,
  deleteMindMapNode,
} from "../../api";
import { BRANCH_KEYS, getBranch, ROOT_THEME } from "./mindMapTheme";
import {
  PlusCircle,
  Trash2,
  RefreshCw,
  Save,
  X,
  ChevronRight,
  ChevronDown,
  Check,
  Pencil,
  CornerDownRight,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EMPTY_FORM = {
  label: "",
  labelTa: "",
  icon: "",
  accent: "blue",
  formula: "",
  summary: "",
  summaryTa: "",
  points: "",
  pointsTa: "",
};

/** Count a node and everything under it, so a delete can say what it takes. */
const countSubtree = (node) =>
  1 + (node.children || []).reduce((total, child) => total + countSubtree(child), 0);

/* ── One row of the outline tree ─────────────────────────────────────────────── */
const OutlineRow = ({ node, depth, selectedId, openIds, onSelect, onToggle }) => {
  const branch = getBranch(node.accent);
  const isSelected = node.id === selectedId;
  const isOpen = openIds.has(node.id);
  const hasChildren = (node.children || []).length > 0;
  const color = depth === 0 ? ROOT_THEME.fill : branch.stroke;

  return (
    <>
      <div
        className={`flex items-center gap-1 rounded-lg py-1 pr-2 transition-colors ${
          isSelected ? "bg-brand-50 ring-1 ring-brand-300" : "hover:bg-slate-50"
        }`}
        style={{ paddingLeft: 4 + depth * 14 }}
      >
        <button
          type="button"
          onClick={() => hasChildren && onToggle(node.id)}
          className={`shrink-0 rounded p-0.5 ${
            hasChildren ? "text-slate-400 hover:text-slate-700" : "invisible"
          }`}
        >
          {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>

        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />

        <button
          type="button"
          onClick={() => onSelect(node)}
          className={`flex-1 truncate py-0.5 text-left text-[12px] ${
            isSelected ? "font-bold text-[#0284c7]" : "font-medium text-slate-700"
          }`}
          title={node.label}
        >
          {node.icon ? `${node.icon} ` : ""}
          {node.label}
        </button>

        {hasChildren && (
          <span className="shrink-0 rounded-full bg-slate-100 px-1.5 text-[9.5px] font-bold text-slate-500">
            {node.children.length}
          </span>
        )}
      </div>

      {isOpen &&
        (node.children || []).map((child) => (
          <OutlineRow
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedId={selectedId}
            openIds={openIds}
            onSelect={onSelect}
            onToggle={onToggle}
          />
        ))}
    </>
  );
};

/* ── Teacher console for building out the map ─────────────────────────────────── */
const AdminMindMapManager = ({ language = "en", onChanged }) => {
  const isTa = language === "ta";

  const [maps, setMaps] = useState([]);
  const [activeMapId, setActiveMapId] = useState("");
  const [mindMap, setMindMap] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(null);
  const [openIds, setOpenIds] = useState(new Set(["root"]));
  const [mode, setMode] = useState("add"); // "add" a child | "edit" the selection
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null); // { kind: "ok" | "error", text }

  const flash = (kind, text) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 3200);
  };

  useEffect(() => {
    fetchMindMaps(language)
      .then((data) => {
        const list = data.maps || [];
        setMaps(list);
        setActiveMapId((current) => current || (list[0] ? list[0].id : ""));
      })
      .catch(() => flash("error", "Could not load the mind map catalogue."));
  }, [language]);

  const loadMap = useCallback(async () => {
    if (!activeMapId) return;
    setLoading(true);
    try {
      const data = await fetchMindMap(activeMapId, "en");
      setMindMap(data.map);
      setSelected((current) => {
        if (!current) return data.map.root;
        // Keep the selection across a reload where the node still exists.
        const find = (node) =>
          node.id === current.id
            ? node
            : (node.children || []).reduce((hit, child) => hit || find(child), null);
        return find(data.map.root) || data.map.root;
      });
    } catch (err) {
      flash("error", "Could not load the mind map.");
      setMindMap(null);
    }
    setLoading(false);
  }, [activeMapId]);

  useEffect(() => {
    loadMap();
  }, [loadMap]);

  const toggleOpen = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectNode = (node) => {
    setSelected(node);
    setMode("add");
    setForm(EMPTY_FORM);
  };

  /** Load the selected node's own content into the form for editing. */
  const startEditing = () => {
    if (!selected) return;
    setMode("edit");
    setForm({
      label: selected.label || "",
      labelTa: "",
      icon: selected.icon || "",
      accent: selected.accent || "blue",
      formula: selected.formula || "",
      summary: selected.summary || "",
      summaryTa: "",
      points: (selected.points || []).join("\n"),
      pointsTa: "",
    });
  };

  const cancelEditing = () => {
    setMode("add");
    setForm(EMPTY_FORM);
  };

  const isTopLevel = useMemo(
    () =>
      mode === "add"
        ? selected?.id === "root"
        : (mindMap?.root.children || []).some((b) => b.id === selected?.id),
    [mode, selected, mindMap]
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!form.label.trim()) {
      flash("error", isTa ? "தலைப்பு தேவை." : "A node label is required.");
      return;
    }
    if (!selected) return;

    // Only a top-level branch carries its own colour — for anything deeper the
    // accent must stay unset so the node keeps inheriting its limb's colour.
    const payload = { ...form };
    if (!isTopLevel) delete payload.accent;

    setSaving(true);
    try {
      if (mode === "edit") {
        await updateMindMapNode(activeMapId, selected.id, payload);
        flash("ok", isTa ? "முனை புதுப்பிக்கப்பட்டது." : "Node updated.");
      } else {
        await addMindMapNode(activeMapId, { ...payload, parentId: selected.id });
        flash(
          "ok",
          isTa ? "புதிய முனை சேர்க்கப்பட்டது." : `Added under "${selected.label}".`
        );
        setOpenIds((prev) => new Set(prev).add(selected.id));
      }
      setForm(EMPTY_FORM);
      setMode("add");
      await loadMap();
      onChanged?.();
    } catch (err) {
      flash("error", err.message || "Save failed.");
    }
    setSaving(false);
  };

  const removeSelected = async () => {
    if (!selected || selected.id === "root") return;
    const total = countSubtree(selected);
    const message = isTa
      ? `"${selected.label}" மற்றும் அதன் கீழுள்ள ${total - 1} முனைகளை நீக்கவா?`
      : total > 1
      ? `Delete "${selected.label}" and the ${total - 1} node(s) beneath it?`
      : `Delete "${selected.label}"?`;
    if (!window.confirm(message)) return;

    setSaving(true);
    try {
      await deleteMindMapNode(activeMapId, selected.id);
      flash("ok", isTa ? "முனை நீக்கப்பட்டது." : "Node deleted.");
      setSelected(null);
      setMode("add");
      setForm(EMPTY_FORM);
      await loadMap();
      onChanged?.();
    } catch (err) {
      flash("error", err.message || "Delete failed.");
    }
    setSaving(false);
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[12.5px] text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-400 focus:bg-white";

  if (loading && !mindMap) {
    return (
      <div className="flex h-[50vh] items-center justify-center gap-2 text-slate-400">
        <Loader2 size={22} className="animate-spin text-[#0284c7]" />
        <span className="text-sm font-semibold">
          {isTa ? "ஏற்றப்படுகிறது..." : "Loading the map..."}
        </span>
      </div>
    );
  }

  if (!mindMap) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm font-semibold text-slate-600">
          {isTa
            ? "வரைபடத்தை ஏற்ற முடியவில்லை."
            : "Could not load the mind map. Is the backend running?"}
        </p>
        <button
          onClick={loadMap}
          className="flex items-center gap-1.5 rounded-lg bg-[#0284c7] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#026aa2]"
        >
          <RefreshCw size={13} /> {isTa ? "மீண்டும்" : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
              notice.kind === "ok"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {notice.kind === "ok" ? <Check size={14} /> : <X size={14} />}
            <span>{notice.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        {/* Outline of the whole map */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
          <div className="mb-2 flex items-center justify-between gap-2">
            {maps.length > 1 ? (
              <select
                value={activeMapId}
                onChange={(e) => setActiveMapId(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11.5px] font-bold text-slate-700 outline-none"
              >
                {maps.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.icon} {m.title}
                  </option>
                ))}
              </select>
            ) : (
              <div className="truncate text-[11.5px] font-extrabold text-slate-700">
                {mindMap.icon} {mindMap.title}
              </div>
            )}
            <button
              onClick={loadMap}
              title={isTa ? "புதுப்பி" : "Reload"}
              className="shrink-0 rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:text-[#0284c7]"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <OutlineRow
              node={mindMap.root}
              depth={0}
              selectedId={selected?.id}
              openIds={openIds}
              onSelect={selectNode}
              onToggle={toggleOpen}
            />
          </div>

          <p className="mt-2 border-t border-slate-100 pt-2 text-[10.5px] font-semibold text-slate-400">
            {mindMap.nodeCount} {isTa ? "முனைகள்" : "nodes"} •{" "}
            {isTa ? "ஒரு முனையைத் தேர்ந்தெடுக்கவும்" : "pick a node to add under or edit"}
          </p>
        </div>

        {/* Composer */}
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          {!selected ? (
            <p className="py-16 text-center text-sm font-semibold text-slate-400">
              {isTa
                ? "இடதுபுறம் ஒரு முனையைத் தேர்ந்தெடுக்கவும்."
                : "Select a node on the left to begin."}
            </p>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#0284c7]">
                    {mode === "edit" ? <Pencil size={11} /> : <CornerDownRight size={11} />}
                    <span>
                      {mode === "edit"
                        ? isTa
                          ? "முனையைத் திருத்து"
                          : "Editing node"
                        : isTa
                        ? "இதன் கீழ் சேர்"
                        : "Adding under"}
                    </span>
                  </div>
                  <div className="truncate text-sm font-extrabold text-slate-900">
                    {selected.icon ? `${selected.icon} ` : ""}
                    {selected.label}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {mode === "add" ? (
                    <button
                      type="button"
                      onClick={startEditing}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition-all hover:border-brand-300 hover:text-[#0284c7] active:scale-95"
                    >
                      <Pencil size={12} /> {isTa ? "திருத்து" : "Edit this"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition-all hover:text-slate-900 active:scale-95"
                    >
                      <X size={12} /> {isTa ? "ரத்து" : "Cancel"}
                    </button>
                  )}

                  {selected.id !== "root" && (
                    <button
                      type="button"
                      onClick={removeSelected}
                      disabled={saving}
                      className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-600 transition-all hover:bg-red-100 active:scale-95 disabled:opacity-50"
                    >
                      <Trash2 size={12} /> {isTa ? "நீக்கு" : "Delete"}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold text-slate-600">
                    {isTa ? "தலைப்பு (English)" : "Label (English)"} *
                  </span>
                  <input
                    {...field("label")}
                    className={inputClass}
                    placeholder={isTa ? "எ.கா. Impulse" : "e.g. Impulse"}
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold text-slate-600">
                    {isTa ? "தலைப்பு (தமிழ்)" : "Label (Tamil)"}
                  </span>
                  <input
                    {...field("labelTa")}
                    className={inputClass}
                    placeholder={isTa ? "எ.கா. உந்துவிசை" : "Left blank → English is reused"}
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold text-slate-600">
                    {isTa ? "ஐகான் (எமோஜி)" : "Icon (emoji)"}
                  </span>
                  <input {...field("icon")} className={inputClass} placeholder="💥" maxLength={4} />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold text-slate-600">
                    {isTa ? "சூத்திரம்" : "Formula"}
                  </span>
                  <input
                    {...field("formula")}
                    className={`${inputClass} font-mono`}
                    placeholder="J = F × t = Δp"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-[11px] font-bold text-slate-600">
                    {isTa ? "விளக்கம் (English)" : "Summary (English)"}
                  </span>
                  <textarea
                    {...field("summary")}
                    rows={2}
                    className={inputClass}
                    placeholder={
                      isTa ? "ஒரு சிறு விளக்கம்" : "One or two sentences describing this concept"
                    }
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-[11px] font-bold text-slate-600">
                    {isTa ? "விளக்கம் (தமிழ்)" : "Summary (Tamil)"}
                  </span>
                  <textarea
                    {...field("summaryTa")}
                    rows={2}
                    className={inputClass}
                    placeholder={isTa ? "தமிழ் விளக்கம்" : "Left blank → English is reused"}
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-[11px] font-bold text-slate-600">
                    {isTa ? "புள்ளிகள் — ஒரு வரிக்கு ஒன்று" : "Key points — one per line"}
                  </span>
                  <textarea
                    {...field("points")}
                    rows={4}
                    className={inputClass}
                    placeholder={
                      isTa
                        ? "ஒவ்வொரு வரியும் ஒரு புள்ளியாகும்"
                        : "Each line becomes its own bullet in the detail panel"
                    }
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-[11px] font-bold text-slate-600">
                    {isTa ? "புள்ளிகள் (தமிழ்)" : "Key points (Tamil)"}
                  </span>
                  <textarea
                    {...field("pointsTa")}
                    rows={3}
                    className={inputClass}
                    placeholder={isTa ? "ஒரு வரிக்கு ஒன்று" : "Left blank → English is reused"}
                  />
                </label>
              </div>

              {/* Only the top level picks a colour — deeper nodes inherit the limb's */}
              {isTopLevel && (
                <div className="mt-3">
                  <span className="mb-1.5 block text-[11px] font-bold text-slate-600">
                    {isTa ? "கிளை நிறம்" : "Branch colour"}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {BRANCH_KEYS.map((key) => {
                      const theme = getBranch(key);
                      const active = form.accent === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, accent: key }))}
                          title={theme.label}
                          className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                            active ? "scale-110" : ""
                          }`}
                          style={{
                            background: theme.tint,
                            borderColor: active ? theme.stroke : theme.border,
                            boxShadow: active ? `0 0 0 2px ${theme.soft}` : "none",
                          }}
                        >
                          <span
                            className="mx-auto block h-3 w-3 rounded-full"
                            style={{ background: theme.stroke }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0284c7] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#026aa2] active:scale-95 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : mode === "edit" ? (
                  <Save size={15} />
                ) : (
                  <PlusCircle size={15} />
                )}
                <span>
                  {saving
                    ? isTa
                      ? "சேமிக்கிறது..."
                      : "Saving..."
                    : mode === "edit"
                    ? isTa
                      ? "மாற்றங்களைச் சேமி"
                      : "Save changes"
                    : isTa
                    ? "முனையைச் சேர்"
                    : "Add node"}
                </span>
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default AdminMindMapManager;
