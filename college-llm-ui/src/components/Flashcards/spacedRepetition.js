/**
 * SM-2 spaced-repetition scheduler (the same family Anki uses), driven by
 * four recall-quality buttons instead of the algorithm's original 0-5 scale.
 * Pure functions only — no React, no Firestore — so the schedule math can be
 * reasoned about (and tested) independently of where the state lives.
 */

export const QUALITY = { again: 0, hard: 3, good: 4, easy: 5 };

export const DEFAULT_PROGRESS = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  consecutiveAgainCount: 0,
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Grades a card given its current progress and a rating ("again" | "hard" |
 * "good" | "easy"), returning the next progress state (does not mutate the
 * input). `now` is injectable for testing; defaults to the real clock.
 */
export function gradeCard(progress, rating, now = new Date()) {
  const q = QUALITY[rating];
  if (q === undefined) throw new Error(`Unknown rating: ${rating}`);

  const prev = { ...DEFAULT_PROGRESS, ...progress };
  const today = startOfDay(now);

  let easeFactor = prev.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  easeFactor = Math.max(1.3, easeFactor);

  let repetitions = prev.repetitions;
  let interval;

  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(prev.interval * easeFactor);
  }

  const consecutiveAgainCount = rating === "again" ? prev.consecutiveAgainCount + 1 : 0;

  return {
    easeFactor,
    interval,
    repetitions,
    consecutiveAgainCount,
    dueDate: addDays(today, interval),
    lastReviewed: now,
    lastRating: rating,
  };
}

/** A card with no progress doc yet, or whose dueDate has arrived, is due. */
export function isDue(progress, now = new Date()) {
  if (!progress || !progress.dueDate) return true;
  const due = progress.dueDate instanceof Date ? progress.dueDate : progress.dueDate.toDate();
  return startOfDay(due).getTime() <= startOfDay(now).getTime();
}

/** Two "Again" ratings in a row on the same card triggers chunked review. */
export function isOverloaded(progress) {
  return (progress?.consecutiveAgainCount || 0) >= 2;
}
