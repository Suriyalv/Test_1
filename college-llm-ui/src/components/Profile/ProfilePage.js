import React, { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import StudentReport from "./StudentReport";
import { ArrowLeft, RefreshCw, Printer, UserCircle, ShieldCheck } from "lucide-react";

/**
 * Profile + performance report page.
 *  - Student: omit `events`/`profile` and it loads the signed-in user's own
 *    activityLog (uid filter — allowed by the Firestore rules).
 *  - Admin: pass `events` and `profile` for any student (already loaded by
 *    Student Records), plus `adminView` for the header label.
 */
const ProfilePage = ({ onBack, language = "en", events: givenEvents, profile: givenProfile, adminView = false }) => {
  const isTa = language === "ta";
  const [events, setEvents] = useState(givenEvents || []);
  const [profile, setProfile] = useState(givenProfile || null);
  const [loading, setLoading] = useState(!givenEvents);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (givenEvents) return;
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      // uid filter only (no orderBy) so no composite index is needed.
      const [snap, profileSnap] = await Promise.all([
        getDocs(query(collection(db, "activityLog"), where("uid", "==", user.uid))),
        getDoc(doc(db, "users", user.uid)).catch(() => null),
      ]);
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setProfile(profileSnap?.exists() ? profileSnap.data() : { username: user.email?.split("@")[0], name: user.displayName || "" });
    } catch (err) {
      console.error("Failed to load profile:", err);
      setError(isTa ? "சுயவிவரத்தை ஏற்ற முடியவில்லை." : "Could not load the profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [givenEvents, isTa]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (givenEvents) setEvents(givenEvents);
    if (givenProfile) setProfile(givenProfile);
  }, [givenEvents, givenProfile]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16 font-sans text-slate-900 print:bg-white print:pb-0">
      <div className="tngov-tricolor-strip fixed left-0 right-0 top-0 z-50 print:hidden"></div>

      <header className="sticky top-[3px] z-40 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 shadow-xs print:static print:border-0 print:shadow-none">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200 active:scale-95 print:hidden"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">
                {adminView ? (isTa ? "பதிவுகள்" : "Records") : isTa ? "முகப்பு" : "Home"}
              </span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {adminView ? <ShieldCheck size={12} /> : <UserCircle size={12} />}
              {adminView ? (isTa ? "மாணவர் அறிக்கை" : "Student report") : isTa ? "உங்கள் சுயவிவரம்" : "Your profile"}
            </div>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
              {isTa ? "செயல்திறன் அறிக்கை" : "Performance Report"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">{isTa ? "அச்சிடு / PDF" : "Print / PDF"}</span>
          </button>
          {!givenEvents && (
            <button
              type="button"
              onClick={load}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{isTa ? "புதுப்பிக்க" : "Refresh"}</span>
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-6 print:max-w-none print:px-0 print:pt-2">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>
        ) : loading ? (
          <p className="py-16 text-center text-xs text-slate-400">{isTa ? "ஏற்றுகிறது..." : "Loading report..."}</p>
        ) : (
          <StudentReport events={events} profile={profile} language={language} />
        )}
      </main>
    </div>
  );
};

export default ProfilePage;
