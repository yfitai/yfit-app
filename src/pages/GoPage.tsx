/**
 * GoPage.tsx — v2
 * Social media link-in-bio landing page for YFIT AI.
 * Redesigned as a full-feature showcase: one page that touches every feature
 * before directing visitors to sign up or the full marketing site.
 *
 * Flow: Social post → /go → see all features → CTA (free trial / full site)
 * UTM parameters are preserved from the incoming URL so Umami can attribute signups.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const SIGNUP_URL = "https://app.yfitai.com/signup";
const MARKETING_URL = "https://yfitai.com";

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

function track(event: string, extra?: Record<string, string>) {
  if (typeof window !== "undefined" && (window as any).umami) {
    const params = new URLSearchParams(window.location.search);
    (window as any).umami.track(event, {
      source: params.get("utm_source") || "direct",
      campaign: params.get("utm_campaign") || "none",
      ...extra,
    });
  }
}

// ─── Feature data ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    emoji: "💊",
    color: "from-pink-500 to-rose-600",
    bg: "bg-pink-50",
    border: "border-pink-200",
    badge: "UNIQUE TO YFIT",
    badgeColor: "bg-pink-100 text-pink-700",
    title: "Medication & Supplement Tracking",
    description:
      "Log every prescription and supplement. YFIT flags dangerous workout interactions, adjusts your calorie targets based on your meds, and generates a printable PDF report your doctor can actually use.",
    bullets: [
      "Drug–exercise interaction warnings",
      "Macro targets adjusted for your prescriptions",
      "Provider-ready PDF health report",
      "Supplement & vitamin tracker",
    ],
  },
  {
    emoji: "🎯",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    badge: "UNIQUE TO YFIT",
    badgeColor: "bg-violet-100 text-violet-700",
    title: "AI Real-Time Form Analysis",
    description:
      "Your phone's camera becomes a personal trainer. YFIT watches your reps, scores your form out of 100, and gives live audio corrections — no wearable required.",
    bullets: [
      "Live pose detection via camera",
      "Rep counting & form score (0–100)",
      "Audio cues for instant corrections",
      "Session history with progress charts",
    ],
  },
  {
    emoji: "🧠",
    color: "from-blue-500 to-cyan-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "AI POWERED",
    badgeColor: "bg-blue-100 text-blue-700",
    title: "AI Coaching & Chat",
    description:
      "Ask anything — your AI coach knows your workouts, nutrition, medications, and goals. It gives personalised advice that's always safe for your specific health profile.",
    bullets: [
      "Knows your full health profile",
      "Workout & nutrition advice",
      "Medication-aware recommendations",
      "Available 24/7 in 8 languages",
    ],
  },
  {
    emoji: "📊",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badge: "AI POWERED",
    badgeColor: "bg-emerald-100 text-emerald-700",
    title: "AI Predictions & Analytics",
    description:
      "See the future of your fitness journey. YFIT predicts your weight, strength milestones, and goal achievement dates using your real data — not generic charts.",
    bullets: [
      "Weight trajectory forecast",
      "Strength milestone predictions",
      "Goal achievement date estimates",
      "Injury risk & deload alerts",
    ],
  },
  {
    emoji: "🥗",
    color: "from-lime-500 to-green-600",
    bg: "bg-lime-50",
    border: "border-lime-200",
    badge: "SMART SCANNER",
    badgeColor: "bg-lime-100 text-lime-700",
    title: "Nutrition Tracking & Barcode Scanner",
    description:
      "Scan any barcode to instantly log macros. Your daily calorie target is calculated from your personal TDEE — not a one-size-fits-all number.",
    bullets: [
      "Barcode scanner for instant logging",
      "TDEE-based personalised calorie target",
      "Macro & micronutrient breakdown",
      "Meal templates & meal planner",
    ],
  },
  {
    emoji: "🏋️",
    color: "from-orange-500 to-amber-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    badge: "PERSONALISED",
    badgeColor: "bg-orange-100 text-orange-700",
    title: "Workout Tracking & Fitness Plans",
    description:
      "Log every set and rep. Choose from push/pull/legs or upper/lower splits, track progressive overload, and get a rest timer between sets.",
    bullets: [
      "Push / pull / legs & upper / lower splits",
      "Progressive overload tracking",
      "Rest timer between sets",
      "Exercise library with diagrams",
    ],
  },
  {
    emoji: "🎯",
    color: "from-teal-500 to-cyan-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    badge: "SCIENCE-BASED",
    badgeColor: "bg-teal-100 text-teal-700",
    title: "Goal Setting & Body Analysis",
    description:
      "Enter your measurements and YFIT calculates your BMI, body fat %, and TDEE using the Katch-McArdle formula — the same method used by DEXA scans.",
    bullets: [
      "BMI & body fat % calculation",
      "Katch-McArdle TDEE formula",
      "Goal-adjusted calorie targets",
      "Body type education & guidance",
    ],
  },
  {
    emoji: "📅",
    color: "from-indigo-500 to-blue-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    badge: "DAILY HABIT",
    badgeColor: "bg-indigo-100 text-indigo-700",
    title: "Daily Trackers",
    description:
      "Build healthy habits with daily water intake, sleep, mood, energy, and step tracking — all in one place, with weekly summaries and streak tracking.",
    bullets: [
      "Water intake tracker",
      "Sleep & recovery logging",
      "Mood & energy check-ins",
      "Habit streaks & weekly summaries",
    ],
  },
  {
    emoji: "📈",
    color: "from-rose-500 to-pink-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    badge: "VISUAL",
    badgeColor: "bg-rose-100 text-rose-700",
    title: "Progress Tracking & Photos",
    description:
      "See your transformation with before/after photos, body measurement charts, and weekly progress summaries. Every metric in one timeline.",
    bullets: [
      "Progress photos with comparison view",
      "Body measurement charts",
      "Weekly & monthly summaries",
      "Strength & volume trend charts",
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-2xl border ${feature.border} ${feature.bg} p-5 transition-all duration-200 cursor-pointer select-none`}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl flex-shrink-0 shadow-sm`}>
          {feature.emoji}
        </div>

        <div className="flex-1 min-w-0">
          {/* Badge */}
          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${feature.badgeColor} mb-1.5 tracking-wider`}>
            {feature.badge}
          </span>

          {/* Title */}
          <h3 className="text-base font-bold text-gray-900 leading-snug">{feature.title}</h3>

          {/* Description */}
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{feature.description}</p>
        </div>

        {/* Expand toggle */}
        <div className="flex-shrink-0 mt-1">
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded bullets */}
      {expanded && (
        <ul className="mt-4 ml-16 space-y-2">
          {feature.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-green-500 font-bold mt-0.5">✓</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CTASection({ signupUrl, label = "primary" }: { signupUrl: string; label?: string }) {
  return (
    <div className="text-center">
      {/* Offer badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold mb-4">
        <span>🎁</span>
        <span>Free plan + 1 month Premium free — no credit card needed</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={signupUrl}
          onClick={() => track(`go_cta_signup_${label}`)}
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-teal-600 text-white text-lg font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all"
        >
          Start Free — No Credit Card
          <span aria-hidden="true">→</span>
        </a>
        <a
          href={MARKETING_URL}
          onClick={() => track(`go_cta_marketing_${label}`)}
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white border-2 border-gray-200 text-gray-700 text-lg font-semibold hover:border-teal-400 hover:text-teal-700 transition-all"
        >
          Full Marketing Site
          <span aria-hidden="true">↗</span>
        </a>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Free plan available · Cancel anytime · Available in 8 languages
      </p>
    </div>
  );
}

export default function GoPage() {
  const { t } = useTranslation();
  const signupUrl = buildSignupUrl();

  useEffect(() => {
    track("go_page_view_v2");
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-5 py-3 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
        <img
          src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663099417101/YPVUcoNPoLMtiepj.png"
          alt="YFIT AI"
          className="h-8 w-auto"
        />
        <div className="flex items-center gap-3">
          <LanguageSwitcher compact={false} />
          <a
            href={signupUrl}
            onClick={() => track("go_header_cta")}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 text-white text-sm font-bold shadow hover:opacity-90 transition-all"
          >
            Try Free →
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-10 space-y-12">

        {/* ── Hero ── */}
        <section className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-sm font-semibold">
            <span>🏆</span>
            <span>The most complete fitness app — all in one place</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
            Every fitness feature you need.{" "}
            <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Nothing else comes close.
            </span>
          </h1>

          <p className="text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
            YFIT AI combines workouts, nutrition, medications, AI coaching, real-time form analysis,
            predictions, and daily habit tracking — all personalised to <em>you</em>.
          </p>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            {[
              { stat: "11+", label: "App Features" },
              { stat: "8", label: "Languages" },
              { stat: "Free", label: "To Start" },
            ].map((s, i) => (
              <div key={i} className="bg-gray-50 rounded-xl py-3 px-2">
                <p className="text-2xl font-extrabold text-gray-900">{s.stat}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Top CTA ── */}
        <CTASection signupUrl={signupUrl} label="top" />

        {/* ── Features ── */}
        <section className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Everything inside YFIT AI</h2>
            <p className="text-sm text-gray-500 mt-1">Tap any feature to see what's included</p>
          </div>

          {FEATURES.map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} />
          ))}
        </section>

        {/* ── Why YFIT is different ── */}
        <section className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white p-7 space-y-5">
          <h2 className="text-xl font-bold">Why YFIT is different</h2>
          <div className="space-y-3">
            {[
              { icon: "💊", text: "The only fitness app that tracks medications and flags dangerous workout interactions" },
              { icon: "🎯", text: "The only app with real-time AI form analysis using just your phone camera" },
              { icon: "📋", text: "Generates a printable health report you can share with your doctor" },
              { icon: "🧠", text: "AI coach that knows your meds, goals, and history — not generic advice" },
              { icon: "🆓", text: "Genuinely free plan + 1 month of Premium free when you sign up today" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <p className="text-sm text-gray-200 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Competitor comparison ── */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 text-center">How we compare</h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Feature</th>
                  <th className="px-4 py-3 font-bold text-teal-700">YFIT AI</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">MyFitnessPal</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Noom</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ["Medication tracking", true, false, false],
                  ["AI form analysis", true, false, false],
                  ["Provider PDF report", true, false, false],
                  ["AI coaching & chat", true, false, true],
                  ["Barcode scanner", true, true, false],
                  ["AI predictions", true, false, false],
                  ["Free plan", true, true, false],
                ].map(([label, yfit, mfp, noom], i) => (
                  <tr key={i} className={yfit && !mfp && !noom ? "bg-teal-50/40" : ""}>
                    <td className="px-4 py-3 text-gray-700 font-medium">{label as string}</td>
                    <td className="px-4 py-3 text-center">{yfit ? "✅" : "❌"}</td>
                    <td className="px-4 py-3 text-center">{mfp ? "✅" : "❌"}</td>
                    <td className="px-4 py-3 text-center">{noom ? "✅" : "❌"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 text-center">Based on publicly available feature information as of 2025. Highlighted rows are unique to YFIT.</p>
        </section>

        {/* ── Bottom CTA ── */}
        <CTASection signupUrl={signupUrl} label="bottom" />

      </main>

      {/* ── Footer ── */}
      <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-100 space-x-3">
        <a href="https://yfitai.com" className="hover:text-gray-600 transition-colors">yfitai.com</a>
        <span>·</span>
        <a href="https://yfitai.com/legal" className="hover:text-gray-600 transition-colors">Privacy</a>
        <span>·</span>
        <a href="mailto:support@yfitai.com" className="hover:text-gray-600 transition-colors">support@yfitai.com</a>
      </footer>
    </div>
  );
}
