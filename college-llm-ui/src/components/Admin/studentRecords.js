import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

/**
 * Data layer for the admin Student Records page. Reads the same "activityLog"
 * collection every module writes to (see src/activity.js) and turns it into
 * one record per student: logins, modules used, and every scored result with
 * its time. All grouping happens client-side from a single ordered fetch, so
 * no composite Firestore index is needed.
 */

export const MODULE_LABELS = {
  auth: "Login",
  chat: "AI Chat",
  test: "Test",
  video: "Video Lesson",
  flashcards: "Flashcards",
  mindmap: "Mind Map",
  kahoot: "Kahoot Quiz",
  "concept-bridge": "Concept Bridge",
  movie_physics: "Movie Physics",
  progress: "My Progress",
  prepost: "Test 1 / Test 2",
};

export const moduleLabel = (m) => MODULE_LABELS[m] || m;

export const toDate = (ts) => {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
};

export async function fetchActivityForRecords(limitN = 5000) {
  const snap = await getDocs(
    query(collection(db, "activityLog"), orderBy("timestamp", "desc"), limit(limitN))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** users/{uid} profiles (name, username). Optional — if the Firestore rules
 * don't let admins list users, the page still works from activityLog alone. */
export async function fetchUserProfiles() {
  try {
    const snap = await getDocs(collection(db, "users"));
    const map = {};
    snap.docs.forEach((d) => {
      map[d.id] = d.data();
    });
    return map;
  } catch (err) {
    console.warn("[records] could not read users collection:", err.code || err);
    return {};
  }
}

/**
 * Turns one event into a result row, or null if the event isn't a scored
 * result (e.g. "opened", a login, a flashcard review).
 * score is a 0–100 percentage.
 */
export function describeResult(e) {
  const m = e.meta || {};
  if (e.module === "test" && e.action === "attempt" && typeof m.accuracy === "number") {
    const topic = m.topic ? ` · ${m.topic}${m.level ? ` (${m.level})` : ""}` : "";
    return {
      activity: `Test · ${m.category || "General"}${topic}`,
      score: Math.round(m.accuracy),
      detail: m.question || "",
    };
  }
  if (e.module === "video" && e.action === "final_quiz_completed") {
    return {
      activity: "Video lesson final quiz",
      score: typeof m.accuracy === "number" ? Math.round(m.accuracy) : null,
      detail: m.lessonId ? `Lesson: ${m.lessonId}` : "",
    };
  }
  if (e.module === "kahoot" && e.action === "quiz_completed") {
    return {
      activity: `Kahoot · ${m.quizTitle || m.quizId || "Quiz"}`,
      score: typeof m.accuracy === "number" ? m.accuracy : null,
      detail: `${m.points ?? 0}/${m.maxPoints ?? 0} points · ${m.correct ?? 0}/${m.total ?? 0} correct`,
    };
  }
  if (e.module === "prepost" && e.action === "submitted") {
    return {
      activity: m.testNumber === 2 ? "Test 2" : "Test 1",
      score: typeof m.percent === "number" ? m.percent : null,
      detail: `${m.score ?? 0}/${m.maxScore ?? 25} marks`,
    };
  }
  if (e.module === "concept-bridge" && e.action === "analogy_submitted") {
    const got = m.propertiesCapturedCount || 0;
    const total = got + (m.propertiesMissedCount || 0);
    return {
      activity: `Concept Bridge · ${m.conceptId || "analogy"}`,
      score: total ? Math.round((got / total) * 100) : null,
      detail: `${got}/${total} ideas captured`,
    };
  }
  return null;
}

const average = (nums) =>
  nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;

/** Keeps only events at or after `since` (a Date), or all when since is null. */
export function filterSince(events, since) {
  if (!since) return events;
  return events.filter((e) => {
    const d = toDate(e.timestamp);
    return d && d >= since;
  });
}

/** One record per student, sorted by most recently active first. */
export function buildStudentRecords(events, profiles = {}) {
  const byUid = {};

  events.forEach((e) => {
    const uid = e.uid || "unknown";
    if (!byUid[uid]) {
      const profile = profiles[uid] || {};
      byUid[uid] = {
        uid,
        username: profile.username || e.username || "—",
        name: profile.name || "",
        logins: [],
        modules: {},
        results: [],
        chatQuestions: 0,
        lastActive: null,
      };
    }
    const rec = byUid[uid];
    const when = toDate(e.timestamp);

    if (when && (!rec.lastActive || when > rec.lastActive)) rec.lastActive = when;

    if (e.module === "auth") {
      if (e.action === "login" || e.action === "signup") rec.logins.push(when);
      return;
    }

    rec.modules[e.module] = (rec.modules[e.module] || 0) + 1;
    if (e.module === "chat" && e.action === "question_asked") rec.chatQuestions += 1;

    const result = describeResult(e);
    if (result) rec.results.push({ id: e.id, module: e.module, when, ...result });
  });

  return Object.values(byUid)
    .map((rec) => {
      const scoresFor = (mod) =>
        rec.results.filter((r) => r.module === mod && typeof r.score === "number").map((r) => r.score);
      const testScores = scoresFor("test");
      const logins = rec.logins.filter(Boolean).sort((a, b) => b - a);
      return {
        ...rec,
        logins,
        loginCount: rec.logins.length,
        lastLogin: logins[0] || null,
        results: rec.results.sort((a, b) => (b.when?.getTime() || 0) - (a.when?.getTime() || 0)),
        modulesUsed: Object.keys(rec.modules).filter((m) => m !== "progress"),
        testsTaken: testScores.length,
        avgTest: average(testScores),
        avgVideo: average(scoresFor("video")),
        avgKahoot: average(scoresFor("kahoot")),
        avgBridge: average(scoresFor("concept-bridge")),
        avgOverall: average(rec.results.filter((r) => typeof r.score === "number").map((r) => r.score)),
      };
    })
    .sort((a, b) => (b.lastActive?.getTime() || 0) - (a.lastActive?.getTime() || 0));
}

const csvCell = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Every scored result for every student, one row each — for the teacher's
 * spreadsheet. Excel opens this directly (BOM keeps Tamil text intact). */
export function recordsToCsv(records) {
  const rows = [["Username", "Name", "Date & Time", "Module", "Activity", "Score (%)", "Details"]];
  records.forEach((rec) => {
    rec.results.forEach((r) => {
      rows.push([
        rec.username,
        rec.name,
        r.when ? r.when.toLocaleString() : "",
        moduleLabel(r.module),
        r.activity,
        r.score ?? "",
        r.detail,
      ]);
    });
  });
  return "﻿" + rows.map((row) => row.map(csvCell).join(",")).join("\n");
}
