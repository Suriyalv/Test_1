import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

/**
 * Lets the mascot live as a single instance mounted once in App.js (so it
 * floats on every page) while still picking up "there's an active question"
 * context from deep inside the Test, Video Passage and Live Quiz views —
 * without threading that question through every route/component in between.
 *
 * While a question is published, Ark is in clue-only mode. `options` and
 * `answer` are forwarded to the hint API so the server can refuse any reply
 * that gives the answer away; they are never shown to the student by Ark.
 */
const MascotContext = createContext(null);

const EMPTY_QUESTION = { question: "", category: "", options: [], answer: "" };

export const MascotProvider = ({ children }) => {
  const [testQuestion, setTestQuestion] = useState(EMPTY_QUESTION);

  const setCurrentTestQuestion = useCallback((question, category = "", options = [], answer = "") => {
    setTestQuestion({
      question: question || "",
      category: category || "",
      options: Array.isArray(options) ? options : [],
      answer: answer || "",
    });
  }, []);

  const clearCurrentTestQuestion = useCallback(() => {
    setTestQuestion(EMPTY_QUESTION);
  }, []);

  const value = useMemo(
    () => ({ testQuestion, setCurrentTestQuestion, clearCurrentTestQuestion }),
    [testQuestion, setCurrentTestQuestion, clearCurrentTestQuestion]
  );

  return <MascotContext.Provider value={value}>{children}</MascotContext.Provider>;
};

/** Used by the one global FloatingMascotBot instance to read the active question. */
export const useMascotTestQuestion = () => {
  const ctx = useContext(MascotContext);
  return ctx ? ctx.testQuestion : EMPTY_QUESTION;
};

/**
 * Used by any view with a "current question in front of the student" to
 * publish it — and to clear it automatically when that view unmounts, so the
 * mascot doesn't keep referencing a stale question once the student moves on.
 */
export const useSetMascotTestQuestion = (question, category, options = [], answer = "") => {
  const ctx = useContext(MascotContext);
  // Arrays are new on every render; compare by content so this doesn't re-fire.
  const optionsKey = JSON.stringify(Array.isArray(options) ? options : []);
  React.useEffect(() => {
    if (!ctx) return undefined;
    if (question && question.trim()) {
      ctx.setCurrentTestQuestion(question, category, JSON.parse(optionsKey), answer);
    } else {
      ctx.clearCurrentTestQuestion();
    }
    return () => ctx.clearCurrentTestQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, category, optionsKey, answer]);
};
