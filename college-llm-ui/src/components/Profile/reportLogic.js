import { ADAPTIVE_TOPICS } from "../TestTaking/adaptiveTest";

/**
 * Pure functions that turn one student's activityLog events into a full
 * performance report: overall grade, per-topic / per-module / per-level
 * scores, strengths, weaknesses, trend and study recommendations.
 *
 * Shared by the student's own Profile page and the admin's per-student
 * report, so both always show exactly the same numbers.
 */

/** An area needs at least this many scored answers before it can be called a
 * strength or a weakness — one lucky/unlucky answer shouldn't label a topic. */
export const MIN_ATTEMPTS = 2;
export const STRONG_AT = 75;
export const WEAK_BELOW = 50;

const MODULE_NAMES = {
  test: { en: "Tests", ta: "தேர்வுகள்" },
  video: { en: "Video Lessons", ta: "வீடியோ பாடங்கள்" },
  kahoot: { en: "Kahoot Quiz", ta: "வினாடி வினா" },
  "concept-bridge": { en: "Concept Bridge", ta: "கருத்து பாலம்" },
  flashcards: { en: "Flashcards", ta: "அட்டைகள்" },
  mindmap: { en: "Mind Map", ta: "வரைபடம்" },
  chat: { en: "AI Chat", ta: "AI அரட்டை" },
  movie_physics: { en: "Movie Physics", ta: "திரைப்பட இயற்பியல்" },
  prepost: { en: "Test 1 / Test 2", ta: "Test 1 / Test 2" },
};

export const moduleName = (m, isTa) => (MODULE_NAMES[m] ? MODULE_NAMES[m][isTa ? "ta" : "en"] : m);

const LEVEL_NAMES = {
  easy: { en: "Easy", ta: "எளிது" },
  medium: { en: "Medium", ta: "நடுத்தரம்" },
  hard: { en: "Hard", ta: "கடினம்" },
};

