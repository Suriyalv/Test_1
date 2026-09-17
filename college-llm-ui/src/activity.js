import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase";

/**
 * Shared event logger for every module. Writes to the "activityLog" Firestore
 * collection, read back by the Admin Activity Dashboard (all users) and My
 * Progress (the signed-in user's own events only, via a uid filter).
 *
 * Fire-and-forget by design — a logging failure must never break the feature
 * that triggered it, so errors are swallowed after a console warning.
 */
export async function logActivity(module, action, meta = {}) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await addDoc(collection(db, "activityLog"), {
      uid: user.uid,
      username: user.email ? user.email.split("@")[0] : "",
      module,
      action,
      meta,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.error("[activity] log failed:", e);
  }
}
