import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const STORAGE_KEY = "once.cookie_accepted";

export default function CookieBanner() {
  const location = useLocation();
  const [accepted, setAccepted] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });

  // Re-read once on mount so SSR-friendly renders pick up the value.
  useEffect(() => {
    setAccepted(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  // Spec: only render on /login and /register.
  const onAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  if (accepted || !onAuthPage) return null;

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setAccepted(true);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
      <p className="text-text-secondary text-sm flex-1 min-w-[260px]">
        We use essential cookies to keep you signed in. No tracking or
        advertising cookies.
      </p>
      <div className="flex items-center gap-4">
        <Link
          to="/privacy"
          className="text-amber text-sm hover:opacity-80 transition-opacity"
        >
          Privacy Policy
        </Link>
        <button
          type="button"
          onClick={accept}
          className="bg-amber hover:bg-amber-pressed text-black rounded-lg px-4 h-9 text-sm font-semibold transition-colors"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
