/**
 * Pure functions over a flat array of activityLog events (already fetched —
 * these never touch Firestore themselves). Kept separate from MyProgress.js
 * so the aggregation logic is easy to reason about independent of React.
 */

const toDate = (ts) => {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  return new Date(ts);
};

/** Sorted newest-first — sorting client-side avoids needing a Firestore
 * composite index on (uid == , orderBy timestamp). */
export function sortByTimestampDesc(events) {
  return [...events].sort((a, b) => {
    const da = toDate(a.timestamp)?.getTime() || 0;
    const db = toDate(b.timestamp)?.getTime() || 0;
    return db - da;
  });
}

/** Average test accuracy per category, from module:"test" events. */
export function computeCategoryAccuracy(events) {
  const buckets = {};
  events
    .filter((e) => e.module === "test" && typeof e.meta?.accuracy === "number")
    .forEach((e) => {
      const cat = e.meta.category || "General";
      if (!buckets[cat]) buckets[cat] = { sum: 0, count: 0 };
      buckets[cat].sum += e.meta.accuracy;
      buckets[cat].count += 1;
    });
  return Object.entries(buckets).map(([category, { sum, count }]) => ({
    label: category,
    value: Math.round(sum / count),
    count,
  }));
}

/** Threshold-only strengths/weaknesses — no ML, matches the "start simple
 * with rolling accuracy" guidance for a first version of this. */
export function computeStrengthsWeaknesses(categoryAccuracy) {
  const strengths = categoryAccuracy.filter((c) => c.value >= 75);
  const weaknesses = categoryAccuracy.filter((c) => c.value < 50);
  return { strengths, weaknesses };
}

export function computeOverview(events) {
  const testAttempts = events.filter((e) => e.module === "test");
  const flashcardReviews = events.filter((e) => e.module === "flashcards");
  const videoAnswers = events.filter((e) => e.module === "video");
  const analogies = events.filter((e) => e.module === "concept-bridge");

  const avgAccuracy = testAttempts.length
    ? Math.round(
        testAttempts.reduce((sum, e) => sum + (e.meta?.accuracy || 0), 0) / testAttempts.length
      )
    : null;

  return {
    testsTaken: testAttempts.length,
    avgAccuracy,
    flashcardsReviewed: flashcardReviews.length,
    videoQuestionsAnswered: videoAnswers.length,
    analogiesSubmitted: analogies.length,
  };
}

export function buildTimeline(events, limitN = 15) {
  return sortByTimestampDesc(events).slice(0, limitN);
}
