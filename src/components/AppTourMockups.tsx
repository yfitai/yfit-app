/**
 * AppTourMockups.tsx
 * Pixel-accurate React mockups of all 10 YFIT app screens for the landing page App Tour section.
 * Uses the same design tokens (Tailwind, green theme) as the real app.
 */

import { useState } from "react";
import {
  Activity, Target, Apple, Dumbbell, Calendar, Pill, BarChart3,
  TrendingUp, Brain, Globe, Check, ChevronRight, Flame, Droplets,
  Moon, Footprints, Zap, MessageSquare, Send, AlertTriangle,
  ArrowUp, ArrowDown, Minus, Star, Clock, ChevronDown,
} from "lucide-react";

// ─── Shared mini-components ──────────────────────────────────────────────────

function MockPhoneFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative bg-white rounded-[2rem] shadow-2xl border-4 border-gray-200 overflow-hidden w-full max-w-[320px] mx-auto ${className}`}
      style={{ aspectRatio: "9/19" }}>
      {/* Status bar */}
      <div className="bg-gray-50 px-5 py-1.5 flex items-center justify-between border-b border-gray-100">
        <span className="text-[10px] font-semibold text-gray-500">9:41</span>
        <div className="w-16 h-3 bg-gray-900 rounded-full" />
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 border border-gray-500 rounded-sm relative">
            <div className="absolute inset-0.5 bg-green-500 rounded-sm w-2/3" />
          </div>
        </div>
      </div>
      <div className="overflow-hidden h-full">{children}</div>
    </div>
  );
}

function StatCard({ label, value, unit, color, icon: Icon }: { label: string; value: string; unit?: string; color: string; icon: any }) {
  return (
    <div className={`rounded-xl p-3 ${color} flex flex-col gap-1`}>
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 opacity-70" />
        <span className="text-[10px] font-medium opacity-70">{label}</span>
      </div>
      <div className="flex items-end gap-0.5">
        <span className="text-lg font-bold leading-none">{value}</span>
        {unit && <span className="text-[10px] opacity-60 mb-0.5">{unit}</span>}
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color = "bg-green-500" }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── 1. Dashboard Mockup ─────────────────────────────────────────────────────

export function DashboardMockup() {
  return (
    <MockPhoneFrame>
      <div className="bg-gradient-to-br from-green-50 to-blue-50 h-full overflow-y-auto">
        {/* Header */}
        <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100">
          <p className="text-[10px] text-gray-500">Good morning 🌅</p>
          <h2 className="text-base font-bold text-gray-800">Hey, Alex!</h2>
          <p className="text-[10px] text-green-600 italic mt-0.5">"The only bad workout is the one that didn't happen."</p>
        </div>

        {/* Stats grid */}
        <div className="px-3 pt-3 grid grid-cols-2 gap-2">
          <StatCard label="Calories" value="1,420" unit="/ 2,100" color="bg-orange-50 text-orange-700" icon={Flame} />
          <StatCard label="Steps" value="7,832" unit="/ 10k" color="bg-blue-50 text-blue-700" icon={Footprints} />
          <StatCard label="Workouts" value="3" unit="this week" color="bg-purple-50 text-purple-700" icon={Dumbbell} />
          <StatCard label="Streak" value="12" unit="days" color="bg-green-50 text-green-700" icon={Zap} />
        </div>

        {/* Today's summary */}
        <div className="px-3 pt-3">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Today's Progress</p>
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 space-y-2.5">
            {[
              { label: "Calories", val: 1420, max: 2100, color: "bg-orange-400" },
              { label: "Protein", val: 98, max: 150, color: "bg-blue-400" },
              { label: "Water", val: 6, max: 8, color: "bg-cyan-400", unit: "glasses" },
            ].map(({ label, val, max, color, unit }) => (
              <div key={label}>
                <div className="flex justify-between text-[10px] text-gray-600 mb-1">
                  <span>{label}</span>
                  <span className="font-medium">{val}{unit ? ` ${unit}` : ""} / {max}{unit ? ` ${unit}` : ""}</span>
                </div>
                <ProgressBar value={val} max={max} color={color} />
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-3 pt-3 pb-4">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick Actions</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Log Meal", icon: Apple, color: "bg-green-100 text-green-700" },
              { label: "Workout", icon: Dumbbell, color: "bg-purple-100 text-purple-700" },
              { label: "AI Coach", icon: Brain, color: "bg-violet-100 text-violet-700" },
            ].map(({ label, icon: Icon, color }) => (
              <div key={label} className={`${color} rounded-xl p-2.5 flex flex-col items-center gap-1`}>
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-medium text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MockPhoneFrame>
  );
}

// ─── 2. Goals Mockup ─────────────────────────────────────────────────────────

export function GoalsMockup() {
  return (
    <MockPhoneFrame>
      <div className="bg-gradient-to-br from-blue-50 to-green-50 h-full overflow-y-auto">
        <div className="px-4 pt-3 pb-2">
          <h2 className="text-base font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Goals & Metrics</h2>
          <p className="text-[10px] text-gray-500">Your personalized health targets</p>
        </div>

        {/* Results cards */}
        <div className="px-3 grid grid-cols-2 gap-2 mb-3">
          {[
            { label: "BMI", value: "24.1", sub: "Normal range", color: "bg-green-50 border-green-200 text-green-700" },
            { label: "Body Fat", value: "18.4%", sub: "Athletic", color: "bg-blue-50 border-blue-200 text-blue-700" },
            { label: "TDEE", value: "2,340", sub: "kcal/day", color: "bg-orange-50 border-orange-200 text-orange-700" },
            { label: "Goal Cal", value: "1,890", sub: "Fat loss", color: "bg-purple-50 border-purple-200 text-purple-700" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className={`rounded-xl p-3 border ${color}`}>
              <p className="text-[9px] font-medium opacity-70">{label}</p>
              <p className="text-lg font-bold leading-tight">{value}</p>
              <p className="text-[9px] opacity-60">{sub}</p>
            </div>
          ))}
        </div>

        {/* Primary goal */}
        <div className="px-3 mb-3">
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-semibold text-gray-500 mb-2">Primary Goal</p>
            <div className="flex gap-2">
              {["Lose Weight", "Maintain", "Build Muscle"].map((g, i) => (
                <div key={g} className={`flex-1 rounded-lg py-1.5 text-center text-[9px] font-semibold border ${i === 0 ? "bg-green-600 text-white border-green-600" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                  {g}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Measurements */}
        <div className="px-3 pb-4">
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-semibold text-gray-500 mb-2">Body Measurements</p>
            <div className="space-y-1.5">
              {[
                { label: "Height", value: "5'10\"" },
                { label: "Weight", value: "175 lbs" },
                { label: "Waist", value: "32 in" },
                { label: "Chest", value: "40 in" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-[10px]">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-gray-800">{value}</span>
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

export function NutritionMockup() {
  return (
    <MockPhoneFrame>
      <div className="bg-white h-full overflow-y-auto">
        <div className="bg-green-600 px-4 pt-3 pb-4 text-white">
          <h2 className="text-sm font-bold">Nutrition Tracker</h2>
          <p className="text-[10px] opacity-80">Monday, June 9</p>
          <div className="mt-2 bg-white/20 rounded-xl p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-medium">Daily Calories</span>
              <span className="text-[10px] font-bold">1,420 / 1,890</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-2">
              <div className="bg-white h-2 rounded-full" style={{ width: "75%" }} />
            </div>
            <div className="flex justify-between mt-2 text-[9px] opacity-80">
              <span>Protein: 98g</span>
              <span>Carbs: 165g</span>
              <span>Fat: 52g</span>
            </div>
          </div>
        </div>

        {/* Meals */}
        <div className="px-3 pt-3 space-y-2">
          {[
            { meal: "Breakfast", time: "7:30 AM", cal: 420, items: ["Oatmeal with berries", "Greek yogurt"] },
            { meal: "Lunch", time: "12:15 PM", cal: 580, items: ["Grilled chicken salad", "Whole wheat wrap"] },
            { meal: "Snack", time: "3:00 PM", cal: 180, items: ["Apple", "Almonds (1 oz)"] },
            { meal: "Dinner", time: "—", cal: 0, items: ["Not logged yet"] },
          ].map(({ meal, time, cal, items }) => (
            <div key={meal} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-bold text-gray-800">{meal}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-400">{time}</span>
                  <span className="text-[10px] font-semibold text-green-600">{cal > 0 ? `${cal} kcal` : "—"}</span>
                </div>
              </div>
              {items.map(item => (
                <p key={item} className="text-[9px] text-gray-500 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-green-400 inline-block" />
                  {item}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Add food button */}
        <div className="px-3 pt-2 pb-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 flex items-center justify-center gap-2 text-green-700">
            <span className="text-[10px] font-semibold">+ Log Food / Scan Barcode</span>
          </div>
        </div>
      </div>
    </MockPhoneFrame>
  );
}

// ─── 4. Daily Tracker Mockup ─────────────────────────────────────────────────

export function DailyTrackerMockup() {
  return (
    <MockPhoneFrame>
      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 h-full overflow-y-auto">
        <div className="px-4 pt-3 pb-2">
          <h2 className="text-base font-bold text-gray-800">Daily Tracker</h2>
          <p className="text-[10px] text-gray-500">Monday, June 9</p>
        </div>

        {/* Habit rings */}
        <div className="px-3 mb-3">
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-semibold text-gray-500 mb-3">Today's Habits</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Water", icon: Droplets, done: 6, total: 8, color: "text-cyan-500" },
                { label: "Sleep", icon: Moon, done: 7.5, total: 8, color: "text-indigo-500" },
                { label: "Steps", icon: Footprints, done: 7832, total: 10000, color: "text-orange-500" },
                { label: "Mood", icon: Star, done: 4, total: 5, color: "text-yellow-500" },
              ].map(({ label, icon: Icon, done, total, color }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 rounded-full border-2 border-gray-100 flex items-center justify-center ${color} bg-gray-50`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] text-gray-500 text-center leading-tight">{label}</span>
                  <span className="text-[8px] font-bold text-gray-700">{typeof done === 'number' && done > 100 ? `${(done/1000).toFixed(1)}k` : done}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Log entries */}
        <div className="px-3 space-y-2 pb-4">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Today's Log</p>
          {[
            { time: "7:00 AM", entry: "Logged 8hrs sleep", icon: Moon, color: "bg-indigo-100 text-indigo-600" },
            { time: "8:30 AM", entry: "Drank 2 glasses water", icon: Droplets, color: "bg-cyan-100 text-cyan-600" },
            { time: "10:00 AM", entry: "7,832 steps recorded", icon: Footprints, color: "bg-orange-100 text-orange-600" },
            { time: "12:30 PM", entry: "Mood: Energized (4/5)", icon: Star, color: "bg-yellow-100 text-yellow-600" },
          ].map(({ time, entry, icon: Icon, color }) => (
            <div key={entry} className="bg-white rounded-xl p-2.5 border border-gray-100 flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-gray-800">{entry}</p>
                <p className="text-[9px] text-gray-400">{time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MockPhoneFrame>
  );
}

// ─── 5. Fitness Mockup ───────────────────────────────────────────────────────

export function FitnessMockup() {
  return (
    <MockPhoneFrame>
      <div className="bg-gray-900 h-full overflow-y-auto text-white">
        <div className="px-4 pt-3 pb-2">
          <h2 className="text-base font-bold">Fitness</h2>
          <p className="text-[10px] text-gray-400">Push Day — Week 3</p>
        </div>

        {/* Active workout */}
        <div className="px-3 mb-3">
          <div className="bg-green-600 rounded-xl p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-bold">Current Workout</span>
              <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> 24:15
              </span>
            </div>
            <p className="text-sm font-bold">Push Day A</p>
            <p className="text-[10px] opacity-80">Chest · Shoulders · Triceps</p>
          </div>
        </div>

        {/* Exercise list */}
        <div className="px-3 space-y-2 pb-4">
          {[
            { name: "Bench Press", sets: "4×8", weight: "185 lbs", done: true },
            { name: "Overhead Press", sets: "3×10", weight: "95 lbs", done: true },
            { name: "Incline DB Press", sets: "3×12", weight: "65 lbs", done: false, active: true },
            { name: "Tricep Pushdown", sets: "3×15", weight: "50 lbs", done: false },
            { name: "Lateral Raises", sets: "4×15", weight: "20 lbs", done: false },
          ].map(({ name, sets, weight, done, active }) => (
            <div key={name} className={`rounded-xl p-2.5 border flex items-center gap-2.5 ${active ? "bg-green-900 border-green-600" : done ? "bg-gray-800 border-gray-700 opacity-70" : "bg-gray-800 border-gray-700"}`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${done ? "bg-green-500 border-green-500" : active ? "border-green-400" : "border-gray-600"}`}>
                {done && <Check className="w-3 h-3 text-white" />}
                {active && <div className="w-2 h-2 rounded-full bg-green-400" />}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-semibold">{name}</p>
                <p className="text-[9px] text-gray-400">{sets} · {weight}</p>
              </div>
              {active && <span className="text-[9px] bg-green-600 px-2 py-0.5 rounded-full">Active</span>}
            </div>
          ))}
        </div>
      </div>
    </MockPhoneFrame>
  );
}

// ─── 6. Medications Mockup ───────────────────────────────────────────────────

export function MedicationsMockup() {
  return (
    <MockPhoneFrame>
      <div className="bg-white h-full overflow-y-auto">
        <div className="bg-pink-600 px-4 pt-3 pb-4 text-white">
          <h2 className="text-sm font-bold">Medications</h2>
          <p className="text-[10px] opacity-80">4 active medications</p>
          <div className="mt-2 flex gap-2">
            <div className="flex-1 bg-white/20 rounded-lg p-2 text-center">
              <p className="text-base font-bold">4</p>
              <p className="text-[9px] opacity-80">Active</p>
            </div>
            <div className="flex-1 bg-white/20 rounded-lg p-2 text-center">
              <p className="text-base font-bold">2</p>
              <p className="text-[9px] opacity-80">Interactions</p>
            </div>
            <div className="flex-1 bg-white/20 rounded-lg p-2 text-center">
              <p className="text-base font-bold">✓</p>
              <p className="text-[9px] opacity-80">Taken today</p>
            </div>
          </div>
        </div>

        <div className="px-3 pt-3 space-y-2 pb-4">
          {[
            { name: "Metformin", dose: "500mg", freq: "Twice daily", type: "Type 2 Diabetes", warn: "Avoid intense cardio within 2hrs of dose", color: "border-l-blue-500" },
            { name: "Lisinopril", dose: "10mg", freq: "Once daily (AM)", type: "Blood Pressure", warn: null, color: "border-l-green-500" },
            { name: "Vitamin D3", dose: "2000 IU", freq: "Once daily", type: "Supplement", warn: null, color: "border-l-yellow-500" },
            { name: "Atorvastatin", dose: "20mg", freq: "Once daily (PM)", type: "Cholesterol", warn: "Muscle soreness may be amplified post-workout", color: "border-l-purple-500" },
          ].map(({ name, dose, freq, type, warn, color }) => (
            <div key={name} className={`bg-gray-50 rounded-xl p-3 border border-gray-100 border-l-4 ${color}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold text-gray-800">{name} <span className="font-normal text-gray-500">{dose}</span></p>
                  <p className="text-[9px] text-gray-400">{freq} · {type}</p>
                </div>
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
              </div>
              {warn && (
                <div className="mt-1.5 flex items-start gap-1 bg-amber-50 rounded-lg px-2 py-1">
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[8px] text-amber-700">{warn}</p>
                </div>
              )}
            </div>
          ))}
          <div className="bg-pink-50 border border-pink-200 rounded-xl p-2.5 flex items-center justify-center gap-2 text-pink-700">
            <span className="text-[10px] font-semibold">📧 Send Report to Provider</span>
          </div>
        </div>
      </div>
    </MockPhoneFrame>
  );
}

// ─── 7. Progress Mockup ──────────────────────────────────────────────────────

export function ProgressMockup() {
  // Sparkline data for weight
  const weightData = [182, 180, 179, 178, 177, 176, 175];
  const maxW = Math.max(...weightData);
  const minW = Math.min(...weightData);

  return (
    <MockPhoneFrame>
      <div className="bg-gradient-to-br from-teal-50 to-green-50 h-full overflow-y-auto">
        <div className="px-4 pt-3 pb-2">
          <h2 className="text-base font-bold text-gray-800">Progress</h2>
          <p className="text-[10px] text-gray-500">Last 30 days</p>
        </div>

        {/* Weight chart */}
        <div className="px-3 mb-3">
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] font-semibold text-gray-700">Weight</p>
              <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5">
                <ArrowDown className="w-3 h-3" /> 7 lbs lost
              </span>
            </div>
            {/* Mini sparkline */}
            <svg viewBox="0 0 200 50" className="w-full h-10">
              <polyline
                fill="none"
                stroke="#16a34a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
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
        </div>

        {/* Measurement changes */}
        <div className="px-3 mb-3">
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-semibold text-gray-700 mb-2">Measurements</p>
            <div className="space-y-2">
              {[
                { label: "Body Fat", from: "21.2%", to: "18.4%", delta: "-2.8%", good: true },
                { label: "Waist", from: "34 in", to: "32 in", delta: "-2 in", good: true },
                { label: "Chest", from: "39 in", to: "40 in", delta: "+1 in", good: true },
                { label: "BMI", from: "25.1", to: "24.1", delta: "-1.0", good: true },
              ].map(({ label, from, to, delta, good }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-600">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-400">{from} → {to}</span>
                    <span className={`text-[9px] font-bold ${good ? "text-green-600" : "text-red-500"}`}>{delta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Workout streak */}
        <div className="px-3 pb-4">
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-semibold text-gray-700 mb-2">Workout Streak</p>
            <div className="flex gap-1">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className={`flex-1 h-5 rounded-sm ${i < 12 ? "bg-green-500" : i === 12 ? "bg-green-200" : "bg-gray-100"}`} />
              ))}
            </div>
            <p className="text-[9px] text-gray-400 mt-1">🔥 12-day streak — keep it up!</p>
          </div>
        </div>
      </div>
    </MockPhoneFrame>
  );
}

// ─── 8. Predictions Mockup ───────────────────────────────────────────────────

export function PredictionsMockup() {
  return (
    <MockPhoneFrame>
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 h-full overflow-y-auto">
        <div className="px-4 pt-3 pb-2">
          <h2 className="text-base font-bold text-gray-800">Predictions</h2>
          <p className="text-[10px] text-gray-500">AI-powered goal forecasting</p>
        </div>

        {/* Goal date prediction */}
        <div className="px-3 mb-3">
          <div className="bg-indigo-600 rounded-xl p-3 text-white">
            <p className="text-[10px] opacity-80 mb-1">At your current pace you will reach</p>
            <p className="text-sm font-bold">Target Weight: 168 lbs</p>
            <p className="text-[10px] opacity-80 mt-0.5">Estimated: <span className="font-bold text-yellow-300">September 14, 2026</span></p>
            <div className="mt-2 bg-white/20 rounded-lg p-2">
              <div className="flex justify-between text-[9px] mb-1">
                <span>Progress to goal</span>
                <span>47%</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-1.5">
                <div className="bg-yellow-300 h-1.5 rounded-full" style={{ width: "47%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Predictions list */}
        <div className="px-3 space-y-2 pb-4">
          {[
            { label: "Body Fat at Goal Date", value: "14.2%", trend: "down", note: "Athletic range" },
            { label: "Weekly Avg Calorie Deficit", value: "−3,500 kcal", trend: "stable", note: "1 lb/week pace" },
            { label: "Predicted Muscle Gain", value: "+2.1 lbs", trend: "up", note: "Recomp effect" },
            { label: "Metabolic Rate Change", value: "+85 kcal/day", trend: "up", note: "From muscle gain" },
          ].map(({ label, value, trend, note }) => (
            <div key={label} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${trend === "up" ? "bg-green-100" : trend === "down" ? "bg-blue-100" : "bg-gray-100"}`}>
                {trend === "up" ? <ArrowUp className="w-3.5 h-3.5 text-green-600" /> : trend === "down" ? <ArrowDown className="w-3.5 h-3.5 text-blue-600" /> : <Minus className="w-3.5 h-3.5 text-gray-500" />}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-gray-800">{value}</p>
                <p className="text-[9px] text-gray-500">{label}</p>
              </div>
              <span className="text-[8px] text-gray-400 text-right leading-tight max-w-[60px]">{note}</span>
            </div>
          ))}
        </div>
      </div>
    </MockPhoneFrame>
  );
}

// ─── 9. Body Recomp Mockup ───────────────────────────────────────────────────

export function RecompMockup() {
  return (
    <MockPhoneFrame>
      <div className="bg-gradient-to-br from-violet-50 to-pink-50 h-full overflow-y-auto">
        <div className="px-4 pt-3 pb-2">
          <h2 className="text-base font-bold text-gray-800">Body Recomp</h2>
          <p className="text-[10px] text-gray-500">Lose fat · Build muscle simultaneously</p>
        </div>

        {/* Recomp score */}
        <div className="px-3 mb-3">
          <div className="bg-violet-600 rounded-xl p-3 text-white">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] opacity-80">Recomp Score</p>
                <p className="text-2xl font-bold">78 / 100</p>
                <p className="text-[10px] opacity-80">Excellent recomp conditions</p>
              </div>
              <div className="w-14 h-14 rounded-full border-4 border-white/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Macros for recomp */}
        <div className="px-3 mb-3">
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-semibold text-gray-700 mb-2">Optimal Macro Split</p>
            <div className="space-y-2">
              {[
                { macro: "Protein", grams: "175g", pct: 37, color: "bg-blue-500" },
                { macro: "Carbs", grams: "195g", pct: 41, color: "bg-orange-400" },
                { macro: "Fat", grams: "52g", pct: 22, color: "bg-yellow-400" },
              ].map(({ macro, grams, pct, color }) => (
                <div key={macro}>
                  <div className="flex justify-between text-[10px] text-gray-600 mb-0.5">
                    <span>{macro}</span>
                    <span className="font-semibold">{grams} ({pct}%)</span>
                  </div>
                  <ProgressBar value={pct} max={100} color={color} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="px-3 pb-4 space-y-2">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">AI Recommendations</p>
          {[
            "Maintain 200–300 kcal deficit on rest days",
            "Eat at maintenance on training days",
            "Prioritize protein within 2hrs post-workout",
          ].map((tip, i) => (
            <div key={i} className="bg-white rounded-xl p-2.5 border border-gray-100 flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[8px] font-bold text-violet-600">{i + 1}</span>
              </div>
              <p className="text-[9px] text-gray-600">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </MockPhoneFrame>
  );
}

// ─── 10. AI Coach Mockup ─────────────────────────────────────────────────────

export function AICoachMockup() {
  return (
    <MockPhoneFrame>
      <div className="bg-gray-50 h-full flex flex-col">
        {/* Header */}
        <div className="bg-violet-600 px-4 pt-3 pb-3 text-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold">YFIT AI Coach</p>
              <p className="text-[9px] opacity-80">● Online · Always available</p>
            </div>
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {/* AI message */}
          <div className="flex items-end gap-1.5">
            <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
              <Brain className="w-3 h-3 text-violet-600" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm border border-gray-100 max-w-[80%]">
              <p className="text-[10px] text-gray-700">Good morning Alex! You've hit your protein goal 5 days in a row 🎉. Today is Push Day — ready to crush it?</p>
            </div>
          </div>

          {/* User message */}
          <div className="flex justify-end">
            <div className="bg-violet-600 rounded-2xl rounded-br-sm px-3 py-2 max-w-[75%]">
              <p className="text-[10px] text-white">My shoulder has been a bit sore. Should I still do overhead press?</p>
            </div>
          </div>

          {/* AI response */}
          <div className="flex items-end gap-1.5">
            <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
              <Brain className="w-3 h-3 text-violet-600" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm border border-gray-100 max-w-[80%]">
              <p className="text-[10px] text-gray-700">Given your shoulder soreness, I'd swap overhead press for <span className="font-semibold text-violet-600">Arnold Press at 70% weight</span> and add a band pull-apart warm-up. Also note: Lisinopril can affect recovery — keep intensity moderate today.</p>
            </div>
          </div>

          {/* User message */}
          <div className="flex justify-end">
            <div className="bg-violet-600 rounded-2xl rounded-br-sm px-3 py-2 max-w-[75%]">
              <p className="text-[10px] text-white">Perfect, thanks!</p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="px-3 pb-3 pt-2 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-sm">
            <span className="text-[10px] text-gray-400 flex-1">Ask your AI coach anything...</span>
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
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 h-full overflow-y-auto">
        <div className="px-4 pt-3 pb-2">
          <h2 className="text-base font-bold text-gray-800">Language</h2>
          <p className="text-[10px] text-gray-500">YFIT speaks your language</p>
        </div>

        {/* Current language */}
        <div className="px-3 mb-3">
          <div className="bg-blue-600 rounded-xl p-3 text-white">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <div>
                <p className="text-[10px] opacity-80">Currently displaying in</p>
                <p className="text-sm font-bold">{selected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Language grid */}
        <div className="px-3 mb-3">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Available Languages</p>
          <div className="grid grid-cols-2 gap-2">
            {langs.map(lang => (
              <button
                key={lang}
                onClick={() => setSelected(lang)}
                className={`rounded-xl p-2.5 text-left border transition-all ${selected === lang ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-100 shadow-sm"}`}
              >
                <p className="text-[10px] font-medium">{lang}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="px-3 pb-4">
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-semibold text-gray-500 mb-2">Preview</p>
            <div className="space-y-1">
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
      </div>
    </MockPhoneFrame>
  );
}

// ─── App Tour Data ────────────────────────────────────────────────────────────

export const APP_TOUR_SCREENS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Activity,
    color: "bg-green-600",
    title: "Everything in one place",
    description: "Your complete health picture at a glance — calories, steps, workouts, streak, and personalized motivational quotes. No more switching between 5 apps.",
    component: DashboardMockup,
  },
  {
    id: "goals",
    label: "Goals",
    icon: Target,
    color: "bg-blue-600",
    title: "Know your numbers",
    description: "Enter your measurements and YFIT automatically calculates your BMI, body fat %, TDEE, and target calories using the Katch-McArdle formula — more accurate than any other app.",
    component: GoalsMockup,
  },
  {
    id: "nutrition",
    label: "Nutrition",
    icon: Apple,
    color: "bg-green-600",
    title: "Track every meal effortlessly",
    description: "Log meals by searching, scanning barcodes, or letting AI identify your food from a photo. Your TDEE from Goals auto-populates your daily calorie target.",
    component: NutritionMockup,
  },
  {
    id: "daily",
    label: "Daily Tracker",
    icon: Calendar,
    color: "bg-orange-600",
    title: "Build habits that stick",
    description: "Track water intake, sleep quality, mood, and steps in one daily log. See your habits visualized over time so you know exactly what's working.",
    component: DailyTrackerMockup,
  },
  {
    id: "fitness",
    label: "Fitness",
    icon: Dumbbell,
    color: "bg-purple-600",
    title: "Workouts built for progressive overload",
    description: "Push/pull/legs and upper/lower splits with adjustable sets and reps. Rest timer, exercise diagrams, and a full exercise library — all included free.",
    component: FitnessMockup,
  },
  {
    id: "medications",
    label: "Medications",
    icon: Pill,
    color: "bg-pink-600",
    title: "The only fitness app your doctor will thank you for",
    description: "Track all medications, get drug interaction warnings, and generate a printable provider report in one tap. YFIT is the only fitness app that accounts for how your meds affect your workouts.",
    component: MedicationsMockup,
  },
  {
    id: "progress",
    label: "Progress",
    icon: BarChart3,
    color: "bg-teal-600",
    title: "See exactly how far you've come",
    description: "Weight trend charts, body measurement changes, workout streaks, and progress photos — all in one place. Weekly, monthly, and all-time views.",
    component: ProgressMockup,
  },
  {
    id: "predictions",
    label: "Predictions",
    icon: TrendingUp,
    color: "bg-indigo-600",
    title: "Know when you'll reach your goal",
    description: "AI analyzes your pace and predicts your goal date, body fat at target weight, and metabolic changes. Stop guessing — start knowing.",
    component: PredictionsMockup,
  },
  {
    id: "recomp",
    label: "Body Recomp",
    icon: Zap,
    color: "bg-violet-600",
    title: "Lose fat and build muscle at the same time",
    description: "YFIT's Recomp Score tells you if your current nutrition and training setup is optimal for body recomposition — and gives you exact macro targets to make it happen.",
    component: RecompMockup,
  },
  {
    id: "aicoach",
    label: "AI Coach",
    icon: Brain,
    color: "bg-violet-700",
    title: "A coach that knows your full health picture",
    description: "Unlike generic AI chatbots, YFIT's AI Coach knows your goals, medications, workout history, and nutrition data — giving advice that's actually personalized to you.",
    component: AICoachMockup,
  },
  {
    id: "language",
    label: "Languages",
    icon: Globe,
    color: "bg-blue-700",
    title: "Available in 8 languages",
    description: "YFIT speaks English, Spanish, French, German, Portuguese, Japanese, Chinese, and Arabic. Every screen, every notification, every AI response — in your language.",
    component: LanguageMockup,
  },
];
