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
const DEMO_URL = "https://app.yfitai.com/go?mode=guest";
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

// ─── App Preview Tabs ────────────────────────────────────────────────────────

const APP_PREVIEWS = [
  {
    id: "dashboard",
    label: "Dashboard",
    emoji: "🏠",
    color: "bg-teal-500",
    activeColor: "bg-teal-500 text-white",
    description: "Your daily command centre — calories, macros, workouts, steps, water and mood all in one glance.",
    mockContent: (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Today's Calories</p>
            <p className="text-2xl font-bold text-gray-900">1,420 <span className="text-sm font-normal text-gray-500">/ 2,100</span></p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-teal-500 flex items-center justify-center">
            <span className="text-sm font-bold text-teal-600">68%</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{label:"Protein",val:"112g",color:"bg-blue-100 text-blue-700"},{label:"Carbs",val:"180g",color:"bg-amber-100 text-amber-700"},{label:"Fat",val:"48g",color:"bg-rose-100 text-rose-700"}].map((m,i)=>(
            <div key={i} className={`rounded-xl p-2 text-center ${m.color}`}>
              <p className="text-xs font-medium">{m.label}</p>
              <p className="text-base font-bold">{m.val}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-gray-50 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💧</span>
            <div>
              <p className="text-xs text-gray-500">Water</p>
              <p className="text-sm font-bold text-gray-800">6 / 8 glasses</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">👟</span>
            <div>
              <p className="text-xs text-gray-500">Steps</p>
              <p className="text-sm font-bold text-gray-800">7,240</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">😊</span>
            <div>
              <p className="text-xs text-gray-500">Mood</p>
              <p className="text-sm font-bold text-gray-800">Good</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "nutrition",
    label: "Nutrition",
    emoji: "🥗",
    color: "bg-lime-500",
    activeColor: "bg-lime-500 text-white",
    description: "Scan any barcode to log food instantly. Your calorie target is calculated from your personal TDEE — not a generic number.",
    mockContent: (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl bg-lime-50 border border-lime-200 p-3">
          <span className="text-2xl">📷</span>
          <div>
            <p className="text-sm font-bold text-gray-900">Barcode Scanner</p>
            <p className="text-xs text-gray-500">Point at any food package to log instantly</p>
          </div>
        </div>
        {[
          {name:"Greek Yogurt",cal:130,protein:"17g",carbs:"9g",fat:"0g",time:"8:30 AM"},
          {name:"Chicken Breast",cal:280,protein:"52g",carbs:"0g",fat:"6g",time:"12:15 PM"},
          {name:"Brown Rice",cal:215,protein:"5g",carbs:"45g",fat:"2g",time:"12:15 PM"},
        ].map((food,i)=>(
          <div key={i} className="flex items-center justify-between rounded-xl bg-white border border-gray-100 p-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{food.name}</p>
              <p className="text-xs text-gray-400">{food.time} · P:{food.protein} C:{food.carbs} F:{food.fat}</p>
            </div>
            <p className="text-sm font-bold text-gray-700">{food.cal} kcal</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "workout",
    label: "Workout",
    emoji: "🏋️",
    color: "bg-orange-500",
    activeColor: "bg-orange-500 text-white",
    description: "Log every set and rep with progressive overload tracking. Choose from push/pull/legs or upper/lower splits.",
    mockContent: (
      <div className="space-y-3">
        <div className="rounded-xl bg-orange-50 border border-orange-200 p-3">
          <p className="text-xs font-bold text-orange-700 uppercase tracking-wide">Today — Push Day A</p>
          <p className="text-sm text-gray-600 mt-0.5">Chest · Shoulders · Triceps</p>
        </div>
        {[
          {name:"Bench Press",sets:"4 × 8",weight:"80 kg",pr:true},
          {name:"Incline DB Press",sets:"3 × 10",weight:"28 kg",pr:false},
          {name:"Lateral Raises",sets:"3 × 15",weight:"12 kg",pr:false},
          {name:"Tricep Pushdown",sets:"3 × 12",weight:"35 kg",pr:false},
        ].map((ex,i)=>(
          <div key={i} className="flex items-center justify-between rounded-xl bg-white border border-gray-100 p-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">{ex.name}</p>
                {ex.pr && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">PR 🏆</span>}
              </div>
              <p className="text-xs text-gray-400">{ex.sets}</p>
            </div>
            <p className="text-sm font-bold text-gray-700">{ex.weight}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "medications",
    label: "Meds",
    emoji: "💊",
    color: "bg-pink-500",
    activeColor: "bg-pink-500 text-white",
    description: "The only fitness app that tracks your medications, flags dangerous workout interactions, and generates a PDF report for your doctor.",
    mockContent: (
      <div className="space-y-3">
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-bold text-rose-800">Interaction Alert</p>
            <p className="text-xs text-rose-600 mt-0.5">Metformin + high-intensity cardio may cause hypoglycaemia. Consider a light snack before training.</p>
          </div>
        </div>
        {[
          {name:"Metformin",dose:"500mg",time:"Morning",taken:true},
          {name:"Vitamin D3",dose:"2000 IU",time:"Morning",taken:true},
          {name:"Omega-3",dose:"1000mg",time:"Evening",taken:false},
        ].map((med,i)=>(
          <div key={i} className="flex items-center justify-between rounded-xl bg-white border border-gray-100 p-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{med.name}</p>
              <p className="text-xs text-gray-400">{med.dose} · {med.time}</p>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${med.taken ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {med.taken ? "✓ Taken" : "Pending"}
            </span>
          </div>
        ))}
        <button className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold flex items-center justify-center gap-2">
          <span>📋</span> Generate Doctor's PDF Report
        </button>
      </div>
    ),
  },
  {
    id: "progress",
    label: "Progress",
    emoji: "📈",
    color: "bg-violet-500",
    activeColor: "bg-violet-500 text-white",
    description: "See your transformation with body measurement charts, progress photos, and AI predictions for your goal date.",
    mockContent: (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            {label:"Current Weight",val:"82.4 kg",change:"-1.2 kg",positive:true},
            {label:"Body Fat",val:"18.2%",change:"-0.8%",positive:true},
            {label:"Muscle Mass",val:"63.1 kg",change:"+0.4 kg",positive:true},
            {label:"Goal Weight",val:"78 kg",change:"Est. 9 weeks",positive:true},
          ].map((s,i)=>(
            <div key={i} className="rounded-xl bg-violet-50 border border-violet-100 p-3">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-base font-bold text-gray-900">{s.val}</p>
              <p className="text-xs text-emerald-600 font-semibold">{s.change}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-white border border-gray-100 p-3">
          <p className="text-xs font-bold text-gray-500 mb-2">WEIGHT TREND (last 4 weeks)</p>
          <div className="flex items-end gap-1 h-12">
            {[85.1,84.5,83.8,83.2,82.9,82.6,82.4].map((w,i)=>(
              <div key={i} className="flex-1 rounded-t" style={{height:`${((w-81)/(86-81))*100}%`,background:`hsl(${262 - i*5},70%,60%)`}} />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>4 wks ago</span><span>Today</span>
          </div>
        </div>
      </div>
    ),
  },
];

function AppPreviewTabs({ signupUrl }: { signupUrl: string }) {
  const [active, setActive] = useState(0);
  const preview = APP_PREVIEWS[active];

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden">
      {/* Tab bar */}
      <div className="flex overflow-x-auto gap-1 p-2 bg-gray-50 border-b border-gray-200 scrollbar-hide">
        {APP_PREVIEWS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setActive(i)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              active === i ? p.activeColor + " shadow-sm" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <span>{p.emoji}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Preview content */}
      <div className="p-4 space-y-3">
        <p className="text-sm text-gray-600 leading-relaxed">{preview.description}</p>
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
          {preview.mockContent}
        </div>
        <a
          href={DEMO_URL}
          onClick={() => track(`go_preview_explore_${preview.id}`)}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 text-sm font-bold hover:bg-teal-100 transition-all"
        >
          <span>👀</span>
          <span>Try this feature live — no sign-up needed</span>
          <span>→</span>
        </a>
      </div>
    </div>
  );
}

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
    <div className="space-y-3">
      {/* Offer badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold">
          <span>🎁</span>
          <span>Free plan + 1 month Premium free — no credit card needed</span>
        </div>
      </div>

      {/* Explore first — PRIMARY option, top of stack */}
      <a
        href={DEMO_URL}
        onClick={() => track(`go_cta_demo_${label}`)}
        className="flex items-center justify-between w-full px-6 py-5 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">👀</span>
          <div className="text-left">
            <p className="font-bold text-base leading-tight">Explore the app first</p>
            <p className="text-teal-100 text-sm">No sign-up needed — browse all features now</p>
          </div>
        </div>
        <span className="text-xl font-bold">→</span>
      </a>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">or sign up free</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={signupUrl}
          onClick={() => track(`go_cta_signup_${label}`)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-teal-600 text-white text-base font-bold shadow hover:opacity-90 active:scale-95 transition-all"
        >
          Start Free — No Credit Card
          <span aria-hidden="true">→</span>
        </a>
        <a
          href={MARKETING_URL}
          onClick={() => track(`go_cta_marketing_${label}`)}
          className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white border-2 border-gray-200 text-gray-700 text-base font-semibold hover:border-teal-400 hover:text-teal-700 transition-all"
        >
          Full Site ↗
        </a>
      </div>

      <p className="text-xs text-gray-400 text-center">
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

        {/* ── Interactive App Preview Tabs ── */}
        <section className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">See it in action</h2>
            <p className="text-sm text-gray-500 mt-1">Tap a feature to preview what it looks like inside the app</p>
          </div>
          <AppPreviewTabs signupUrl={signupUrl} />
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
