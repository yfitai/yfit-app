/**
 * YFIT Demo Data Layer
 * ────────────────────
 * Pre-populated realistic data for all 9 app features, used exclusively
 * in guest/demo mode. All values are plausible for a 32-year-old male
 * (Alex, 178 cm, 84 kg, intermediate fitness level) so the app looks
 * genuinely useful — not obviously fake.
 *
 * Import individual slices in each page component:
 *   import { demoProfile, demoNutrition } from '@/data/demoData'
 */

// ─── Shared helpers ───────────────────────────────────────────────────────────

const today = new Date()
const daysAgo = (n) => {
  const d = new Date(today)
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

// ─── 1. User Profile & Goals ─────────────────────────────────────────────────

export const demoProfile = {
  id: 'guest',
  full_name: 'Alex (Demo)',
  email: 'guest@demo.yfitai.com',
  age: 32,
  gender: 'male',
  height_cm: 178,
  weight_kg: 84,
  goal: 'lose_weight',
  activity_level: 'moderately_active',
  target_weight_kg: 76,
  bmi: 26.5,
  body_fat_percent: 22,
  lean_mass_kg: 65.5,
  tdee: 2480,
  target_calories: 1980,
  target_protein_g: 165,
  target_carbs_g: 198,
  target_fat_g: 66,
  subscription_tier: 'pro', // show full pro features in demo
}

// ─── 2. Dashboard ─────────────────────────────────────────────────────────────

export const demoDashboard = {
  todayCalories: 1420,
  todayProtein: 112,
  todayCarbs: 148,
  todayFat: 44,
  todayWater: 1.8,
  todaySteps: 7240,
  weeklyWorkouts: 3,
  currentStreak: 12,
  weeklyCaloriesData: [
    { day: 'Mon', calories: 1850, target: 1980 },
    { day: 'Tue', calories: 2100, target: 1980 },
    { day: 'Wed', calories: 1760, target: 1980 },
    { day: 'Thu', calories: 1920, target: 1980 },
    { day: 'Fri', calories: 1680, target: 1980 },
    { day: 'Sat', calories: 2240, target: 1980 },
    { day: 'Sun', calories: 1420, target: 1980 },
  ],
  recentActivity: [
    { type: 'workout', label: 'Push Day A', time: '2h ago', icon: '🏋️' },
    { type: 'meal', label: 'Lunch logged', time: '3h ago', icon: '🥗' },
    { type: 'medication', label: 'Metformin taken', time: '8h ago', icon: '💊' },
    { type: 'water', label: '500ml water', time: '1h ago', icon: '💧' },
  ],
  aiInsight: 'Your protein is on track today. Based on your Metformin prescription, keep cardio sessions under 45 minutes to avoid blood sugar dips — your AI coach has adjusted your workout plan accordingly.',
}

// ─── 3. Nutrition ─────────────────────────────────────────────────────────────

export const demoNutrition = {
  todayMeals: [
    {
      id: 1,
      meal_type: 'breakfast',
      name: 'Greek Yogurt with Berries',
      calories: 320,
      protein: 28,
      carbs: 32,
      fat: 8,
      time: '07:30',
    },
    {
      id: 2,
      meal_type: 'lunch',
      name: 'Grilled Chicken & Rice Bowl',
      calories: 580,
      protein: 52,
      carbs: 68,
      fat: 12,
      time: '12:15',
    },
    {
      id: 3,
      meal_type: 'snack',
      name: 'Protein Shake',
      calories: 180,
      protein: 24,
      carbs: 10,
      fat: 4,
      time: '15:00',
    },
    {
      id: 4,
      meal_type: 'dinner',
      name: 'Salmon with Roasted Vegetables',
      calories: 520,
      protein: 44,
      carbs: 28,
      fat: 22,
      time: '19:00',
    },
  ],
  weeklyCalories: [1850, 2100, 1760, 1920, 1680, 2240, 1420],
  macroHistory: {
    protein: [148, 162, 155, 170, 145, 158, 112],
    carbs: [210, 225, 190, 205, 178, 240, 148],
    fat: [52, 61, 48, 55, 44, 68, 44],
  },
  recentFoods: [
    { name: 'Chicken Breast (200g)', calories: 330, protein: 62, carbs: 0, fat: 7 },
    { name: 'Brown Rice (150g cooked)', calories: 195, protein: 4, carbs: 42, fat: 2 },
    { name: 'Greek Yogurt 0% (200g)', calories: 118, protein: 20, carbs: 8, fat: 0 },
    { name: 'Whey Protein Shake', calories: 130, protein: 25, carbs: 5, fat: 2 },
    { name: 'Broccoli (100g)', calories: 34, protein: 3, carbs: 7, fat: 0 },
  ],
}

// ─── 4. Fitness / Workouts ────────────────────────────────────────────────────

export const demoFitness = {
  currentPlan: 'Push / Pull / Legs (PPL)',
  weeklySchedule: ['Push A', 'Pull A', 'Legs A', 'Rest', 'Push B', 'Pull B', 'Rest'],
  recentWorkouts: [
    {
      id: 1,
      name: 'Push Day A',
      date: daysAgo(1),
      duration_min: 52,
      exercises: [
        { name: 'Bench Press', sets: [{ weight: 80, reps: 8 }, { weight: 80, reps: 7 }, { weight: 75, reps: 8 }] },
        { name: 'Incline Dumbbell Press', sets: [{ weight: 32, reps: 10 }, { weight: 32, reps: 9 }, { weight: 30, reps: 10 }] },
        { name: 'Lateral Raises', sets: [{ weight: 14, reps: 15 }, { weight: 14, reps: 14 }, { weight: 12, reps: 15 }] },
        { name: 'Tricep Pushdowns', sets: [{ weight: 35, reps: 12 }, { weight: 35, reps: 12 }, { weight: 32, reps: 12 }] },
      ],
      volume_kg: 4820,
      calories_burned: 380,
    },
    {
      id: 2,
      name: 'Pull Day A',
      date: daysAgo(3),
      duration_min: 58,
      exercises: [
        { name: 'Barbell Row', sets: [{ weight: 70, reps: 8 }, { weight: 70, reps: 8 }, { weight: 65, reps: 9 }] },
        { name: 'Lat Pulldown', sets: [{ weight: 65, reps: 10 }, { weight: 65, reps: 10 }, { weight: 60, reps: 11 }] },
        { name: 'Face Pulls', sets: [{ weight: 25, reps: 15 }, { weight: 25, reps: 15 }, { weight: 22, reps: 15 }] },
        { name: 'Barbell Curl', sets: [{ weight: 40, reps: 10 }, { weight: 40, reps: 9 }, { weight: 37, reps: 10 }] },
      ],
      volume_kg: 5120,
      calories_burned: 410,
    },
  ],
  strengthProgress: {
    benchPress: [65, 67.5, 70, 72.5, 75, 77.5, 80],
    squat: [90, 92.5, 95, 97.5, 100, 102.5, 105],
    deadlift: [110, 112.5, 115, 120, 122.5, 125, 127.5],
    dates: [daysAgo(42), daysAgo(35), daysAgo(28), daysAgo(21), daysAgo(14), daysAgo(7), daysAgo(1)],
  },
}

// ─── 5. Medications ───────────────────────────────────────────────────────────

export const demoMedications = {
  medications: [
    {
      id: 1,
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      purpose: 'Blood sugar management',
      interactions: [
        { severity: 'warning', text: 'High-intensity cardio over 45 min may cause blood sugar drops. Keep sessions moderate.' },
        { severity: 'info', text: 'Take with meals to reduce GI side effects. Avoid fasted workouts.' },
      ],
      calorie_adjustment: -80,
      next_dose: '20:00 today',
    },
    {
      id: 2,
      name: 'Vitamin D3',
      dosage: '2000 IU',
      frequency: 'Once daily',
      purpose: 'Bone health & immune support',
      interactions: [
        { severity: 'info', text: 'Take with a meal containing fat for best absorption.' },
      ],
      calorie_adjustment: 0,
      next_dose: '08:00 tomorrow',
    },
    {
      id: 3,
      name: 'Omega-3 Fish Oil',
      dosage: '1000mg',
      frequency: 'Once daily',
      purpose: 'Cardiovascular & joint health',
      interactions: [
        { severity: 'info', text: 'May reduce muscle soreness — beneficial for your current training volume.' },
      ],
      calorie_adjustment: 0,
      next_dose: '08:00 tomorrow',
    },
  ],
  todayLog: [
    { medication_id: 1, taken_at: '08:00', dose: '500mg', status: 'taken' },
    { medication_id: 2, taken_at: '08:00', dose: '2000 IU', status: 'taken' },
    { medication_id: 3, taken_at: '08:00', dose: '1000mg', status: 'taken' },
    { medication_id: 1, taken_at: '20:00', dose: '500mg', status: 'pending' },
  ],
  providerReportPreview: {
    generated: daysAgo(7),
    medications_count: 3,
    interactions_flagged: 1,
    summary: 'Patient is taking Metformin 500mg twice daily. Recommend monitoring blood glucose before and after exercise sessions exceeding 30 minutes. Current fitness plan has been adjusted to account for medication interactions.',
  },
}

// ─── 6. Daily Trackers ────────────────────────────────────────────────────────

export const demoDailyTracker = {
  today: {
    date: daysAgo(0),
    water_ml: 1800,
    water_target_ml: 2500,
    sleep_hours: 7.2,
    sleep_quality: 4,
    mood: 4,
    energy: 3,
    steps: 7240,
    steps_target: 10000,
    stress: 2,
  },
  weekHistory: [
    { date: daysAgo(6), water_ml: 2200, sleep_hours: 7.8, mood: 4, energy: 4, steps: 9800 },
    { date: daysAgo(5), water_ml: 1900, sleep_hours: 6.5, mood: 3, energy: 3, steps: 6200 },
    { date: daysAgo(4), water_ml: 2400, sleep_hours: 8.1, mood: 5, energy: 5, steps: 11200 },
    { date: daysAgo(3), water_ml: 2100, sleep_hours: 7.4, mood: 4, energy: 4, steps: 8900 },
    { date: daysAgo(2), water_ml: 1700, sleep_hours: 6.9, mood: 3, energy: 3, steps: 5400 },
    { date: daysAgo(1), water_ml: 2300, sleep_hours: 7.6, mood: 4, energy: 4, steps: 10100 },
    { date: daysAgo(0), water_ml: 1800, sleep_hours: 7.2, mood: 4, energy: 3, steps: 7240 },
  ],
  streaks: {
    water: 5,
    sleep: 3,
    steps: 4,
    overall: 12,
  },
}

// ─── 7. Progress & Photos ─────────────────────────────────────────────────────

export const demoProgress = {
  weightHistory: [
    { date: daysAgo(84), weight_kg: 89.2 },
    { date: daysAgo(77), weight_kg: 88.4 },
    { date: daysAgo(70), weight_kg: 87.8 },
    { date: daysAgo(63), weight_kg: 87.1 },
    { date: daysAgo(56), weight_kg: 86.5 },
    { date: daysAgo(49), weight_kg: 86.0 },
    { date: daysAgo(42), weight_kg: 85.6 },
    { date: daysAgo(35), weight_kg: 85.1 },
    { date: daysAgo(28), weight_kg: 84.8 },
    { date: daysAgo(21), weight_kg: 84.4 },
    { date: daysAgo(14), weight_kg: 84.1 },
    { date: daysAgo(7), weight_kg: 84.0 },
    { date: daysAgo(0), weight_kg: 84.0 },
  ],
  measurements: [
    { date: daysAgo(84), chest_cm: 102, waist_cm: 94, hips_cm: 100, arms_cm: 36, thighs_cm: 58 },
    { date: daysAgo(42), chest_cm: 101, waist_cm: 91, hips_cm: 99, arms_cm: 37, thighs_cm: 57 },
    { date: daysAgo(0), chest_cm: 100, waist_cm: 88, hips_cm: 98, arms_cm: 38, thighs_cm: 56 },
  ],
  totalLost: 5.2,
  weeklyAvgLoss: 0.43,
  progressPhotos: [
    { date: daysAgo(84), label: 'Week 1 — Start', placeholder: true },
    { date: daysAgo(42), label: 'Week 6 — Midpoint', placeholder: true },
    { date: daysAgo(0), label: 'Week 12 — Today', placeholder: true },
  ],
}

// ─── 8. AI Predictions ────────────────────────────────────────────────────────

export const demoPredictions = {
  goalDate: (() => {
    const d = new Date(today)
    d.setDate(d.getDate() + 112) // ~16 weeks to reach 76 kg
    return d.toISOString().split('T')[0]
  })(),
  weightPrediction: Array.from({ length: 16 }, (_, i) => ({
    week: i + 1,
    predicted_kg: Math.max(76, 84 - i * 0.5),
    lower_bound: Math.max(75, 84 - i * 0.5 - 0.8),
    upper_bound: Math.min(85, 84 - i * 0.5 + 0.8),
  })),
  strengthMilestones: [
    { exercise: 'Bench Press', current: 80, milestone: 100, eta_weeks: 18, confidence: 0.82 },
    { exercise: 'Squat', current: 105, milestone: 140, eta_weeks: 22, confidence: 0.78 },
    { exercise: 'Deadlift', current: 127.5, milestone: 160, eta_weeks: 20, confidence: 0.80 },
  ],
  insights: [
    'At your current rate, you will reach your goal weight of 76 kg in approximately 16 weeks.',
    'Your bench press is progressing faster than average — you are on track to hit 100 kg in 18 weeks.',
    'Your sleep quality on workout days averages 7.6 hours, which is optimal for muscle recovery.',
    'Your Metformin prescription has been factored into all calorie and cardio predictions.',
  ],
}

// ─── 9. AI Coach ──────────────────────────────────────────────────────────────

export const demoAICoach = {
  recentMessages: [
    {
      role: 'user',
      content: 'Is it safe to do HIIT while taking Metformin?',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      role: 'assistant',
      content: 'Great question, Alex. Because you\'re on Metformin 500mg twice daily, high-intensity cardio can cause your blood glucose to drop more sharply than it would otherwise. I\'d recommend keeping HIIT sessions to 20–25 minutes maximum, always eating a small carb-containing snack 30 minutes before, and monitoring how you feel during the session. A moderate-intensity session (Zone 2 cardio) is a safer and equally effective option for fat loss on your current medication. Your current PPL plan already accounts for this — your cardio days are programmed at moderate intensity for exactly this reason.',
      timestamp: new Date(Date.now() - 3500000).toISOString(),
    },
    {
      role: 'user',
      content: 'How much protein should I eat on rest days?',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      role: 'assistant',
      content: 'On rest days, your protein target stays the same — 165g per day. Muscle protein synthesis continues for 24–48 hours after a workout, so rest days are actually when a lot of the repair and growth happens. Dropping protein on rest days is one of the most common mistakes intermediate lifters make. Your carbs can come down slightly (around 160–170g instead of 198g) since you\'re not fuelling a workout, but keep protein consistent.',
      timestamp: new Date(Date.now() - 1700000).toISOString(),
    },
  ],
  suggestedQuestions: [
    'What should I eat before a morning workout?',
    'How do I break through a bench press plateau?',
    'Is my sleep affecting my fat loss?',
    'Can I take Omega-3 and Vitamin D at the same time?',
  ],
}

// ─── 10. Form Analysis ────────────────────────────────────────────────────────

export const demoFormAnalysis = {
  recentAnalyses: [
    {
      id: 1,
      exercise: 'Squat',
      date: daysAgo(2),
      score: 78,
      reps_analysed: 5,
      feedback: [
        { type: 'warning', text: 'Knees caving inward on reps 3 and 4 — focus on pushing knees out over toes.' },
        { type: 'success', text: 'Depth is good — consistently hitting parallel.' },
        { type: 'info', text: 'Bar path is slightly forward. Try keeping your chest up throughout the movement.' },
      ],
      improvement_from_last: +6,
    },
    {
      id: 2,
      exercise: 'Bench Press',
      date: daysAgo(5),
      score: 85,
      reps_analysed: 6,
      feedback: [
        { type: 'success', text: 'Excellent elbow tuck — great for shoulder health.' },
        { type: 'success', text: 'Consistent bar path and good leg drive.' },
        { type: 'warning', text: 'Slight wrist extension on heavier sets. Consider wrist wraps.' },
      ],
      improvement_from_last: +3,
    },
  ],
  availableExercises: [
    'Squat', 'Bench Press', 'Deadlift', 'Overhead Press',
    'Barbell Row', 'Pull-Up', 'Lunge', 'Romanian Deadlift',
  ],
}

// ─── Convenience export: all demo data in one object ─────────────────────────

export const demoData = {
  profile: demoProfile,
  dashboard: demoDashboard,
  nutrition: demoNutrition,
  fitness: demoFitness,
  medications: demoMedications,
  dailyTracker: demoDailyTracker,
  progress: demoProgress,
  predictions: demoPredictions,
  aiCoach: demoAICoach,
  formAnalysis: demoFormAnalysis,
}

export default demoData