/** "newtons-second-law" -> the curriculum name if known, else "Newtons Second Law". */
export function topicName(id, isTa) {
  if (!id) return isTa ? "பொது" : "General";
  const known = ADAPTIVE_TOPICS.find((t) => t.id === id);
  if (known) return isTa ? known.ta : known.en;
  return String(id)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const toDate = (ts) => {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
};

const avg = (nums) => (nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null);

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/**
 * Every scored answer as { when, module, topic, level, category, score }.
 * score is 0–100. Video checkpoint questions are right/wrong, so 100 or 0.
 */
export function extractScores(events) {
  const out = [];
  events.forEach((e) => {
    const m = e.meta || {};
    const when = toDate(e.timestamp);
    const base = { id: e.id, when, module: e.module };

    if (e.module === "test" && e.action === "attempt" && typeof m.accuracy === "number") {
      out.push({ ...base, topic: m.topic || null, level: m.level || null, category: m.category || null, score: m.accuracy, question: m.question || "" });
    } else if (e.module === "video" && (e.action === "checkpoint_answered" || e.action === "final_quiz_answered") && typeof m.correct === "boolean") {
      out.push({ ...base, topic: m.conceptId || null, score: m.correct ? 100 : 0 });
    } else if (e.module === "kahoot" && e.action === "quiz_completed" && typeof m.accuracy === "number") {
      out.push({ ...base, topic: null, quiz: m.quizTitle || m.quizId, score: m.accuracy });
    } else if (e.module === "concept-bridge" && e.action === "analogy_submitted") {
      const got = m.propertiesCapturedCount || 0;
      const total = got + (m.propertiesMissedCount || 0);
      if (total) out.push({ ...base, topic: m.conceptId || null, score: Math.round((got / total) * 100) });
    }
  });
  return out.sort((a, b) => (a.when?.getTime() || 0) - (b.when?.getTime() || 0));
}

function groupAverage(scores, keyFn, labelFn) {
  const groups = {};
  scores.forEach((s) => {
    const key = keyFn(s);
    if (!key) return;
    if (!groups[key]) groups[key] = [];
    groups[key].push(s.score);
  });
  return Object.entries(groups)
    .map(([key, list]) => ({ key, label: labelFn(key), avg: avg(list), count: list.length }))
    .sort((a, b) => b.avg - a.avg);
}

export function gradeFor(score, isTa) {
  if (score === null) return { label: isTa ? "தரவு இல்லை" : "No data yet", tone: "slate" };
  if (score >= 85) return { label: isTa ? "சிறப்பு" : "Excellent", tone: "emerald" };
  if (score >= 70) return { label: isTa ? "நன்று" : "Good", tone: "sky" };
  if (score >= 50) return { label: isTa ? "சராசரி" : "Average", tone: "amber" };
  return { label: isTa ? "உதவி தேவை" : "Needs support", tone: "red" };
}

/** Consecutive days (ending today or yesterday) with at least one event. */
function currentStreak(activeDays) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (!activeDays.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (activeDays.has(dayKey(d))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/** Compares the average of the latest 5 scores with the 5 before them. */
function computeTrend(scores) {
  if (scores.length < 6) return { direction: "not-enough", delta: 0 };
  const recent = avg(scores.slice(-5).map((s) => s.score));
  const before = avg(scores.slice(-10, -5).map((s) => s.score));
  const delta = recent - before;
  if (delta >= 5) return { direction: "up", delta };
  if (delta <= -5) return { direction: "down", delta };
  return { direction: "steady", delta };
}

function buildRecommendations({ weaknesses, moduleCounts, levelScores, daysSinceActive, scores }, isTa) {
  const recs = [];

  // Advice depends on what kind of area is weak: a topic, a question type, or a module.
  weaknesses.slice(0, 3).forEach((w) => {
    if (w.kind === "topic") {
      recs.push(
        isTa
          ? `"${w.label}" — ${w.avg}% மட்டுமே. இந்தப் பாடத்தின் வீடியோ பாடத்தைப் பார்த்து, அட்டைகளைத் திருப்பிப் பார்த்து, மீண்டும் தேர்வு எழுதவும்.`
          : `"${w.label}" is at ${w.avg}%. Watch its video lesson, revise the flashcards, then retake the test on it.`
      );
    } else if (w.kind === "type") {
      recs.push(
        isTa
          ? `${w.label} — ${w.avg}%. மாதிரி விடைகளைப் படித்து, இந்த வகை வினாக்களை மேலும் பயிற்சி செய்யவும்.`
          : `${w.label} is at ${w.avg}%. Read the model answers and practise more questions of this type.`
      );
    } else {
      recs.push(
        isTa
          ? `${w.label} — ${w.avg}%. இதில் மேலும் நேரம் செலவிடவும்; தேவைப்பட்டால் AI-யிடம் விளக்கம் கேட்கவும்.`
          : `${w.label} is at ${w.avg}%. Spend more time here, and ask the AI chat to explain anything unclear.`
      );
    }
  });

  const hard = levelScores.find((l) => l.key === "hard");
  const medium = levelScores.find((l) => l.key === "medium");
  if (medium && medium.avg >= 70 && !hard) {
    recs.push(isTa ? "நடுத்தர வினாக்களில் நன்றாக உள்ளீர்கள் — கடின வினாக்களை முயற்சிக்கவும்." : "Medium questions are going well — try the Hard level next.");
  } else if (hard && hard.avg < WEAK_BELOW && hard.count >= MIN_ATTEMPTS) {
    recs.push(isTa ? "கடின வினாக்களுக்கு முன் மாதிரி விடைகளைப் படிக்கவும்." : "Hard questions are difficult right now — read the model answers before trying again.");
  }

  if (!moduleCounts.flashcards) {
    recs.push(isTa ? "அட்டைகள் இன்னும் பயன்படுத்தப்படவில்லை — தினமும் 5 நிமிடம் திருப்பிப் பார்க்கவும்." : "Flashcards haven't been used yet — 5 minutes a day helps remember key points.");
  }
  if (!scores.length) {
    recs.push(isTa ? "உங்கள் நிலையை அறிய முதல் தேர்வை எழுதுங்கள்." : "Take a first test so strengths and weaknesses can be measured.");
  }
  if (daysSinceActive !== null && daysSinceActive >= 7) {
    recs.push(
      isTa
        ? `${daysSinceActive} நாட்களாக பயிற்சி இல்லை — சிறிது நேரம் தினமும் பயிற்சி செய்யவும்.`
        : `No practice for ${daysSinceActive} days — a little every day works better than a lot at once.`
    );
  }
  if (!recs.length) {
    recs.push(isTa ? "அருமை! இதே வேகத்தில் தொடருங்கள்." : "Great work — keep practising at this pace.");
  }
  return recs;
}

/**
 * The full report for one student.
 * @param events  that student's activityLog events (any order)
 * @param profile optional users/{uid} doc: { username, name, createdAt }
 */
export function buildStudentReport(events, profile = {}, isTa = false) {
  profile = profile || {};
  const scores = extractScores(events);
  const dates = events.map((e) => toDate(e.timestamp)).filter(Boolean).sort((a, b) => a - b);
  const activeDays = new Set(dates.map(dayKey));

  const moduleCounts = {};
  events.forEach((e) => {
    if (e.module && e.module !== "auth" && e.module !== "progress") {
      moduleCounts[e.module] = (moduleCounts[e.module] || 0) + 1;
    }
  });

  const logins = events.filter((e) => e.module === "auth" && (e.action === "login" || e.action === "signup"));
  const lastActive = dates[dates.length - 1] || null;
  const daysSinceActive = lastActive ? Math.floor((Date.now() - lastActive.getTime()) / 86400000) : null;

  // Topic = curriculum concept, across tests, video questions and analogies.
  const topicScores = groupAverage(scores, (s) => s.topic, (k) => topicName(k, isTa));
  const moduleScores = groupAverage(scores, (s) => s.module, (k) => moduleName(k, isTa));
  const levelOrder = ["easy", "medium", "hard"];
  const levelScores = groupAverage(
    scores.filter((s) => s.level),
    (s) => s.level,
    (k) => (LEVEL_NAMES[k] ? LEVEL_NAMES[k][isTa ? "ta" : "en"] : k)
  ).sort((a, b) => levelOrder.indexOf(a.key) - levelOrder.indexOf(b.key));
  const categoryScores = groupAverage(scores.filter((s) => s.module === "test"), (s) => s.category, (k) => k);

  // Strengths/weaknesses come from topics first; test types (MCQ, 2-mark…)
  // and modules are added so a student with few topic-tagged answers still
  // gets useful feedback.
  const areas = [
    ...topicScores.map((a) => ({ ...a, kind: "topic" })),
    ...categoryScores.map((a) => ({ ...a, kind: "type", label: `${isTa ? "தேர்வு வகை" : "Question type"}: ${a.label}` })),
    ...moduleScores.map((a) => ({ ...a, kind: "module" })),
  ].filter((a) => a.count >= MIN_ATTEMPTS);

  const strengths = areas.filter((a) => a.avg >= STRONG_AT).sort((a, b) => b.avg - a.avg);
  const weaknesses = areas.filter((a) => a.avg < WEAK_BELOW).sort((a, b) => a.avg - b.avg);
  const developing = areas.filter((a) => a.avg >= WEAK_BELOW && a.avg < STRONG_AT && a.kind === "topic");

  const overall = avg(scores.map((s) => s.score));

  return {
    profile: {
      username: profile.username || events.find((e) => e.username)?.username || "—",
      name: profile.name || "",
      joined: toDate(profile.createdAt) || dates[0] || null,
      lastActive,
    },
    overall,
    grade: gradeFor(overall, isTa),
    totals: {
      scoredAnswers: scores.length,
      tests: scores.filter((s) => s.module === "test").length,
      logins: logins.length,
      daysActive: activeDays.size,
      streak: currentStreak(activeDays),
      chatQuestions: events.filter((e) => e.module === "chat" && e.action === "question_asked").length,
      flashcards: events.filter((e) => e.module === "flashcards" && e.action === "card_reviewed").length,
    },
    moduleCounts,
    topicScores,
    moduleScores,
    levelScores,
    categoryScores,
    strengths,
    weaknesses,
    developing,
    trend: computeTrend(scores),
    history: scores.slice(-20).map((s, i) => ({
      n: i + 1,
      score: Math.round(s.score),
      label: s.when ? s.when.toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "",
    })),
    recentResults: [...scores].reverse().slice(0, 10),
    recommendations: buildRecommendations({ weaknesses, moduleCounts, levelScores, daysSinceActive, scores }, isTa),
  };
}
