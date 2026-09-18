import { doc, getDoc, getDocs, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";

/**
 * Test 1 / Test 2 records in the "activityLog" collection:
 *   module "prepost", action "submitted" — meta { testNumber, attemptId, score,
 *     maxScore, percent, sections, topics, questions, analysis (Test 2), … }
 *   module "prepost", action "rating"    — meta { testNumber, attemptId, rating, comment }
 *
 * Retakes: an admin writes retakeGrants/{uid} = { test1: <time>, test2: <time> }.
 * A student may take a test again when that grant is newer than their latest
 * submission — submitting again uses the grant up automatically.
 *
 * Shared by the test page, the student's profile report and the admin portal
 * (table + CSV), so all three read the results the same way. The LATEST
 * attempt of each test is the one that counts.
 */

export const PREPOST_MODULE = "prepost";
export const TEST_NAMES = { 1: "Test 1", 2: "Test 2" };
const GRANTS = "retakeGrants";

export const toDate = (ts) => {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
};

const time = (e) => toDate(e.timestamp)?.getTime() || 0;

/** Every attempt of each test, oldest first, each with its own rating. */
export function prePostAttempts(events) {
  const prepost = events.filter((e) => e.module === PREPOST_MODULE).sort((a, b) => time(a) - time(b));
  const attempts = { 1: [], 2: [] };

  prepost
    .filter((e) => e.action === "submitted")
    .forEach((e) => {
      const n = e.meta?.testNumber === 2 ? 2 : 1;
      attempts[n].push({
        attemptNo: attempts[n].length + 1,
        attemptId: e.meta?.attemptId || null,
        result: e.meta,
        submittedAt: toDate(e.timestamp),
        rating: null,
      });
    });

  prepost
    .filter((e) => e.action === "rating")
    .forEach((e) => {
      const n = e.meta?.testNumber === 2 ? 2 : 1;
      const list = attempts[n];
      if (!list.length) return;
      const rating = { ...e.meta, at: toDate(e.timestamp) };
      // Newer records carry the attempt id; older ones are matched by time
      // (the attempt submitted most recently before the rating).
      let target = e.meta?.attemptId ? list.find((a) => a.attemptId === e.meta.attemptId) : null;
      if (!target && !e.meta?.attemptId) {
        const before = list.filter((a) => (a.submittedAt?.getTime() || 0) <= time(e));
        target = before[before.length - 1] || list[0];
      }
      if (target && !target.rating) target.rating = rating;
    });

  return attempts;
}

/**
 * { 1: { result, rating, submittedAt, attempts }, 2: { … } } — result, rating
 * and submittedAt are from the latest attempt.
 */
export function prePostSummary(events) {
  const all = prePostAttempts(events);
  const pick = (n) => {
    const latest = all[n][all[n].length - 1];
    return {
      result: latest?.result || null,
      rating: latest?.rating || null,
      submittedAt: latest?.submittedAt || null,
      attemptId: latest?.attemptId || null,
      attempts: all[n],
    };
  };
  return { 1: pick(1), 2: pick(2) };
}

/** Marks gained from Test 1 to Test 2 (latest attempts), or null until both are done. */
export function improvement(summary) {
  const t1 = summary[1].result;
  const t2 = summary[2].result;
  if (!t1 || !t2) return null;
  return {
    marks: Math.round((t2.score - t1.score) * 10) / 10,
    percent: t2.percent - t1.percent,
  };
}

/* ── Retake grants ─────────────────────────────────────────────────────────── */

/** True when the admin has allowed test `n` again since the last submission. */
export function retakeAllowed(summary, grant, n) {
  const grantedAt = toDate(grant?.[`test${n}`]);
  if (!grantedAt) return false;
  const last = summary[n].submittedAt;
  return !last || grantedAt > last;
}

export async function fetchOwnRetakeGrant(uid) {
  try {
    const snap = await getDoc(doc(db, GRANTS, uid));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.warn("[prepost] could not read retake grant:", err.code || err);
    return null;
  }
}

/** Admin only: { uid: grant } for every student. */
export async function fetchAllRetakeGrants() {
  const snap = await getDocs(collection(db, GRANTS));
  const map = {};
  snap.docs.forEach((d) => {
    map[d.id] = d.data();
  });
  return map;
}

/** Admin only: allow (or cancel) one more attempt of test `n` for a student. */
export async function setRetakeGrant(uid, n, allow, adminUid) {
  await setDoc(
    doc(db, GRANTS, uid),
    { [`test${n}`]: allow ? serverTimestamp() : null, updatedBy: adminUid || null, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/* ── CSV ───────────────────────────────────────────────────────────────────── */

const csvCell = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const TOPIC_COLUMNS = [
  ["newtons-second-law", "Newton's 2nd Law %"],
  ["gravitation", "Gravitation %"],
  ["mass-vs-weight", "Mass vs Weight %"],
  ["torque", "Torque %"],
  ["conservation-of-momentum", "Conservation of Momentum %"],
  ["impulse", "Impulse %"],
];
const QUESTION_COLUMNS = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "Q9", "Q10", "Q11", "Q12"];

/**
 * One row per attempt, for the admin CSV. "Counted" marks the latest attempt
 * of each test — the one used for the student's result and improvement.
 * students: [{ uid, username, name, events }]
 */
export function prePostCsv(students) {
  const header = [
    "Username", "Name", "Test", "Attempt", "Counted (latest)", "Submitted At", "Time Taken (min)", "Language",
    "Score", "Out Of", "Percent",
    "Part A (1 mark)", "Part B (2 marks)", "Part C (5 marks)",
    ...TOPIC_COLUMNS.map(([, label]) => label),
    ...QUESTION_COLUMNS.map((q) => `${q} marks`),
    "Q11 choice", "Q12 choice",
    "Improvement (marks, latest Test 2 − latest Test 1)",
    "Rating (1-5)", "Comment",
    "Warnings (left full screen / switched tab)", "Auto-submitted", "Warning Details",
  ];
  const rows = [header];

  students.forEach((s) => {
    const summary = prePostSummary(s.events);
    const gain = improvement(summary);
    [1, 2].forEach((n) => {
      const list = summary[n].attempts;
      list.forEach((a, i) => {
        const r = a.result;
        const latest = i === list.length - 1;
        const topic = (id) => (r.topics || []).find((t) => t.topic === id)?.percent ?? "";
        const qMarks = {};
        const choice = {};
        (r.questions || []).forEach((q) => {
          const num = q.label.replace(/\(.*\)/, "");
          qMarks[num] = q.marks;
          const m = q.label.match(/\((a|b)\)/);
          if (m) choice[num] = m[1];
        });
        const sec = (id) => (r.sections?.[id] ? r.sections[id].marks : "");
        rows.push([
          s.username, s.name, TEST_NAMES[n], a.attemptNo, latest ? "Yes" : "No",
          a.submittedAt ? a.submittedAt.toLocaleString() : "",
          r.durationSec ? Math.round(r.durationSec / 60) : "",
          r.language || "",
          r.score, r.maxScore, r.percent,
          sec("A"), sec("B"), sec("C"),
          ...TOPIC_COLUMNS.map(([id]) => topic(id)),
          ...QUESTION_COLUMNS.map((q) => qMarks[q] ?? ""),
          choice.Q11 || "", choice.Q12 || "",
          n === 2 && latest && gain ? gain.marks : "",
          a.rating?.rating ?? "",
          a.rating?.comment ?? "",
          r.integrity ? r.integrity.warnings : "",
          r.integrity ? (r.integrity.autoSubmitted ? "Yes" : "No") : "",
          (r.integrity?.events || []).map((w) => `${w.type} @ ${new Date(w.at).toLocaleTimeString()}`).join("; "),
        ]);
      });
    });
  });

  return "﻿" + rows.map((row) => row.map(csvCell).join(",")).join("\n");
}
