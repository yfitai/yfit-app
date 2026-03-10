import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx'
import { 
  Activity, Target, Ruler, User, ChevronRight, ChevronLeft, 
  CheckCircle, Dumbbell, Apple, Pill, BarChart3, Zap 
} from 'lucide-react'

const TOTAL_STEPS = 5

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise', icon: '🪑' },
  { value: 'lightly_active', label: 'Lightly Active', desc: '1–3 days/week', icon: '🚶' },
  { value: 'moderately_active', label: 'Moderately Active', desc: '3–5 days/week', icon: '🏃' },
  { value: 'very_active', label: 'Very Active', desc: '6–7 days/week', icon: '💪' },
  { value: 'extra_active', label: 'Extra Active', desc: 'Physical job + exercise', icon: '🔥' },
]

const GOAL_TYPES = [
  { value: 'lose_weight', label: 'Lose Weight', icon: '⚖️', desc: 'Reduce body fat' },
  { value: 'maintain', label: 'Maintain Weight', icon: '🎯', desc: 'Stay at current weight' },
  { value: 'gain_weight', label: 'Gain Weight', icon: '📈', desc: 'Build mass' },
  { value: 'build_muscle', label: 'Build Muscle', icon: '💪', desc: 'Recomposition' },
]

export default function OnboardingWizard({ user, onComplete }) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Basic info
  const [firstName, setFirstName] = useState(user?.user_metadata?.first_name || '')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')

  // Step 2: Body measurements
  const [unitSystem, setUnitSystem] = useState('imperial')
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightLbs, setWeightLbs] = useState('')
  const [weightKg, setWeightKg] = useState('')

  // Step 3: Goals
  const [goalType, setGoalType] = useState('')
  const [targetWeightLbs, setTargetWeightLbs] = useState('')
  const [targetWeightKg, setTargetWeightKg] = useState('')
  const [activityLevel, setActivityLevel] = useState('')

  // Step 4: Features tour (no data needed, just display)

  const progressPct = ((step - 1) / (TOTAL_STEPS - 1)) * 100

  const getWeightKg = () => {
    if (unitSystem === 'imperial') return parseFloat(weightLbs) / 2.20462
    return parseFloat(weightKg)
  }

  const getHeightCm = () => {
    if (unitSystem === 'imperial') {
      return (parseInt(heightFt) * 12 + parseInt(heightIn || 0)) * 2.54
    }
    return parseFloat(heightCm)
  }

  const getTargetWeightKg = () => {
    if (unitSystem === 'imperial') return parseFloat(targetWeightLbs) / 2.20462
    return parseFloat(targetWeightKg)
  }

  const validateStep = () => {
    setError('')
    if (step === 1) {
      if (!firstName.trim()) return setError('Please enter your first name') || false
      if (!age || parseInt(age) < 13 || parseInt(age) > 120) return setError('Please enter a valid age (13–120)') || false
      if (!gender) return setError('Please select your biological sex') || false
    }
    if (step === 2) {
      if (unitSystem === 'imperial') {
        if (!heightFt || parseInt(heightFt) < 3 || parseInt(heightFt) > 8) return setError('Please enter a valid height') || false
        if (!weightLbs || parseFloat(weightLbs) < 50 || parseFloat(weightLbs) > 700) return setError('Please enter a valid weight') || false
      } else {
        if (!heightCm || parseFloat(heightCm) < 100 || parseFloat(heightCm) > 250) return setError('Please enter a valid height') || false
        if (!weightKg || parseFloat(weightKg) < 20 || parseFloat(weightKg) > 320) return setError('Please enter a valid weight') || false
      }
    }
    if (step === 3) {
      if (!goalType) return setError('Please select your primary goal') || false
      if (!activityLevel) return setError('Please select your activity level') || false
    }
    return true
  }

  const handleNext = () => {
    if (!validateStep()) return
    setStep(s => s + 1)
  }

  const handleBack = () => {
    setError('')
    setStep(s => s - 1)
  }

  const handleComplete = async () => {
    setSaving(true)
    setError('')
    try {
      const weightKgVal = getWeightKg()
      const heightCmVal = getHeightCm()
      const targetWtKg = goalType !== 'maintain' ? getTargetWeightKg() : weightKgVal

      // Save goals
      await supabase.from('user_goals').upsert({
        user_id: user.id,
        age: parseInt(age),
        height_cm: heightCmVal,
        weight_kg: weightKgVal,
        gender,
        activity_level: activityLevel,
        goal_type: goalType,
        target_weight_kg: targetWtKg,
        starting_weight_kg: weightKgVal,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

      // Save initial body measurement
      await supabase.from('body_measurements').insert({
        user_id: user.id,
        weight_kg: weightKgVal,
        height_cm: heightCmVal,
        measurement_date: new Date().toISOString().split('T')[0]
      })

      // Mark onboarding complete
      await supabase.from('user_profiles').upsert({
        user_id: user.id,
        full_name: firstName,
        onboarding_completed: true,
        onboarding_step: TOTAL_STEPS,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

      onComplete()
    } catch (err) {
      setError('Something went wrong saving your profile. Please try again.')
      console.error(err)
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm mb-4">
            <Activity className="w-5 h-5 text-green-600" />
            <span className="font-bold text-gray-800">YFIT AI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Let's set up your profile</h1>
          <p className="text-gray-500 text-sm mt-1">Step {step} of {TOTAL_STEPS}</p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <Card className="shadow-lg">
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>About You</CardTitle>
                    <CardDescription>Basic info to personalize your experience</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input 
                    value={firstName} 
                    onChange={e => setFirstName(e.target.value)} 
                    placeholder="Your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input 
                    type="number" 
                    value={age} 
                    onChange={e => setAge(e.target.value)} 
                    placeholder="e.g. 35"
                    min="13" max="120"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Biological Sex</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {['male', 'female'].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`p-3 rounded-lg border-2 text-sm font-medium capitalize transition-all ${
                          gender === g 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {g === 'male' ? '♂ Male' : '♀ Female'}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* STEP 2: Body Measurements */}
          {step === 2 && (
            <>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Ruler className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Your Measurements</CardTitle>
                    <CardDescription>Used to calculate your calorie needs</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Unit toggle */}
                <div className="flex rounded-lg overflow-hidden border border-gray-200">
                  {['imperial', 'metric'].map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnitSystem(u)}
                      className={`flex-1 py-2 text-sm font-medium transition-all ${
                        unitSystem === u 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {u === 'imperial' ? '🇺🇸 Imperial (lbs/ft)' : '🌍 Metric (kg/cm)'}
                    </button>
                  ))}
                </div>

                {unitSystem === 'imperial' ? (
                  <>
                    <div className="space-y-2">
                      <Label>Height</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <Input type="number" value={heightFt} onChange={e => setHeightFt(e.target.value)} placeholder="5" min="3" max="8" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">ft</span>
                        </div>
                        <div className="relative">
                          <Input type="number" value={heightIn} onChange={e => setHeightIn(e.target.value)} placeholder="10" min="0" max="11" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">in</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Current Weight</Label>
                      <div className="relative">
                        <Input type="number" value={weightLbs} onChange={e => setWeightLbs(e.target.value)} placeholder="180" min="50" max="700" step="0.1" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">lbs</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Height</Label>
                      <div className="relative">
                        <Input type="number" value={heightCm} onChange={e => setHeightCm(e.target.value)} placeholder="178" min="100" max="250" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">cm</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Current Weight</Label>
                      <div className="relative">
                        <Input type="number" value={weightKg} onChange={e => setWeightKg(e.target.value)} placeholder="82" min="20" max="320" step="0.1" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">kg</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </>
          )}

          {/* STEP 3: Goals & Activity */}
          {step === 3 && (
            <>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Target className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle>Your Goals</CardTitle>
                    <CardDescription>What are you working toward?</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Primary Goal</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {GOAL_TYPES.map(g => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => setGoalType(g.value)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          goalType === g.value 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-lg mb-1">{g.icon}</div>
                        <div className="text-sm font-medium">{g.label}</div>
                        <div className="text-xs text-gray-500">{g.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {goalType && goalType !== 'maintain' && (
                  <div className="space-y-2">
                    <Label>Target Weight</Label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        value={unitSystem === 'imperial' ? targetWeightLbs : targetWeightKg}
                        onChange={e => unitSystem === 'imperial' ? setTargetWeightLbs(e.target.value) : setTargetWeightKg(e.target.value)}
                        placeholder={unitSystem === 'imperial' ? '160' : '73'}
                        step="0.1"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        {unitSystem === 'imperial' ? 'lbs' : 'kg'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Activity Level</Label>
                  <div className="space-y-2">
                    {ACTIVITY_LEVELS.map(a => (
                      <button
                        key={a.value}
                        type="button"
                        onClick={() => setActivityLevel(a.value)}
                        className={`w-full p-3 rounded-lg border-2 text-left flex items-center gap-3 transition-all ${
                          activityLevel === a.value 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xl">{a.icon}</span>
                        <div>
                          <div className="text-sm font-medium">{a.label}</div>
                          <div className="text-xs text-gray-500">{a.desc}</div>
                        </div>
                        {activityLevel === a.value && <CheckCircle className="w-4 h-4 text-blue-500 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* STEP 4: Feature Tour */}
          {step === 4 && (
            <>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>What YFIT Can Do</CardTitle>
                    <CardDescription>Here's what's waiting for you</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { icon: <Apple className="w-5 h-5 text-green-600" />, bg: 'bg-green-100', title: 'AI Nutrition Scanner', desc: 'Scan food labels or search 900K+ foods to log meals instantly' },
                    { icon: <Dumbbell className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-100', title: 'Smart Workout Tracking', desc: 'Log exercises, sets, and reps with AI form coaching' },
                    { icon: <Pill className="w-5 h-5 text-orange-600" />, bg: 'bg-orange-100', title: 'Medication Manager', desc: 'Track prescriptions, supplements, and daily adherence' },
                    { icon: <BarChart3 className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-100', title: 'AI Predictions', desc: 'See your goal date, TDEE, and body recomposition forecast' },
                    { icon: <Activity className="w-5 h-5 text-red-600" />, bg: 'bg-red-100', title: 'Daily Health Tracker', desc: 'Log water, sleep, blood pressure, glucose, and mood' },
                  ].map((f, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                      <div className={`w-9 h-9 rounded-lg ${f.bg} flex items-center justify-center flex-shrink-0`}>
                        {f.icon}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{f.title}</div>
                        <div className="text-xs text-gray-500">{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </>
          )}

          {/* STEP 5: All done */}
          {step === 5 && (
            <>
              <CardHeader>
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl">You're all set, {firstName}!</CardTitle>
                  <CardDescription className="mt-2">
                    Your personalized YFIT profile is ready. Start by logging today's meals or checking out your AI predictions.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">
                    🎉 Welcome to the <strong>YFIT Beta</strong>! Your feedback helps shape the app. 
                    Use the <strong>feedback button</strong> (bottom-right) to report bugs or suggest features anytime.
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 p-6 pt-0">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
            {step < TOTAL_STEPS - 1 && (
              <Button onClick={handleNext} className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            {step === TOTAL_STEPS - 1 && (
              <Button onClick={handleNext} className="flex-1 bg-gradient-to-r from-blue-600 to-green-600">
                See Features <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            {step === TOTAL_STEPS && (
              <Button 
                onClick={handleComplete} 
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {saving ? 'Saving...' : '🚀 Start Using YFIT'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
