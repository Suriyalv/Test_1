import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, usernameToEmail } from "../../firebase";
import { logActivity } from "../../activity";
import { Sparkles, User, Lock, LogIn, Loader2 } from "lucide-react";

/**
 * Username-only login screen. Firebase Auth itself only understands email +
 * password, so the username the student types is silently mapped to
 * "<username>@<STUDENT_EMAIL_DOMAIN>" (see firebase.js) before signing in —
 * students never see or type an email address.
 */
const LoginPage = ({ language = "en", onSwitchToSignup }) => {
  const isTa = language === "ta";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError(isTa ? "பயனர்பெயர் மற்றும் கடவுச்சொல் தேவை." : "Please type your username and password.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, usernameToEmail(username), password);
      logActivity("auth", "login");
      // onAuthStateChanged in App.js picks up the signed-in user from here.
    } catch (err) {
      console.error("Login failed:", err.code);
      setError(
        isTa
          ? "பயனர்பெயர் அல்லது கடவுச்சொல் தவறு. மீண்டும் முயற்சிக்கவும்."
          : "Wrong username or password. Please try again."
      );
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
          {isTa ? "உள்நுழைவு" : "Student Login"}
        </h1>
        <p className="mt-1 text-center text-xs text-slate-500 sm:text-sm">
          {isTa
            ? "தொடர உங்கள் பயனர்பெயர் மற்றும் கடவுச்சொல்லை உள்ளிடவும்."
            : "Use the username and password from your teacher."}
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
            <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isTa ? "கடவுச்சொல்" : "Password"}
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
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogIn size={16} />
            )}
            {isTa ? "உள்நுழை" : "Log In"}
          </button>
        </form>

        {onSwitchToSignup && (
          <p className="mt-5 text-center text-xs text-slate-500">
            {isTa ? "கணக்கு இல்லையா?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="font-bold text-brand-600 hover:underline"
            >
              {isTa ? "பதிவு செய்யவும்" : "Sign up"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
