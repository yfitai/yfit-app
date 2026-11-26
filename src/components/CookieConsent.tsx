import { useState, useEffect, useMemo } from "react";
import { getPublicAnalytics, COOKIE_KEY } from "../lib/publicAnalytics";
export { COOKIE_KEY };

/** Kept for import compatibility; tracking now requires a mounted public route and consent. */
export function initAnalyticsFromConsent() { /* No global/private-route script injection. */ }

export default function CookieConsent({ visitKey = "public-entry" }: { visitKey?: string }) {
  const [visible, setVisible] = useState(false);
  const [hasChoice, setHasChoice] = useState(false);
  // Not sent to analytics: distinguish real remount/back-navigation from StrictMode effects.
  const entry = useMemo(() => ({ visitKey }), [visitKey]);

  useEffect(() => {
    const analytics = getPublicAnalytics();
    if (!analytics) return;
    const release = analytics.beginPage(entry);
    const update = () => {
      const choice = analytics.consent();
      setHasChoice(choice === "accepted" || choice === "declined");
      if (choice === "accepted" || choice === "declined") setVisible(false);
    };
    update();
    const timer = setTimeout(() => {
      if (!analytics.consent()) setVisible(true);
    }, 1500);
    const unsubscribe = analytics.subscribe(update);
    const storageChanged = (event: StorageEvent) => {
      if (event.key === COOKIE_KEY || event.key === "yfit_analytics_excluded" || event.key === "umami.disabled" || event.key === null) analytics.syncConsent();
    };
    window.addEventListener("storage", storageChanged);
    return () => {
      clearTimeout(timer);
      unsubscribe();
      window.removeEventListener("storage", storageChanged);
      release();
    };
  }, [entry]);

  const choose = (value: "accepted" | "declined") => {
    getPublicAnalytics()?.setConsent(value);
    setHasChoice(true);
    setVisible(false);
  };

  if (!visible) return hasChoice ? (
    <button type="button" onClick={() => setVisible(true)}
      className="fixed bottom-2 left-2 z-50 rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 shadow-sm"
      aria-label="Change analytics privacy choice">Analytics privacy</button>
  ) : null;

  return (
    <div role="dialog" aria-label="Analytics consent" className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6" style={{ animation: "slideUp 0.3s ease-out" }}>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-200 leading-relaxed">
            Allow anonymous analytics on our public pages to help us understand Go visits and improve the website? You can decline and still use all public features. Change your choice using Analytics privacy.{" "}
            <a href="/legal" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors">Privacy Policy</a>
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0 w-full sm:w-auto">
          <button type="button" onClick={() => choose("declined")} className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 border border-gray-600 hover:border-gray-400 rounded-lg transition-colors">Decline</button>
          <button type="button" onClick={() => choose("accepted")} className="flex-1 sm:flex-none px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all" style={{ background: "linear-gradient(135deg, #3b82f6 0%, #10b981 100%)" }}>Accept</button>
        </div>
      </div>
    </div>
  );
}
