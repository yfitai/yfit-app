/**
 * AppTourMockups.tsx
 * Pixel-accurate React mockups of all 11 YFIT app screens for the landing page App Tour section.
 * Colors matched to real app screenshots provided June 9 2026.
 */

import { useState } from "react";
import {
  Activity, Target, Apple, Dumbbell, Calendar, Pill, BarChart3,
  TrendingUp, Brain, Globe, Check, Flame, Droplets,
  Moon, Footprints, Zap, MessageSquare, Send, AlertTriangle,
  ArrowUp, ArrowDown, Minus, Star, Clock, ChevronRight,
  Sparkles, Heart, Syringe, Scale, Camera, RefreshCw,
} from "lucide-react";

// ─── Shared mini-components ──────────────────────────────────────────────────

function MockPhoneFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative bg-white rounded-[2rem] shadow-2xl border-4 border-gray-200 overflow-hidden w-full max-w-[320px] mx-auto ${className}`}
      style={{ aspectRatio: "9/19" }}
    >
      {/* Status bar */}
      <div className="bg-gray-50 px-5 py-1.5 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
        <span className="text-[10px] font-semibold text-gray-500">9:41</span>
        <div className="w-16 h-3 bg-gray-900 rounded-full" />
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 border border-gray-500 rounded-sm relative">
            <div className="absolute inset-0.5 bg-green-500 rounded-sm w-2/3" />
          </div>
        </div>
      </div>
      <div className="overflow-y-auto" style={{ height: "calc(100% - 28px)" }}>{children}</div>
    </div>
  );
}

function ProgressBar({ value, max, color = "bg-green-500", height = "h-2" }: { value: number; max: number; color?: string; height?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={`w-full bg-gray-100 rounded-full ${height}`}>
      <div className={`${color} ${height} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── 1. Dashboard Mockup ─────────────────────────────────────────────────────
// Colors: light blue-grey bg #f0f4f8, teal gradient header, white stat cards
// Quick Actions: Goals=blue, Nutrition=green, Fitness=purple, Daily Tracker=orange,
//                Medications=pink, Progress=teal, Predictions=purple, AI Coach=violet

