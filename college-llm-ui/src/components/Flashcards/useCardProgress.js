import { useCallback, useEffect, useState } from "react";
import { collection, doc, getDocs, setDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { gradeCard } from "./spacedRepetition";

/**
 * Loads every "users/{uid}/cardProgress/{cardId}" doc for the signed-in
 * student once, keeps it in memory as a map, and writes updates back to
 * Firestore as the student rates cards — so the review schedule follows the
 * student across devices/sessions instead of living in localStorage.
 */
export function useCardProgress() {
  const [progressById, setProgressById] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getDocs(collection(db, "users", user.uid, "cardProgress"))
      .then((snap) => {
        if (cancelled) return;
        const map = {};
        snap.forEach((d) => {
          const data = d.data();
          map[d.id] = {
            ...data,
            dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : data.dueDate,
          };
        });
        setProgressById(map);
      })
      .catch((e) => console.error("[flashcards] failed to load progress:", e))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rateCard = useCallback(async (card, rating) => {
    const user = auth.currentUser;
    const current = progressById[card.id];
    const next = gradeCard(current, rating);

    // Reflect it locally right away so the UI doesn't wait on the write.
    setProgressById((prev) => ({ ...prev, [card.id]: next }));

    if (!user) return next;
    try {
      await setDoc(
        doc(db, "users", user.uid, "cardProgress", card.id),
        {
          cardId: card.id,
          deck: card.deck || "",
          easeFactor: next.easeFactor,
          interval: next.interval,
          repetitions: next.repetitions,
          consecutiveAgainCount: next.consecutiveAgainCount,
          dueDate: Timestamp.fromDate(next.dueDate),
          lastReviewed: Timestamp.fromDate(next.lastReviewed),
          lastRating: next.lastRating,
        },
        { merge: true }
      );
    } catch (e) {
      console.error("[flashcards] failed to save progress:", e);
    }
    return next;
  }, [progressById]);

  return { progressById, loading, rateCard };
}
