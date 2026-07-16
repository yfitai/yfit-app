import { useState } from "react";
import { useTranslation } from "react-i18next";

// ─── TDEE Calculation (Katch-McArdle with Navy BF estimate) ──────────────────
function estimateBodyFat(
  gender: "male" | "female",
  weightLbs: number,
  heightIn: number,
  age: number
): number {
  // US Navy method approximation (no tape measure, so we use age-based estimate)
  // For landing page purposes we use a simple age/gender heuristic
  if (gender === "male") {
    return Math.max(8, Math.min(35, 10 + age * 0.15));
  } else {
    return Math.max(15, Math.min(45, 18 + age * 0.15));
  }
}

function calculateTDEE(
  gender: "male" | "female",
  weightLbs: number,
  heightFt: number,
  heightIn: number,
  age: number,
  activityLevel: string
): { tdee: number; bmr: number; bf: number; lbm: number } {
  const totalInches = heightFt * 12 + heightIn;
  const weightKg = weightLbs * 0.453592;
  const bf = estimateBodyFat(gender, weightLbs, totalInches, age);
  const lbm = weightKg * (1 - bf / 100);
  const bmr = 370 + 21.6 * lbm;

  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const tdee = Math.round(bmr * (multipliers[activityLevel] ?? 1.375));
  return { tdee, bmr: Math.round(bmr), bf: Math.round(bf), lbm: Math.round(lbm) };
}

function getCalorieTarget(tdee: number, goal: string): number {
  switch (goal) {
    case "lose_weight": return tdee - 500;
    case "lose_fast": return tdee - 750;
    case "maintain": return tdee;
    case "gain_muscle": return tdee + 300;
    case "build_strength": return tdee + 200;
    default: return tdee;
  }
}

function getMacros(calories: number, goal: string) {
  let proteinPct: number, carbPct: number, fatPct: number;
  switch (goal) {
    case "lose_weight":
    case "lose_fast":
      proteinPct = 0.35; carbPct = 0.35; fatPct = 0.30; break;
    case "gain_muscle":
    case "build_strength":
      proteinPct = 0.30; carbPct = 0.45; fatPct = 0.25; break;
    default:
      proteinPct = 0.30; carbPct = 0.40; fatPct = 0.30;
  }
  return {
    protein: Math.round((calories * proteinPct) / 4),
    carbs: Math.round((calories * carbPct) / 4),
    fat: Math.round((calories * fatPct) / 9),
  };
}

// ─── Static data (values only — labels come from i18n) ───────────────────────
const GOAL_VALUES = ["lose_weight", "lose_fast", "maintain", "gain_muscle", "build_strength"];
const GOAL_EMOJIS: Record<string, string> = {
  lose_weight: "🔥", lose_fast: "⚡", maintain: "⚖️", gain_muscle: "💪", build_strength: "🏋️",
};
const ACTIVITY_VALUES = ["sedentary", "light", "moderate", "active"];

