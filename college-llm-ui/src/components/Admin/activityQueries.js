import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

/**
 * Single-field order + limit only — auto-indexed by Firestore, no manual
 * composite index needed. All per-module/per-user breakdowns are computed
 * client-side from this one fetch rather than issuing separate filtered
 * queries, which is plenty at the scale of a 60-student class.
 */
export async function fetchRecentActivity(limitN = 500) {
  const snap = await getDocs(
    query(collection(db, "activityLog"), orderBy("timestamp", "desc"), limit(limitN))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function countByModule(events) {
  const counts = {};
  events.forEach((e) => {
    counts[e.module] = (counts[e.module] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function countByUser(events) {
  const byUser = {};
  events.forEach((e) => {
    const key = e.uid || "unknown";
    if (!byUser[key]) {
      byUser[key] = { uid: key, username: e.username || "—", count: 0, lastActive: null };
    }
    byUser[key].count += 1;
    const ts = e.timestamp?.toDate ? e.timestamp.toDate() : e.timestamp ? new Date(e.timestamp) : null;
    if (ts && (!byUser[key].lastActive || ts > byUser[key].lastActive)) {
      byUser[key].lastActive = ts;
    }
  });
  return Object.values(byUser).sort((a, b) => b.count - a.count);
}
