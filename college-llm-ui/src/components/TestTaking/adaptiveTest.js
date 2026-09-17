// Adaptive physics test — the rules that pick the next question.
//
// Each topic is a small "track" answered at one mark category (2 or 5 marks):
//
//   Medium ──≥70%──▶ Hard ──▶ topic done
//     │
//     └──<70%──▶ Easy (once) ──▶ Medium again ──≥70%──▶ Hard ──▶ topic done
//                                      │
//                                      └──<70%──▶ topic done ("needs practice")
//
// A score of 70% or more counts as answered correctly. The retry of the medium
// question happens once, so a student can never get stuck looping on a topic.

export const PASS_MARK = 70;

export const ADAPTIVE_TOPICS = [
  { id: "newtons-second-law", icon: "🚀", en: "Newton's Second Law", ta: "நியூட்டனின் இரண்டாம் விதி" },
  { id: "gravitation", icon: "🪐", en: "Universal Law of Gravitation", ta: "பொது ஈர்ப்பியல் விதி" },
  { id: "mass-vs-weight", icon: "⚖️", en: "Mass vs. Weight", ta: "நிறை மற்றும் எடை" },
  { id: "torque", icon: "🔧", en: "Torque / Moment of Force", ta: "திருப்பு விசை" },
  { id: "principle-of-moments", icon: "🎢", en: "Principle of Moments", ta: "திருப்புத்திறன் தத்துவம்" },
  { id: "conservation-of-momentum", icon: "🎱", en: "Conservation of Momentum", ta: "உந்த அழிவின்மை விதி" },
  { id: "impulse", icon: "🏏", en: "Impulse", ta: "கணத்தாக்கு" },
];

export const topicById = (id) => ADAPTIVE_TOPICS.find((t) => t.id === id);

// A step is where the student is inside a topic; "medium-retry" is the second
// go at the medium question after the easy one.
export const START_STEP = "medium";

export const levelOfStep = (step) => (step === "medium-retry" ? "medium" : step);

export const isPass = (accuracy) => typeof accuracy === "number" && accuracy >= PASS_MARK;

/**
 * Decide what comes after answering `step` with `accuracy` (0-100).
 * Returns { next, outcome }: `next` is the following step in this topic, or
 * null when the topic is finished — then `outcome` says how it ended.
 */
export function nextStep(step, accuracy) {
  const passed = isPass(accuracy);
  switch (step) {
    case "medium":
      return passed ? { next: "hard", outcome: null } : { next: "easy", outcome: null };
    case "easy":
      return { next: "medium-retry", outcome: null };
    case "medium-retry":
      return passed ? { next: "hard", outcome: null } : { next: null, outcome: "needs-practice" };
    case "hard":
      return { next: null, outcome: passed ? "mastered" : "reached-hard" };
    default:
      return { next: null, outcome: "needs-practice" };
  }
}

/** Find the bank question for one topic + mark category + level in the loaded language. */
export const findAdaptiveQuestion = (pool, topic, category, step) =>
  pool.find((q) => q.topic === topic && q.category === category && q.level === levelOfStep(step)) || null;

/** A fresh session over the chosen topics. */
export const createSession = (topicIds, category) => ({
  category,
  topics: topicIds,
  topicIndex: 0,
  step: START_STEP,
  attempts: [], // { topic, step, level, accuracy, passed }
  outcomes: {}, // topicId -> "mastered" | "reached-hard" | "needs-practice"
  finished: false,
});

/** Record an evaluated answer and move the session on. Pure: returns a new session. */
export function advanceSession(session, accuracy) {
  const topic = session.topics[session.topicIndex];
  const { next, outcome } = nextStep(session.step, accuracy);
  const attempts = [
    ...session.attempts,
    { topic, step: session.step, level: levelOfStep(session.step), accuracy, passed: isPass(accuracy) },
  ];

  if (next) return { ...session, attempts, step: next };

  const outcomes = { ...session.outcomes, [topic]: outcome };
  const topicIndex = session.topicIndex + 1;
  if (topicIndex >= session.topics.length) {
    return { ...session, attempts, outcomes, finished: true };
  }
  return { ...session, attempts, outcomes, topicIndex, step: START_STEP };
}
