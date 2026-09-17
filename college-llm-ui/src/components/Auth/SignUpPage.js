import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, usernameToEmail } from "../../firebase";
import { Sparkles, User, IdCard, Lock, UserPlus, Loader2 } from "lucide-react";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

/**
 * Self-service sign-up. Same username-only identity as LoginPage — the typed
 * username becomes "<username>@<STUDENT_EMAIL_DOMAIN>" for Firebase Auth, and
 * "name" is stored in Firestore purely for display; it plays no part in
 * signing in (a user still logs in with their username, never their name).
 */
const SignUpPage = ({ language = "en", onSwitchToLogin }) => {
  const isTa = language === "ta";
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedUsername = username.trim().toLowerCase();

    if (!USERNAME_PATTERN.test(trimmedUsername)) {
      setError(
        isTa
          ? "பயனர்பெயர் 3-20 எழுத்துகள் (a-z, 0-9, _) மட்டுமே கொண்டிருக்க வேண்டும்."
          : "Username: use 3 to 20 letters or numbers. You can also use _"
      );
      return;
    }
    if (password.length < 6) {
      setError(isTa ? "கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்." : "Password needs 6 or more characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError(isTa ? "கடவுச்சொற்கள் பொருந்தவில்லை." : "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        usernameToEmail(trimmedUsername),
        password
      );

      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }

      // Reference-only profile doc — never consulted for login itself.
      await setDoc(doc(db, "users", cred.user.uid), {
        username: trimmedUsername,
        name: name.trim(),
        createdAt: serverTimestamp(),
      });
      // onAuthStateChanged in App.js picks up the new session from here.
    } catch (err) {
      console.error("Sign up failed:", err.code);
      if (err.code === "auth/email-already-in-use") {
        setError(isTa ? "இந்தப் பயனர்பெயர் ஏற்கனவே பயன்பாட்டில் உள்ளது." : "This username is already used. Try another one.");
      } else {
        setError(isTa ? "பதிவு செய்ய முடியவில்லை. மீண்டும் முயற்சிக்கவும்." : "We could not make your account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f9ff] px-4 font-sans">
      <div className="tngov-tricolor-strip fixed left-0 right-0 top-0 z-50" />

      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-7 shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-cyan-500 text-white shadow-pop">
          <Sparkles size={26} />
        </div>

        <h1 className="text-center text-lg font-extrabold tracking-tight text-slate-900 font-display sm:text-xl">
          {isTa ? "கணக்கு உருவாக்கு" : "Create Account"}
        </h1>
        <p className="mt-1 text-center text-xs text-slate-500 sm:text-sm">
          {isTa
            ? "உங்கள் சொந்த பயனர்பெயர் மற்றும் கடவுச்சொல்லை அமைக்கவும்."
            : "Choose a username and a password to start."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
          <div className="relative">
            <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isTa ? "பயனர்பெயர் (எ.கா. user1)" : "Username (e.g. user1)"}
              className="w-full rounded-xl border-2 border-brand-200 bg-brand-50/60 py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <div className="relative">
            <IdCard size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isTa ? "உங்கள் பெயர் (விருப்பம்)" : "Your name (optional)"}
              className="w-full rounded-xl border-2 border-brand-200 bg-brand-50/60 py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isTa ? "கடவுச்சொல்" : "Password"}
              className="w-full rounded-xl border-2 border-brand-200 bg-brand-50/60 py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={isTa ? "கடவுச்சொல்லை உறுதிப்படுத்தவும்" : "Confirm password"}
              className="w-full rounded-xl border-2 border-brand-200 bg-brand-50/60 py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-200"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 py-2.5 text-sm font-bold text-white shadow-pop transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            {isTa ? "பதிவு செய்" : "Sign Up"}
          </button>
        </form>

        {onSwitchToLogin && (
          <p className="mt-5 text-center text-xs text-slate-500">
            {isTa ? "ஏற்கனவே கணக்கு உள்ளதா?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-bold text-brand-600 hover:underline"
            >
              {isTa ? "உள்நுழை" : "Log in"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default SignUpPage;
