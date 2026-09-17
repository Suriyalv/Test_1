import React, { useState, useMemo } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

const COLUMNS = [
  { key: "username", label: "Student" },
  { key: "count", label: "Events" },
  { key: "lastActive", label: "Last Active" },
];

const formatTime = (date) => {
  if (!date) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** Client-side sort only — the rows are already the full aggregated array
 * from activityQueries, so re-sorting never triggers a new Firestore read. */
const ActivityTable = ({ rows }) => {
  const [sortKey, setSortKey] = useState("count");
  const [sortDir, setSortDir] = useState("desc");

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (sortKey === "lastActive") {
        av = av ? av.getTime() : 0;
        bv = bv ? bv.getTime() : 0;
      }
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  if (rows.length === 0) {
    return <p className="py-8 text-center text-xs text-slate-400">No activity recorded yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                className="cursor-pointer select-none px-3 py-2 font-bold uppercase tracking-wide hover:text-slate-600"
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {sortKey === col.key &&
                    (sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.uid} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              <td className="px-3 py-2 font-semibold text-slate-800">{row.username}</td>
              <td className="px-3 py-2 text-slate-600">{row.count}</td>
              <td className="px-3 py-2 text-slate-500">{formatTime(row.lastActive)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ActivityTable;