// ─── Component ───────────────────────────────────────────────────────────────
export default function QuickSetupCalculator() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0); // 0=body, 1=activity, 2=goal, 3=results
  const [gender, setGender] = useState<"male" | "female">("male");
  const [age, setAge] = useState("");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("8");
  const [weightLbs, setWeightLbs] = useState("");
  const [activity, setActivity] = useState("light");
  const [goal, setGoal] = useState("lose_weight");
  const [results, setResults] = useState<null | {
    tdee: number; calories: number; protein: number; carbs: number; fat: number; bf: number;
  }>(null);

  const step1Valid = age && weightLbs && Number(age) > 0 && Number(weightLbs) > 0;

  function handleCalculate() {
    const { tdee, bf } = calculateTDEE(
      gender,
      Number(weightLbs),
      Number(heightFt),
      Number(heightIn),
      Number(age),
      activity
    );
    const calories = getCalorieTarget(tdee, goal);
    const { protein, carbs, fat } = getMacros(calories, goal);
    setResults({ tdee, calories, protein, carbs, fat, bf });
    setStep(3);
  }

  const goalLabel = t(`landing.calculator.goals.${goal}.label`, goal);
  const appUrl = "https://app.yfitai.com/signup";

  const stepLabels = [
    t("landing.calculator.stepLabels.0", "Body Info"),
    t("landing.calculator.stepLabels.1", "Activity"),
    t("landing.calculator.stepLabels.2", "Your Goal"),
  ];

  const saveFeatures = [
    t("landing.calculator.saveFeatures.0", "📊 Track your actual food intake against these targets"),
    t("landing.calculator.saveFeatures.1", "🎯 Precise body fat % from your real measurements"),
    t("landing.calculator.saveFeatures.2", "📈 Weekly progress charts and predictions"),
    t("landing.calculator.saveFeatures.3", "🤖 AI Coach adapts your plan as you progress"),
    t("landing.calculator.saveFeatures.4", "💊 Medication interaction checker"),
    t("landing.calculator.saveFeatures.5", "🌍 Available in 8 languages"),
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Step indicator */}
      {step < 3 && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all ${
                i === step
                  ? "bg-green-600 text-white shadow-md"
                  : i < step
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-400"
              }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === step ? "bg-white text-green-600" : i < step ? "bg-green-600 text-white" : "bg-gray-300 text-gray-500"
                }`}>{i < step ? "✓" : i + 1}</span>
                {label}
              </div>
              {i < 2 && <div className={`w-6 h-0.5 ${i < step ? "bg-green-400" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>
      )}

      {/* ── Step 0: Body Info ── */}
      {step === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h3 className="text-lg font-semibold text-gray-900">{t("landing.calculator.step0Title")}</h3>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t("landing.calculator.biologicalSex")}</label>
            <div className="grid grid-cols-2 gap-3">
              {(["male", "female"] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`py-3 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                    gender === g
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {g === "male" ? `♂ ${t("landing.calculator.male")}` : `♀ ${t("landing.calculator.female")}`}
                </button>
              ))}
            </div>
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t("landing.calculator.age")}</label>
            <input
              type="number"
              placeholder={t("landing.calculator.agePlaceholder")}
              value={age}
              onChange={e => setAge(e.target.value)}
              min={15}
              max={100}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
            />
          </div>

          {/* Height */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t("landing.calculator.height")}</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input
                  type="number"
                  value={heightFt}
                  onChange={e => setHeightFt(e.target.value)}
                  min={3}
                  max={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">ft</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={heightIn}
                  onChange={e => setHeightIn(e.target.value)}
                  min={0}
                  max={11}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">in</span>
              </div>
            </div>
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t("landing.calculator.currentWeight")}</label>
            <div className="relative">
              <input
                type="number"
                placeholder="e.g. 175"
                value={weightLbs}
                onChange={e => setWeightLbs(e.target.value)}
                min={80}
                max={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">lbs</span>
            </div>
          </div>

          <button
            onClick={() => setStep(1)}
            disabled={!step1Valid}
            className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all ${
              step1Valid
                ? "bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {t("landing.calculator.nextActivity")}
          </button>
        </div>
      )}

      {/* ── Step 1: Activity ── */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">{t("landing.calculator.step1Title")}</h3>
          <p className="text-sm text-gray-500">{t("landing.calculator.step1Subtitle", "Be honest — most people overestimate their activity level.")}</p>

          <div className="space-y-3">
            {ACTIVITY_VALUES.map(val => (
              <button
                key={val}
                onClick={() => setActivity(val)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all ${
                  activity === val
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium text-gray-900 text-sm">{t(`landing.calculator.activity.${val}.label`, val)}</div>
                <div className="text-xs text-gray-500 mt-0.5">{t(`landing.calculator.activity.${val}.desc`, "")}</div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(0)}
              className="flex-1 py-3.5 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-all"
            >
              {t("landing.calculator.back")}
            </button>
            <button
              onClick={() => setStep(2)}
              className="flex-[2] py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
            >
              {t("landing.calculator.nextGoal", "Next: Your Goal →")}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Goal ── */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">{t("landing.calculator.step2Title")}</h3>

          <div className="space-y-2.5">
            {GOAL_VALUES.map(val => (
              <button
                key={val}
                onClick={() => setGoal(val)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all flex items-center gap-3 ${
                  goal === val
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-xl">{GOAL_EMOJIS[val]}</span>
                <div>
                  <div className="font-medium text-gray-900 text-sm">{t(`landing.calculator.goals.${val}.label`, val)}</div>
                  <div className="text-xs text-gray-500">{t(`landing.calculator.goals.${val}.desc`, "")}</div>
                </div>
                {goal === val && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-white text-xs">✓</span>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3.5 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-all"
            >
              {t("landing.calculator.back")}
            </button>
            <button
              onClick={handleCalculate}
              className="flex-[2] py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
            >
              {t("landing.calculator.calculateBtn")}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Results ── */}
      {step === 3 && results && (
        <div className="space-y-4">
          {/* Header card */}
          <div className="bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl p-6 text-white text-center shadow-lg">
            <p className="text-green-100 text-sm font-medium mb-1">{t("landing.calculator.resultsTitle")}</p>
            <div className="text-6xl font-bold mb-1">{results.calories.toLocaleString()}</div>
            <p className="text-green-100 text-sm">{t("landing.calculator.caloriesPerDay")} <strong className="text-white">{goalLabel.toLowerCase()}</strong></p>
            <div className="mt-3 text-xs text-green-200">
              {t("landing.calculator.tdeeMaintenance")}: {results.tdee.toLocaleString()} cal · {t("landing.calculator.estBodyFat")}: ~{results.bf}%
            </div>
          </div>

          {/* Macros */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">{t("landing.calculator.dailyMacros")}</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <div className="text-2xl font-bold text-blue-700">{results.protein}g</div>
                <div className="text-xs text-blue-600 font-medium mt-0.5">{t("landing.calculator.protein")}</div>
                <div className="text-xs text-gray-400">{Math.round(results.protein * 4)} cal</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-xl">
                <div className="text-2xl font-bold text-orange-700">{results.carbs}g</div>
                <div className="text-xs text-orange-600 font-medium mt-0.5">{t("landing.calculator.carbs")}</div>
                <div className="text-xs text-gray-400">{Math.round(results.carbs * 4)} cal</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-xl">
                <div className="text-2xl font-bold text-purple-700">{results.fat}g</div>
                <div className="text-xs text-purple-600 font-medium mt-0.5">{t("landing.calculator.fat")}</div>
                <div className="text-xs text-gray-400">{Math.round(results.fat * 9)} cal</div>
              </div>
            </div>
          </div>

          {/* What you get in the app */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">{t("landing.calculator.saveResultsTitle")}</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              {saveFeatures.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <a
            href={`${appUrl}?tdee=${results.tdee}&goal=${goal}&calories=${results.calories}`}
            className="block w-full py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-center shadow-lg hover:shadow-xl transition-all text-lg"
          >
            {t("landing.calculator.saveResultsCta")}
          </a>
          <p className="text-center text-xs text-gray-400">
            {t("landing.calculator.noCreditCard")}
          </p>

          <button
            onClick={() => { setStep(0); setResults(null); setAge(""); setWeightLbs(""); }}
            className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {t("landing.calculator.recalculate")}
          </button>
        </div>
      )}
    </div>
  );
}
