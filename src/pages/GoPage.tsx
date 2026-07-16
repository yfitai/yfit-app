/**
 * GoPage.tsx
 * Social media link-in-bio landing page for YFIT AI.
 * Optimised for cold social traffic — no nav, no pricing table, no distractions.
 * Problem-first structure: Hook → Agitate → Proof → CTA
 * UTM parameters are preserved from the incoming URL so Umami can attribute signups.
 */

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const SIGNUP_URL = "https://app.yfitai.com/signup";

// Preserve UTM params when redirecting to signup
function buildSignupUrl(): string {
  if (typeof window === "undefined") return SIGNUP_URL;
  const params = new URLSearchParams(window.location.search);
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const out = new URLSearchParams();
  utmKeys.forEach(k => { if (params.has(k)) out.set(k, params.get(k)!); });
  const qs = out.toString();
  return qs ? `${SIGNUP_URL}?${qs}` : SIGNUP_URL;
}

export default function GoPage() {
  const { t } = useTranslation();

  // Fire a custom Umami event so we can see social traffic in the dashboard
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).umami) {
      const params = new URLSearchParams(window.location.search);
      (window as any).umami.track("go_page_view", {
        source: params.get("utm_source") || "direct",
        campaign: params.get("utm_campaign") || "none",
      });
    }
  }, []);

  const signupUrl = buildSignupUrl();

  const handleCTA = () => {
    if (typeof window !== "undefined" && (window as any).umami) {
      const params = new URLSearchParams(window.location.search);
      (window as any).umami.track("go_page_cta_click", {
        source: params.get("utm_source") || "direct",
      });
    }
    window.location.href = signupUrl;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal header — logo + language switcher only */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <img
          src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663099417101/YPVUcoNPoLMtiepj.png"
          alt="YFIT AI"
          className="h-9 w-auto"
        />
        <LanguageSwitcher compact={false} />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-2xl mx-auto w-full">

        {/* ── HOOK: The Problem ── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-sm font-semibold mb-6">
            <span>⚠️</span> {t("go.problemBadge", "Most fitness apps are ignoring something critical")}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
            {t("go.headline", "Your fitness app doesn't know about")}{" "}
            <span className="text-red-600">{t("go.headlineHighlight", "your medications.")}</span>
          </h1>

          <p className="text-lg text-gray-600 leading-relaxed">
            {t("go.subtext", "66% of adults take at least one prescription medication. Metformin, beta-blockers, SSRIs, statins — all of them affect how your body responds to exercise and nutrition. Every other fitness app ignores this entirely.")}
          </p>
        </div>

        {/* ── AGITATE: Why it matters ── */}
        <div className="w-full bg-gray-50 rounded-2xl border border-gray-200 p-6 mb-8">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {t("go.agitateTitle", "What happens when your app doesn't know")}
          </p>
          <div className="space-y-3">
            {[
              { icon: "❌", text: t("go.agitate1", "Metformin + intense cardio = dangerous blood sugar drops — your app says nothing") },
              { icon: "❌", text: t("go.agitate2", "Beta-blockers lower your max heart rate — your app still tells you to hit 160 bpm") },
              { icon: "❌", text: t("go.agitate3", "SSRIs affect sleep and recovery — your app gives you the same plan as everyone else") },
              { icon: "❌", text: t("go.agitate4", "Your doctor doesn't know what your workouts look like — because there's no report") },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0 mt-0.5">{item.icon}</span>
                <p className="text-gray-700 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SOLUTION: What YFIT does ── */}
        <div className="w-full mb-8">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 text-center">
            {t("go.solutionTitle", "YFIT is the only fitness app built differently")}
          </p>
          <div className="space-y-3">
            {[
              { icon: "✅", color: "text-green-600", text: t("go.solution1", "Flags workout interactions with your specific medications") },
              { icon: "✅", color: "text-green-600", text: t("go.solution2", "Adjusts your calorie and macro targets based on your prescriptions") },
              { icon: "✅", color: "text-green-600", text: t("go.solution3", "Generates a printable report your doctor can actually use") },
              { icon: "✅", color: "text-green-600", text: t("go.solution4", "AI Coach knows your meds — so its advice is always safe for you") },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                <span className={`text-lg flex-shrink-0 mt-0.5 ${item.color}`}>{item.icon}</span>
                <p className="text-gray-800 text-sm font-medium leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── PROOF: App screenshots strip ── */}
        <div className="w-full mb-8">
          <p className="text-xs text-gray-400 text-center mb-3 uppercase tracking-wider">
            {t("go.proofTitle", "See it in action")}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t("go.screen1", "Medication Tracker"), color: "bg-pink-600", emoji: "💊" },
              { label: t("go.screen2", "AI Form Coach"), color: "bg-purple-600", emoji: "🧠" },
              { label: t("go.screen3", "Provider Report"), color: "bg-teal-600", emoji: "📋" },
            ].map((s, i) => (
              <div key={i} className={`${s.color} rounded-xl p-4 text-white text-center`}>
                <div className="text-3xl mb-2">{s.emoji}</div>
                <p className="text-xs font-semibold leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="w-full text-center">
          <button
            onClick={handleCTA}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-teal-600 text-white text-lg font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all"
          >
            {t("go.cta", "Try YFIT Free — No Credit Card")}
            <span>→</span>
          </button>
          <p className="text-xs text-gray-400 mt-3">
            {t("go.ctaNote", "Free plan available · Cancel anytime · Available in 8 languages")}
          </p>
        </div>

        {/* ── Social proof strip ── */}
        <div className="w-full mt-10 pt-8 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { stat: "8", label: t("go.stat1", "Languages") },
              { stat: "11", label: t("go.stat2", "App features") },
              { stat: "Free", label: t("go.stat3", "To start") },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-2xl font-bold text-gray-900">{s.stat}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Minimal footer */}
      <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-100">
        <a href="https://yfitai.com" className="hover:text-gray-600 transition-colors">yfitai.com</a>
        {" · "}
        <a href="https://yfitai.com/legal" className="hover:text-gray-600 transition-colors">{t("go.privacy", "Privacy")}</a>
        {" · "}
        <a href="mailto:support@yfitai.com" className="hover:text-gray-600 transition-colors">support@yfitai.com</a>
      </footer>
    </div>
  );
}