export function DashboardMockup() {
  return (
    <MockPhoneFrame>
      {/* Teal gradient header banner */}
      <div style={{ background: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)" }} className="px-4 pt-3 pb-4 text-white">
        <p className="text-[10px] opacity-80">Good morning 🌅</p>
        <h2 className="text-sm font-bold">Hey, Alex!</h2>
        <p className="text-[9px] opacity-70 italic mt-0.5">"The only bad workout is the one that didn't happen."</p>
        {/* Calorie ring summary */}
        <div className="mt-2 bg-white/15 rounded-xl p-2.5 flex items-center gap-3">
          <div className="relative w-12 h-12 flex-shrink-0">
            <svg viewBox="0 0 48 48" className="w-12 h-12 -rotate-90">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
              <circle cx="24" cy="24" r="20" fill="none" stroke="white" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 20 * 0.68} ${2 * Math.PI * 20 * 0.32}`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[9px] font-bold">68%</span>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold">1,420 / 2,100 kcal</p>
            <p className="text-[9px] opacity-70">680 kcal remaining</p>
          </div>
        </div>
      </div>

      {/* Light blue-grey background for content */}
      <div style={{ backgroundColor: "#f0f4f8" }} className="px-3 pt-3 pb-4 space-y-3">
        {/* Macro bars */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <p className="text-[10px] font-semibold text-gray-500 mb-2">Today's Macros</p>
          {[
            { label: "Protein", val: 98, max: 150, color: "bg-blue-500" },
            { label: "Carbs", val: 165, max: 240, color: "bg-orange-400" },
            { label: "Fat", val: 42, max: 65, color: "bg-purple-400" },
          ].map(({ label, val, max, color }) => (
            <div key={label} className="mb-1.5">
              <div className="flex justify-between text-[9px] text-gray-500 mb-0.5">
                <span>{label}</span><span className="font-medium">{val}g / {max}g</span>
              </div>
              <ProgressBar value={val} max={max} color={color} height="h-1.5" />
            </div>
          ))}
        </div>

        {/* Quick Actions grid */}
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick Actions</p>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: "Goals", icon: Target, bg: "bg-blue-100", text: "text-blue-700" },
              { label: "Nutrition", icon: Apple, bg: "bg-green-100", text: "text-green-700" },
              { label: "Fitness", icon: Dumbbell, bg: "bg-purple-100", text: "text-purple-700" },
              { label: "Tracker", icon: Calendar, bg: "bg-orange-100", text: "text-orange-700" },
              { label: "Meds", icon: Pill, bg: "bg-pink-100", text: "text-pink-700" },
              { label: "Progress", icon: BarChart3, bg: "bg-teal-100", text: "text-teal-700" },
              { label: "Predict", icon: TrendingUp, bg: "bg-indigo-100", text: "text-indigo-700" },
              { label: "AI Coach", icon: Brain, bg: "bg-violet-100", text: "text-violet-700" },
            ].map(({ label, icon: Icon, bg, text }) => (
              <div key={label} className={`${bg} ${text} rounded-xl p-2 flex flex-col items-center gap-1`}>
                <Icon className="w-4 h-4" />
                <span className="text-[8px] font-medium text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's workout card */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-800">Push Day A</p>
              <p className="text-[9px] text-gray-400">5 exercises · ~45 min</p>
            </div>
            <div className="bg-green-600 text-white rounded-lg px-2.5 py-1.5 text-[9px] font-semibold">Start</div>
          </div>
        </div>
      </div>
    </MockPhoneFrame>
  );
}

// ─── 2. Goals Mockup ─────────────────────────────────────────────────────────
// Colors: white bg, blue→green gradient header text, metric cards with colored borders
// Yellow target measurements card, pink advanced options card

export function GoalsMockup() {
  return (
    <MockPhoneFrame>
      <div className="bg-white">
        {/* Header with gradient text */}
        <div className="px-4 pt-3 pb-3 border-b border-gray-100">
          <h2 className="text-sm font-bold" style={{ background: "linear-gradient(90deg, #2563eb, #16a34a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Goals &amp; Metrics
          </h2>
          <p className="text-[9px] text-gray-400">Your personalized health targets</p>
        </div>

        <div className="px-3 pt-3 space-y-3 pb-4">
          {/* Body type selector */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-[10px] font-semibold text-blue-700 mb-2">Body Type</p>
            <div className="flex gap-2">
              {["Ectomorph", "Mesomorph", "Endomorph"].map((t, i) => (
                <div key={t} className={`flex-1 rounded-lg py-1.5 text-center text-[8px] font-semibold border ${i === 1 ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200"}`}>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Metric cards grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "BMI", value: "24.1", sub: "Normal", color: "border-green-400 bg-green-50", text: "text-green-700" },
              { label: "Body Fat", value: "18.4%", sub: "Athletic", color: "border-blue-400 bg-blue-50", text: "text-blue-700" },
              { label: "TDEE", value: "2,340", sub: "kcal/day", color: "border-orange-400 bg-orange-50", text: "text-orange-700" },
              { label: "Target Cal", value: "1,890", sub: "Fat loss", color: "border-purple-400 bg-purple-50", text: "text-purple-700" },
            ].map(({ label, value, sub, color, text }) => (
              <div key={label} className={`rounded-xl p-3 border-2 ${color}`}>
                <p className={`text-[9px] font-medium ${text} opacity-70`}>{label}</p>
                <p className={`text-lg font-bold leading-tight ${text}`}>{value}</p>
                <p className={`text-[8px] ${text} opacity-60`}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Primary goal */}
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-semibold text-gray-500 mb-2">Primary Goal</p>
            <div className="flex gap-1.5">
              {["Lose Weight", "Maintain", "Build Muscle"].map((g, i) => (
                <div key={g} className={`flex-1 rounded-lg py-1.5 text-center text-[8px] font-semibold border ${i === 0 ? "bg-green-600 text-white border-green-600" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                  {g}
                </div>
              ))}
            </div>
          </div>

          {/* Target measurements — yellow card */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <p className="text-[10px] font-semibold text-yellow-700 mb-1.5">Target Measurements</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {[["Target Weight", "168 lbs"], ["Target BF%", "14%"], ["Goal Date", "Sep 2026"]].map(([k, v]) => (
                <div key={k} className="flex justify-between text-[9px]">
                  <span className="text-yellow-600">{k}</span>
                  <span className="font-semibold text-yellow-800">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MockPhoneFrame>
  );
}

// ─── 3. Nutrition Mockup ─────────────────────────────────────────────────────
// Colors: white bg, calorie bar blue→green gradient, Protein=blue, Carbs=orange, Fat=purple
// Action buttons: blue-green gradient, purple, orange, teal

export function NutritionMockup() {
  return (
    <MockPhoneFrame>
      <div className="bg-white">
        {/* Header */}
        <div className="px-4 pt-3 pb-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">Nutrition Tracker</h2>
          <p className="text-[9px] text-gray-400">Monday, June 9</p>
        </div>

        <div className="px-3 pt-3 space-y-3 pb-4">
          {/* Calorie progress — blue→green gradient bar */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-semibold text-gray-700">Daily Calories</span>
              <span className="text-[10px] font-bold text-gray-800">1,420 / 1,890</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="h-3 rounded-full" style={{ width: "75%", background: "linear-gradient(90deg, #2563eb, #16a34a)" }} />
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-gray-500">
              <span>75% of goal</span><span>470 kcal left</span>
            </div>
          </div>

          {/* Macro bars */}
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm space-y-2">
            {[
              { label: "Protein", val: 98, max: 150, color: "bg-blue-500", unit: "g" },
              { label: "Carbs", val: 165, max: 240, color: "bg-orange-400", unit: "g" },
              { label: "Fat", val: 42, max: 65, color: "bg-purple-500", unit: "g" },
            ].map(({ label, val, max, color, unit }) => (
              <div key={label}>
                <div className="flex justify-between text-[9px] text-gray-600 mb-0.5">
                  <span className="font-medium">{label}</span>
                  <span>{val}{unit} / {max}{unit}</span>
                </div>
                <ProgressBar value={val} max={max} color={color} height="h-2" />
              </div>
            ))}
          </div>

          {/* Meals */}
          <div className="space-y-1.5">
            {[
              { meal: "Breakfast", cal: 420, items: "Oatmeal · Greek yogurt" },
              { meal: "Lunch", cal: 580, items: "Grilled chicken salad" },
              { meal: "Snack", cal: 180, items: "Apple · Almonds" },
              { meal: "Dinner", cal: 0, items: "Not logged yet" },
            ].map(({ meal, cal, items }) => (
              <div key={meal} className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-800">{meal}</p>
                  <p className="text-[8px] text-gray-400">{items}</p>
                </div>
                <span className={`text-[10px] font-semibold ${cal > 0 ? "text-green-600" : "text-gray-300"}`}>{cal > 0 ? `${cal} kcal` : "—"}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-2 text-center text-[9px] font-semibold text-white" style={{ background: "linear-gradient(135deg, #2563eb, #16a34a)" }}>
              + Log Food
            </div>
            <div className="rounded-xl p-2 text-center text-[9px] font-semibold text-white bg-purple-600">
              Scan Barcode
            </div>
            <div className="rounded-xl p-2 text-center text-[9px] font-semibold text-white bg-orange-500">
              AI Food Photo
            </div>
            <div className="rounded-xl p-2 text-center text-[9px] font-semibold text-white bg-teal-600">
              Meal Templates
            </div>
          </div>
        </div>
      </div>
    </MockPhoneFrame>
  );
}

// ─── 4. Daily Tracker Mockup ─────────────────────────────────────────────────
// Colors: light blue-grey bg, white metric cards with mint green borders
// Purple Sleep, Blue Water, Green Steps, Red Blood Pressure, Purple Glucose

export function DailyTrackerMockup() {
  return (
    <MockPhoneFrame>
      <div style={{ backgroundColor: "#f0f4f8" }}>
        {/* Header */}
        <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">Daily Tracker</h2>
          <p className="text-[9px] text-gray-400">Monday, June 9</p>
        </div>

        <div className="px-3 pt-3 pb-4 space-y-2.5">
          {/* Metric cards with mint/teal borders */}
          {[
            { label: "Steps", value: "7,832", target: "10,000", icon: Footprints, border: "border-green-400", bg: "bg-green-50", text: "text-green-700", pct: 78 },
            { label: "Water", value: "6 glasses", target: "8 glasses", icon: Droplets, border: "border-blue-400", bg: "bg-blue-50", text: "text-blue-700", pct: 75 },
            { label: "Sleep", value: "7.5 hrs", target: "8 hrs", icon: Moon, border: "border-purple-400", bg: "bg-purple-50", text: "text-purple-700", pct: 94 },
            { label: "Blood Pressure", value: "118/76", target: "< 120/80", icon: Heart, border: "border-red-400", bg: "bg-red-50", text: "text-red-700", pct: 100 },
            { label: "Glucose", value: "94 mg/dL", target: "70–100", icon: Syringe, border: "border-violet-400", bg: "bg-violet-50", text: "text-violet-700", pct: 90 },
          ].map(({ label, value, target, icon: Icon, border, bg, text, pct }) => (
            <div key={label} className={`bg-white rounded-xl p-3 border-2 ${border} shadow-sm`}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${text}`} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-semibold text-gray-700">{label}</span>
                    <span className={`text-[10px] font-bold ${text}`}>{value}</span>
                  </div>
                  <p className="text-[8px] text-gray-400">Target: {target}</p>
                </div>
              </div>
              <ProgressBar value={pct} max={100} color={text.replace("text-", "bg-").replace("-700", "-500")} height="h-1.5" />
            </div>
          ))}

          {/* Save / Done buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-purple-600 text-white rounded-xl py-2 text-center text-[10px] font-semibold">Save Log</div>
            <div className="bg-green-600 text-white rounded-xl py-2 text-center text-[10px] font-semibold">Done ✓</div>
          </div>
        </div>
      </div>
    </MockPhoneFrame>
  );
}

// ─── 5. Fitness Mockup ───────────────────────────────────────────────────────
// Colors: light blue-grey bg, blue Fitness icon, white workout cards with mint borders

export function FitnessMockup() {
  return (
    <MockPhoneFrame>
      <div style={{ backgroundColor: "#f0f4f8" }}>
        {/* Header */}
        <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Fitness</h2>
              <p className="text-[9px] text-gray-400">Push/Pull/Legs · Week 3</p>
            </div>
          </div>
        </div>

        <div className="px-3 pt-3 pb-4 space-y-2.5">
          {/* Active workout banner */}
          <div className="bg-blue-600 rounded-xl p-3 text-white">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold">Today: Push Day A</span>
              <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> 24:15
              </span>
            </div>
            <p className="text-[9px] opacity-80">Chest · Shoulders · Triceps · 5 exercises</p>
          </div>

          {/* Exercise cards with mint borders */}
          {[
            { name: "Bench Press", sets: "4×8", weight: "185 lbs", done: true },
            { name: "Overhead Press", sets: "3×10", weight: "95 lbs", done: true },
            { name: "Incline DB Press", sets: "3×12", weight: "65 lbs", done: false, active: true },
            { name: "Tricep Pushdown", sets: "3×15", weight: "50 lbs", done: false },
            { name: "Lateral Raises", sets: "4×15", weight: "20 lbs", done: false },
          ].map(({ name, sets, weight, done, active }) => (
            <div key={name} className={`rounded-xl p-2.5 border-2 flex items-center gap-2.5 bg-white ${active ? "border-teal-400" : done ? "border-gray-100 opacity-70" : "border-gray-100"}`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${done ? "bg-green-500 border-green-500" : active ? "border-teal-400" : "border-gray-300"}`}>
                {done && <Check className="w-3 h-3 text-white" />}
                {active && <div className="w-2 h-2 rounded-full bg-teal-400" />}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-gray-800">{name}</p>
                <p className="text-[9px] text-gray-400">{sets} · {weight}</p>
              </div>
              {active && <span className="text-[8px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold">Active</span>}
            </div>
          ))}
        </div>
      </div>
    </MockPhoneFrame>
  );
}

// ─── 6. Medications Mockup ───────────────────────────────────────────────────
// Colors: white/mint bg, teal "My Medications" active tab, blue edit, red delete, mint note cards

export function MedicationsMockup() {
  return (
    <MockPhoneFrame>
      <div className="bg-white">
        {/* Header */}
        <div className="px-4 pt-3 pb-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">Medications</h2>
          <p className="text-[9px] text-gray-400">4 active · 2 interactions detected</p>
        </div>

        {/* Teal active tab */}
        <div className="px-3 pt-2">
          <div className="flex gap-1.5 mb-3">
            {["My Medications", "Search", "Interactions", "Log"].map((tab, i) => (
              <div key={tab} className={`flex-1 py-1.5 rounded-lg text-center text-[8px] font-semibold ${i === 0 ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                {tab}
              </div>
            ))}
          </div>

          {/* Medication cards */}
          <div className="space-y-2 pb-4">
            {[
              { name: "Metformin", dose: "500mg", freq: "Twice daily", color: "border-l-blue-500", warn: true },
              { name: "Lisinopril", dose: "10mg", freq: "Once daily (AM)", color: "border-l-green-500", warn: false },
              { name: "Vitamin D3", dose: "2000 IU", freq: "Once daily", color: "border-l-yellow-500", warn: false },
              { name: "Atorvastatin", dose: "20mg", freq: "Once daily (PM)", color: "border-l-purple-500", warn: true },
            ].map(({ name, dose, freq, color, warn }) => (
              <div key={name} className={`bg-gray-50 rounded-xl p-3 border border-gray-100 border-l-4 ${color}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-gray-800">{name} <span className="font-normal text-gray-500">{dose}</span></p>
                    <p className="text-[8px] text-gray-400">{freq}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center">
                      <span className="text-[8px] text-blue-600 font-bold">✎</span>
                    </div>
                    <div className="w-5 h-5 rounded bg-red-100 flex items-center justify-center">
                      <span className="text-[8px] text-red-600 font-bold">✕</span>
                    </div>
                  </div>
                </div>
                {warn && (
                  <div className="mt-1.5 flex items-start gap-1 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                    <AlertTriangle className="w-2.5 h-2.5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[8px] text-amber-700">Fitness interaction noted</p>
                  </div>
                )}
              </div>
            ))}

            {/* Mint note card */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-2.5 flex items-center justify-center gap-2">
              <span className="text-[9px] font-semibold text-teal-700">📧 Send Report to Provider</span>
            </div>
          </div>
        </div>
      </div>
    </MockPhoneFrame>
  );
}

// ─── 7. Progress Mockup ──────────────────────────────────────────────────────
// Colors: light blue-grey bg, blue Weight card, green Body Fat card, pink/lavender BMI card

export function ProgressMockup() {
  const weightData = [182, 180, 179, 178, 177, 176, 175];
  const maxW = Math.max(...weightData);
  const minW = Math.min(...weightData);

  return (
    <MockPhoneFrame>
      <div style={{ backgroundColor: "#f0f4f8" }}>
        <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">Progress</h2>
          <p className="text-[9px] text-gray-400">Last 30 days</p>
        </div>

        <div className="px-3 pt-3 pb-4 space-y-2.5">
          {/* Summary cards: blue, green, pink */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-blue-500 rounded-xl p-2.5 text-white text-center">
              <p className="text-[8px] opacity-80">Weight</p>
              <p className="text-sm font-bold">175</p>
              <p className="text-[8px] opacity-70">lbs</p>
              <p className="text-[8px] mt-0.5">↓ 7 lbs</p>
            </div>
            <div className="bg-green-500 rounded-xl p-2.5 text-white text-center">
              <p className="text-[8px] opacity-80">Body Fat</p>
              <p className="text-sm font-bold">18.4</p>
              <p className="text-[8px] opacity-70">%</p>
              <p className="text-[8px] mt-0.5">↓ 2.8%</p>
            </div>
            <div className="bg-pink-400 rounded-xl p-2.5 text-white text-center">
              <p className="text-[8px] opacity-80">BMI</p>
              <p className="text-sm font-bold">24.1</p>
              <p className="text-[8px] opacity-70">score</p>
              <p className="text-[8px] mt-0.5">Normal</p>
            </div>
          </div>

          {/* Weight chart */}
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] font-semibold text-gray-700">Weight Trend</p>
              <span className="text-[9px] text-green-600 font-bold flex items-center gap-0.5">
                <ArrowDown className="w-3 h-3" /> 7 lbs
              </span>
            </div>
            <svg viewBox="0 0 200 50" className="w-full h-10">
              <defs>
                <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                points={weightData.map((v, i) => {
                  const x = (i / (weightData.length - 1)) * 190 + 5;
                  const y = 45 - ((v - minW) / (maxW - minW + 1)) * 35;
                  return `${x},${y}`;
                }).join(" ")}
              />
              {weightData.map((v, i) => {
                const x = (i / (weightData.length - 1)) * 190 + 5;
                const y = 45 - ((v - minW) / (maxW - minW + 1)) * 35;
                return <circle key={i} cx={x} cy={y} r="2.5" fill="#16a34a" />;
              })}
            </svg>
            <div className="flex justify-between text-[8px] text-gray-400 mt-1">
              <span>May 10</span><span>May 20</span><span>Jun 9</span>
            </div>
          </div>

          {/* Measurements */}
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-semibold text-gray-700 mb-2">Measurements</p>
            {[
              { label: "Body Fat", delta: "−2.8%", good: true },
              { label: "Waist", delta: "−2 in", good: true },
              { label: "Chest", delta: "+1 in", good: true },
            ].map(({ label, delta, good }) => (
              <div key={label} className="flex justify-between text-[9px] py-0.5">
                <span className="text-gray-500">{label}</span>
                <span className={`font-bold ${good ? "text-green-600" : "text-red-500"}`}>{delta}</span>
              </div>
            ))}
          </div>

          {/* Progress photos */}
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] font-semibold text-gray-700">Progress Photos</p>
              <Camera className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {["May 1", "May 15", "Jun 9"].map((d) => (
                <div key={d} className="aspect-square rounded-lg bg-gray-100 flex flex-col items-center justify-center">
                  <Camera className="w-4 h-4 text-gray-300" />
                  <span className="text-[7px] text-gray-400 mt-0.5">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MockPhoneFrame>
  );
}

// ─── 8. Predictions Mockup ───────────────────────────────────────────────────
// Colors: green banner (goal timeline), red/orange Calorie Needs card, green Injury Risk card

export function PredictionsMockup() {
  return (
    <MockPhoneFrame>
      <div style={{ backgroundColor: "#f0f4f8" }}>
        <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">Predictions</h2>
          <p className="text-[9px] text-gray-400">AI-powered goal forecasting</p>
        </div>

        <div className="px-3 pt-3 pb-4 space-y-2.5">
          {/* Green goal timeline banner */}
          <div className="bg-green-600 rounded-xl p-3 text-white">
            <p className="text-[9px] opacity-80">At your current pace</p>
            <p className="text-sm font-bold">Goal: 168 lbs</p>
            <p className="text-[9px] opacity-80 mt-0.5">Est. <span className="font-bold text-yellow-300">September 14, 2026</span></p>
            <div className="mt-2 bg-white/20 rounded-lg p-2">
              <div className="flex justify-between text-[9px] mb-1">
                <span>Progress to goal</span><span>47%</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-1.5">
                <div className="bg-yellow-300 h-1.5 rounded-full" style={{ width: "47%" }} />
              </div>
            </div>
          </div>

          {/* Calorie Needs — red/orange card */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-red-500" />
              <p className="text-[10px] font-bold text-red-700">Calorie Needs</p>
            </div>
            <p className="text-lg font-bold text-red-600">1,890 kcal/day</p>
            <p className="text-[9px] text-red-500">−450 deficit · 1 lb/week pace</p>
          </div>

          {/* Injury Risk — green card */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-green-600" />
              <p className="text-[10px] font-bold text-green-700">Injury Risk</p>
            </div>
            <p className="text-lg font-bold text-green-600">Low</p>
            <p className="text-[9px] text-green-500">Recovery score: 84/100</p>
          </div>

          {/* Prediction list */}
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm space-y-2">
            {[
              { label: "Body Fat at Goal", value: "14.2%", icon: ArrowDown, color: "text-blue-600" },
              { label: "Muscle Gain", value: "+2.1 lbs", icon: ArrowUp, color: "text-green-600" },
              { label: "Metabolic Rate", value: "+85 kcal/day", icon: ArrowUp, color: "text-green-600" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-[9px] text-gray-500">{label}</span>
                <span className={`text-[10px] font-bold ${color} flex items-center gap-0.5`}>
                  <Icon className="w-3 h-3" />{value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MockPhoneFrame>
  );
}

// ─── 9. Body Recomp Mockup ───────────────────────────────────────────────────
// Colors: white bg, solid green progress banner #16a34a, orange "Reduce" badges, orange progress bars

export function RecompMockup() {
  return (
    <MockPhoneFrame>
      <div className="bg-white">
        <div className="px-4 pt-3 pb-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">Body Recomp</h2>
          <p className="text-[9px] text-gray-400">Lose fat · Build muscle simultaneously</p>
        </div>

        <div className="px-3 pt-3 pb-4 space-y-3">
          {/* Solid green progress banner */}
          <div style={{ backgroundColor: "#16a34a" }} className="rounded-xl p-3 text-white">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[9px] opacity-80">Recomp Score</p>
                <p className="text-2xl font-bold">78 / 100</p>
                <p className="text-[9px] opacity-80">Excellent conditions</p>
              </div>
              <div className="w-14 h-14 rounded-full border-4 border-white/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            {/* Weekly progress bar */}
            <div className="mt-2 bg-white/20 rounded-lg p-2">
              <div className="flex justify-between text-[9px] mb-1">
                <span>Week 3 of 12</span><span>25%</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-1.5">
                <div className="bg-white h-1.5 rounded-full" style={{ width: "25%" }} />
              </div>
            </div>
          </div>

          {/* Macro targets with orange "Reduce" badges */}
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-semibold text-gray-700 mb-2">Optimal Macro Split</p>
            {[
              { macro: "Protein", grams: "175g", pct: 37, color: "bg-blue-500", badge: null },
              { macro: "Carbs", grams: "195g", pct: 41, color: "bg-orange-400", badge: "Reduce" },
              { macro: "Fat", grams: "52g", pct: 22, color: "bg-yellow-400", badge: "Reduce" },
            ].map(({ macro, grams, pct, color, badge }) => (
              <div key={macro} className="mb-2">
                <div className="flex justify-between items-center text-[9px] text-gray-600 mb-0.5">
                  <span className="font-medium">{macro}</span>
                  <div className="flex items-center gap-1.5">
                    <span>{grams} ({pct}%)</span>
                    {badge && <span className="bg-orange-100 text-orange-600 text-[7px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>}
                  </div>
                </div>
                <ProgressBar value={pct} max={100} color={color} height="h-1.5" />
              </div>
            ))}
          </div>

          {/* AI Recommendations */}
          <div className="space-y-1.5">
            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide">AI Recommendations</p>
            {[
              "Maintain 200–300 kcal deficit on rest days",
              "Eat at maintenance on training days",
              "Prioritize protein within 2hrs post-workout",
            ].map((tip, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-2.5 border border-gray-100 flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[8px] font-bold text-green-600">{i + 1}</span>
                </div>
                <p className="text-[9px] text-gray-600">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MockPhoneFrame>
  );
}

// ─── 10. AI Coach Mockup ─────────────────────────────────────────────────────
// Colors: white bg, purple AI Coach tab button #7c3aed, sparkle icon, violet chat bubbles

export function AICoachMockup() {
  return (
    <MockPhoneFrame>
      <div className="bg-gray-50 flex flex-col h-full">
        {/* Header with purple sparkle */}
        <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-800">YFIT AI Coach</p>
              <p className="text-[9px] text-green-500 font-medium">● Online · Always available</p>
            </div>
            {/* Purple AI Coach tab button */}
            <div className="ml-auto bg-violet-600 text-white rounded-lg px-2.5 py-1 text-[9px] font-semibold">
              AI Coach
            </div>
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
          <div className="flex items-end gap-1.5">
            <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3 h-3 text-violet-600" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm border border-gray-100 max-w-[80%]">
              <p className="text-[9px] text-gray-700">Good morning Alex! You've hit your protein goal 5 days in a row 🎉. Today is Push Day — ready to crush it?</p>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="bg-violet-600 rounded-2xl rounded-br-sm px-3 py-2 max-w-[75%]">
              <p className="text-[9px] text-white">My shoulder has been a bit sore. Should I still do overhead press?</p>
            </div>
          </div>

          <div className="flex items-end gap-1.5">
            <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3 h-3 text-violet-600" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm border border-gray-100 max-w-[80%]">
              <p className="text-[9px] text-gray-700">Given your shoulder soreness, swap to <span className="font-semibold text-violet-600">Arnold Press at 70% weight</span>. Also: Lisinopril can affect recovery — keep intensity moderate today.</p>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="bg-violet-600 rounded-2xl rounded-br-sm px-3 py-2 max-w-[75%]">
              <p className="text-[9px] text-white">Perfect, thanks!</p>
            </div>
          </div>

          {/* Typing indicator */}
          <div className="flex items-end gap-1.5">
            <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3 h-3 text-violet-600" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm border border-gray-100">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="px-3 pb-3 pt-2 flex-shrink-0 bg-white border-t border-gray-100">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 flex items-center gap-2">
            <span className="text-[9px] text-gray-400 flex-1">Ask your AI coach anything...</span>
            <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center">
              <Send className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
      </div>
    </MockPhoneFrame>
  );
}

// ─── 11. Language Translator Mockup ─────────────────────────────────────────

export function LanguageMockup() {
  const [selected, setSelected] = useState("🇪🇸 Spanish");
  const langs = ["🇺🇸 English", "🇪🇸 Spanish", "🇫🇷 French", "🇩🇪 German", "🇧🇷 Portuguese", "🇯🇵 Japanese", "🇨🇳 Chinese", "🇸🇦 Arabic"];

  return (
    <MockPhoneFrame>
      <div style={{ backgroundColor: "#f0f4f8" }}>
        <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">Language</h2>
          <p className="text-[9px] text-gray-400">YFIT speaks your language</p>
        </div>

        <div className="px-3 pt-3 pb-4 space-y-3">
          {/* Current language banner */}
          <div className="bg-blue-600 rounded-xl p-3 text-white flex items-center gap-2">
            <Globe className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="text-[9px] opacity-80">Currently displaying in</p>
              <p className="text-sm font-bold">{selected}</p>
            </div>
          </div>

          {/* Language grid */}
          <div>
            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Available Languages</p>
            <div className="grid grid-cols-2 gap-1.5">
              {langs.map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelected(lang)}
                  className={`rounded-xl p-2.5 text-left border transition-all ${selected === lang ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 shadow-sm"}`}
                >
                  <p className="text-[10px] font-medium">{lang}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Live preview */}
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-[9px] font-semibold text-gray-500 mb-2">Live Preview</p>
            <p className="text-[10px] text-gray-700">
              {selected === "🇪🇸 Spanish" ? "Buenos días, Alex! Has alcanzado tu objetivo de proteínas." :
               selected === "🇫🇷 French" ? "Bonjour Alex! Vous avez atteint votre objectif protéines." :
               selected === "🇩🇪 German" ? "Guten Morgen Alex! Du hast dein Proteinziel erreicht." :
               selected === "🇧🇷 Portuguese" ? "Bom dia Alex! Você atingiu sua meta de proteína." :
               selected === "🇯🇵 Japanese" ? "おはようございます、Alex！タンパク質の目標を達成しました。" :
               selected === "🇨🇳 Chinese" ? "早上好，Alex！您已达到蛋白质目标。" :
               selected === "🇸🇦 Arabic" ? "صباح الخير يا Alex! لقد حققت هدف البروتين." :
               "Good morning Alex! You've hit your protein goal."}
            </p>
          </div>
        </div>
      </div>
    </MockPhoneFrame>
  );
}

// ─── App Tour Screen Registry ─────────────────────────────────────────────────

export const APP_TOUR_SCREENS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Activity,
    color: "bg-teal-600",
    title: "Everything in one place",
    description: "Your complete health picture at a glance — calorie ring, macro bars, today's workout, and 8 quick-action shortcuts. No more switching between 5 different apps.",
    component: DashboardMockup,
  },
  {
    id: "goals",
    label: "Goals",
    icon: Target,
    color: "bg-blue-600",
    title: "Know your exact numbers",
    description: "Enter your measurements and YFIT automatically calculates your BMI, body fat %, TDEE, and target calories using the Katch-McArdle formula — more accurate than any other fitness app.",
    component: GoalsMockup,
  },
  {
    id: "nutrition",
    label: "Nutrition",
    icon: Apple,
    color: "bg-green-600",
    title: "Track every meal effortlessly",
    description: "Log meals by searching, scanning barcodes, or letting AI identify your food from a photo. Your TDEE from Goals auto-populates your daily calorie target so you never have to do the math.",
    component: NutritionMockup,
  },
  {
    id: "dailyTracker",
    label: "Daily Tracker",
    icon: Calendar,
    color: "bg-orange-500",
    title: "Log everything that matters",
    description: "Track steps, water, sleep, blood pressure, and glucose in one place. Mint-green progress cards show you exactly where you stand against your daily targets — at a glance.",
    component: DailyTrackerMockup,
  },
  {
    id: "fitness",
    label: "Fitness",
    icon: Dumbbell,
    color: "bg-blue-600",
    title: "Smart workout planning",
    description: "Push/Pull/Legs, full-body, or custom splits — YFIT builds your program and tracks every set in real-time. Active exercises are highlighted so you never lose your place mid-workout.",
    component: FitnessMockup,
  },
  {
    id: "medications",
    label: "Medications",
    icon: Pill,
    color: "bg-teal-600",
    title: "Fitness-aware medication tracking",
    description: "The only fitness app that understands your medications. YFIT flags workout interactions (e.g., Metformin + intense cardio), tracks adherence, and generates printable provider reports.",
    component: MedicationsMockup,
  },
  {
    id: "progress",
    label: "Progress",
    icon: BarChart3,
    color: "bg-green-600",
    title: "See your transformation",
    description: "Weight trend charts, body fat %, measurement history, and progress photos in one timeline. Three summary cards — blue for weight, green for body fat, pink for BMI — give instant visual feedback.",
    component: ProgressMockup,
  },
  {
    id: "predictions",
    label: "Predictions",
    icon: TrendingUp,
    color: "bg-green-600",
    title: "Know when you'll reach your goal",
    description: "AI analyzes your pace and predicts your goal date, body fat at target weight, injury risk, and metabolic rate change. The green timeline banner updates every day as your data improves.",
    component: PredictionsMockup,
  },
  {
    id: "recomp",
    label: "Recomp",
    icon: RefreshCw,
    color: "bg-green-700",
    title: "Lose fat and build muscle simultaneously",
    description: "Body recomposition is the hardest goal to achieve — YFIT's Recomp Score (0–100) tells you exactly how optimal your conditions are, and gives AI-powered macro targets to make it happen.",
    component: RecompMockup,
  },
  {
    id: "aiCoach",
    label: "AI Coach",
    icon: Sparkles,
    color: "bg-violet-600",
    title: "Your personal AI fitness coach",
    description: "Ask anything — workout modifications, nutrition advice, recovery tips. YFIT's AI Coach knows your medications, goals, and history, so its advice is always personalized to you specifically.",
    component: AICoachMockup,
  },
  {
    id: "language",
    label: "Language",
    icon: Globe,
    color: "bg-blue-600",
    title: "Available in 8 languages",
    description: "YFIT AI is fully translated into English, Spanish, French, German, Portuguese, Japanese, Chinese, and Arabic. Switch languages instantly — every screen, every label, every AI response.",
    component: LanguageMockup,
  },
];
