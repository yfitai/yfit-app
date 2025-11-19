import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, TrendingDown, Target, Calendar, Activity, AlertTriangle,
  Heart, Pill, Apple, Dumbbell, Scale, Flame, Brain, Award, Clock
} from 'lucide-react';

export default function PredictionsUnified({ user }) {
  const [loading, setLoading] = useState(true);
  const [weightData, setWeightData] = useState([]);
  const [workoutData, setWorkoutData] = useState([]);
  const [nutritionData, setNutritionData] = useState([]);
  const [medicationData, setMedicationData] = useState([]);
  
  const [predictions, setPredictions] = useState({
    weightLoss: null,
    tdee: null,
    medicationAdherence: null,
    nutritionPatterns: null,
    injuryRisk: null,
    deloadWeek: null
  });

  useEffect(() => {
    if (user && user.id !== 'demo-user-id') {
      fetchAllData();
    } else if (user && user.id === 'demo-user-id') {
      // Demo mode - skip data fetching
      setLoading(false);
    }
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchWeightData(),
        fetchWorkoutData(),
        fetchNutritionData(),
        fetchMedicationData()
      ]);
      
      // Calculate all predictions after data is loaded
      calculateAllPredictions();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeightData = async () => {
    try {
      const { data, error } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      setWeightData(data || []);
    } catch (error) {
      console.error('Error fetching weight data:', error);
      setWeightData([]);
    }
  };

  const fetchWorkoutData = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      setWorkoutData(data || []);
    } catch (error) {
      console.error('Error fetching workout data:', error);
      setWorkoutData([]);
    }
  };

  const fetchNutritionData = async () => {
    try {
      const { data, error } = await supabase
        .from('nutrition_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      setNutritionData(data || []);
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      setNutritionData([]);
    }
  };

  const fetchMedicationData = async () => {
    try {
      const { data, error } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_time', { ascending: false })
        .limit(60);
      
      if (error) throw error;
      setMedicationData(data || []);
    } catch (error) {
      console.error('Error fetching medication data:', error);
      setMedicationData([]);
    }
  };

  const calculateAllPredictions = () => {
    setPredictions({
      weightLoss: calculateWeightLossPrediction(),
      tdee: calculateTDEE(),
      medicationAdherence: predictMedicationAdherence(),
      nutritionPatterns: analyzeNutritionPatterns(),
      injuryRisk: assessInjuryRisk(),
      deloadWeek: predictDeloadWeek()
    });
  };

  // 1. Weight Loss Prediction
  const calculateWeightLossPrediction = () => {
    if (weightData.length < 3) return null;

    try {
      const sortedWeights = [...weightData].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Calculate weekly weight change rate
      const firstWeight = parseFloat(sortedWeights[0].weight);
      const lastWeight = parseFloat(sortedWeights[sortedWeights.length - 1].weight);
      const firstDate = new Date(sortedWeights[0].date).getTime();
      const lastDate = new Date(sortedWeights[sortedWeights.length - 1].date).getTime();
      
      const daysBetween = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
      const weeklyChange = ((lastWeight - firstWeight) / daysBetween) * 7;

      // Assume goal is 10% weight loss
      const goalWeight = firstWeight * 0.9;
      const remainingWeight = lastWeight - goalWeight;
      const weeksToGoal = Math.abs(remainingWeight / weeklyChange);

      // Calculate metabolic adaptation (weight loss slows over time)
      const adaptationFactor = 0.95; // 5% slowdown per month
      const adjustedWeeks = weeksToGoal * (1 + (weeksToGoal / 4) * (1 - adaptationFactor));

      const goalDate = new Date(Date.now() + adjustedWeeks * 7 * 24 * 60 * 60 * 1000);

      return {
        currentWeight: Math.round(lastWeight * 10) / 10,
        goalWeight: Math.round(goalWeight * 10) / 10,
        weeklyChange: Math.round(weeklyChange * 10) / 10,
        weeksToGoal: Math.round(adjustedWeeks),
        goalDate: goalDate.toLocaleDateString(),
        trend: weeklyChange < 0 ? 'losing' : weeklyChange > 0 ? 'gaining' : 'stable',
        confidence: Math.min(95, 50 + (weightData.length * 3))
      };
    } catch (error) {
      console.error('Error calculating weight loss:', error);
      return null;
    }
  };

  // 2. TDEE Calculation
  const calculateTDEE = () => {
    if (weightData.length < 7 || nutritionData.length < 7) return null;

    try {
      // Calculate average daily calorie intake
      const avgCalories = nutritionData.reduce((sum, log) => 
        sum + (parseFloat(log.calories) || 0), 0) / nutritionData.length;

      // Calculate weight change over period
      const sortedWeights = [...weightData].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      const weightChange = parseFloat(sortedWeights[sortedWeights.length - 1].weight) - 
                          parseFloat(sortedWeights[0].weight);
      const days = (new Date(sortedWeights[sortedWeights.length - 1].date).getTime() - 
                   new Date(sortedWeights[0].date).getTime()) / (1000 * 60 * 60 * 24);

      // 1 lb = 3500 calories
      const caloriesDelta = (weightChange * 3500) / days;
      const tdee = Math.round(avgCalories - caloriesDelta);

      // Activity level classification
      const workoutsPerWeek = (workoutData.length / days) * 7;
      let activityLevel = 'sedentary';
      if (workoutsPerWeek >= 5) activityLevel = 'very active';
      else if (workoutsPerWeek >= 3) activityLevel = 'active';
      else if (workoutsPerWeek >= 1) activityLevel = 'lightly active';

      return {
        tdee,
        avgCalories: Math.round(avgCalories),
        activityLevel,
        workoutsPerWeek: Math.round(workoutsPerWeek * 10) / 10,
        maintenanceRange: {
          min: Math.round(tdee * 0.95),
          max: Math.round(tdee * 1.05)
        },
        deficit: {
          mild: Math.round(tdee * 0.9),
          moderate: Math.round(tdee * 0.8),
          aggressive: Math.round(tdee * 0.7)
        },
        surplus: {
          lean: Math.round(tdee * 1.1),
          bulk: Math.round(tdee * 1.2)
        }
      };
    } catch (error) {
      console.error('Error calculating TDEE:', error);
      return null;
    }
  };

  // 3. Medication Adherence Prediction
  const predictMedicationAdherence = () => {
    if (medicationData.length < 14) return null;

    try {
      const taken = medicationData.filter(log => log.taken).length;
      const total = medicationData.length;
      const adherenceRate = (taken / total) * 100;

      // Analyze patterns
      const byDayOfWeek = {};
      const byTimeOfDay = {};
      
      medicationData.forEach(log => {
        const date = new Date(log.scheduled_time);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
        const hour = date.getHours();
        
        if (!byDayOfWeek[dayOfWeek]) byDayOfWeek[dayOfWeek] = { taken: 0, total: 0 };
        if (!byTimeOfDay[hour]) byTimeOfDay[hour] = { taken: 0, total: 0 };
        
        byDayOfWeek[dayOfWeek].total++;
        byTimeOfDay[hour].total++;
        
        if (log.taken) {
          byDayOfWeek[dayOfWeek].taken++;
          byTimeOfDay[hour].taken++;
        }
      });

      // Find worst day and time
      let worstDay = null;
      let worstDayRate = 100;
      Object.entries(byDayOfWeek).forEach(([day, stats]) => {
        const rate = (stats.taken / stats.total) * 100;
        if (rate < worstDayRate) {
          worstDayRate = rate;
          worstDay = day;
        }
      });

      let worstHour = null;
      let worstHourRate = 100;
      Object.entries(byTimeOfDay).forEach(([hour, stats]) => {
        const rate = (stats.taken / stats.total) * 100;
        if (rate < worstHourRate) {
          worstHourRate = rate;
          worstHour = hour;
        }
      });

      return {
        adherenceRate: Math.round(adherenceRate),
        taken,
        total,
        status: adherenceRate >= 90 ? 'excellent' : adherenceRate >= 75 ? 'good' : adherenceRate >= 50 ? 'fair' : 'poor',
        worstDay: { day: worstDay, rate: Math.round(worstDayRate) },
        worstHour: { hour: worstHour, rate: Math.round(worstHourRate) },
        recommendations: [
          adherenceRate < 90 && worstDay ? `Set extra reminders for ${worstDay}s` : null,
          adherenceRate < 90 && worstHour ? `Consider changing medication time from ${worstHour}:00` : null,
          adherenceRate < 75 ? 'Consider using a pill organizer' : null,
          adherenceRate < 50 ? 'Consult with your doctor about adherence challenges' : null
        ].filter(Boolean)
      };
    } catch (error) {
      console.error('Error predicting medication adherence:', error);
      return null;
    }
  };

  // 4. Nutrition Pattern Analysis
  const analyzeNutritionPatterns = () => {
    if (nutritionData.length < 7) return null;

    try {
      const avgMacros = {
        protein: 0,
        carbs: 0,
        fat: 0,
        calories: 0
      };

      nutritionData.forEach(log => {
        avgMacros.protein += parseFloat(log.protein_g) || 0;
        avgMacros.carbs += parseFloat(log.carbs_g) || 0;
        avgMacros.fat += parseFloat(log.fat_g) || 0;
        avgMacros.calories += parseFloat(log.calories) || 0;
      });

      Object.keys(avgMacros).forEach(key => {
        avgMacros[key] = Math.round(avgMacros[key] / nutritionData.length);
      });

      // Calculate macro ratios
      const totalMacroCalories = (avgMacros.protein * 4) + (avgMacros.carbs * 4) + (avgMacros.fat * 9);
      const ratios = {
        protein: Math.round((avgMacros.protein * 4 / totalMacroCalories) * 100),
        carbs: Math.round((avgMacros.carbs * 4 / totalMacroCalories) * 100),
        fat: Math.round((avgMacros.fat * 9 / totalMacroCalories) * 100)
      };

      // Analyze by day of week
      const byDayOfWeek = {};
      nutritionData.forEach(log => {
        const day = new Date(log.entry_date).toLocaleDateString('en-US', { weekday: 'long' });
        if (!byDayOfWeek[day]) byDayOfWeek[day] = { calories: 0, count: 0 };
        byDayOfWeek[day].calories += parseFloat(log.calories) || 0;
        byDayOfWeek[day].count++;
      });

      const dayAverages = {};
      Object.entries(byDayOfWeek).forEach(([day, data]) => {
        dayAverages[day] = Math.round(data.calories / data.count);
      });

      // Find highest and lowest days
      let highestDay = null;
      let highestCalories = 0;
      let lowestDay = null;
      let lowestCalories = Infinity;

      Object.entries(dayAverages).forEach(([day, calories]) => {
        if (calories > highestCalories) {
          highestCalories = calories;
          highestDay = day;
        }
        if (calories < lowestCalories) {
          lowestCalories = calories;
          lowestDay = day;
        }
      });

      // Generate insights
      const insights = [];
      if (ratios.protein < 25) insights.push('Consider increasing protein intake for better muscle recovery');
      if (ratios.protein > 40) insights.push('Protein intake is very high - ensure adequate carbs for energy');
      if (ratios.carbs < 30) insights.push('Low carb intake may affect workout performance');
      if (ratios.fat < 20) insights.push('Consider increasing healthy fats for hormone production');
      if (highestCalories - lowestCalories > 500) insights.push(`Calorie intake varies significantly between ${lowestDay} and ${highestDay}`);

      return {
        avgMacros,
        ratios,
        dayAverages,
        highestDay: { day: highestDay, calories: highestCalories },
        lowestDay: { day: lowestDay, calories: lowestCalories },
        consistency: Math.round(100 - ((highestCalories - lowestCalories) / avgMacros.calories * 100)),
        insights
      };
    } catch (error) {
      console.error('Error analyzing nutrition patterns:', error);
      return null;
    }
  };

  // 5. Injury Risk Assessment
  const assessInjuryRisk = () => {
    console.log('🔍 Injury Risk Debug:');
    console.log('Workout data length:', workoutData.length);
    console.log('Workout data sample:', workoutData.slice(0, 2));
    
    if (workoutData.length < 7) {
      console.log('❌ Not enough workouts for injury risk (need 7, have ' + workoutData.length + ')');
      return null;
    }

    try {
      const recentWorkouts = workoutData.slice(0, 7);
      const olderWorkouts = workoutData.slice(7, 14);

      const recentAvgVolume = recentWorkouts.reduce((sum, w) => sum + (w.total_volume || 0), 0) / recentWorkouts.length;
      const olderAvgVolume = olderWorkouts.length > 0 
        ? olderWorkouts.reduce((sum, w) => sum + (w.total_volume || 0), 0) / olderWorkouts.length 
        : recentAvgVolume;

      const volumeIncrease = ((recentAvgVolume - olderAvgVolume) / olderAvgVolume) * 100;

      // Calculate workout frequency
      const dates = workoutData.map(w => new Date(w.start_time));
      const daysBetween = (dates[0].getTime() - dates[dates.length - 1].getTime()) / (1000 * 60 * 60 * 24);
      const frequency = (workoutData.length / daysBetween) * 7;

      // Risk factors
      const riskFactors = [];
      let riskScore = 0;

      if (volumeIncrease > 30) {
        riskFactors.push('Rapid volume increase (>30%)');
        riskScore += 30;
      } else if (volumeIncrease > 20) {
        riskFactors.push('Moderate volume increase (>20%)');
        riskScore += 15;
      }

      if (frequency > 6) {
        riskFactors.push('Very high training frequency (>6x/week)');
        riskScore += 25;
      } else if (frequency > 5) {
        riskFactors.push('High training frequency (>5x/week)');
        riskScore += 10;
      }

      // Check for insufficient rest days
      const daysSinceLastWorkout = (Date.now() - dates[0].getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastWorkout < 0.5 && frequency > 5) {
        riskFactors.push('Insufficient recovery time');
        riskScore += 20;
      }

      const riskLevel = riskScore >= 50 ? 'high' : riskScore >= 25 ? 'moderate' : 'low';

      console.log('✅ Injury risk calculated:', { riskLevel, riskScore });
      
      return {
        riskLevel,
        riskScore,
        riskFactors,
        volumeIncrease: Math.round(volumeIncrease),
        frequency: Math.round(frequency * 10) / 10,
        recommendations: [
          riskScore >= 50 ? 'Consider taking 1-2 rest days immediately' : null,
          volumeIncrease > 20 ? 'Reduce training volume by 10-20% this week' : null,
          frequency > 5 ? 'Add at least one full rest day per week' : null,
          riskScore >= 25 ? 'Focus on mobility and recovery work' : null,
          riskScore < 25 ? 'Current training load is sustainable' : null
        ].filter(Boolean)
      };
    } catch (error) {
      console.error('Error assessing injury risk:', error);
      return null;
    }
  };

  // 6. Deload Week Predictor
  const predictDeloadWeek = () => {
    console.log('🔍 Deload Week Debug:');
    console.log('Workout data length:', workoutData.length);
    
    if (workoutData.length < 14) {
      console.log('❌ Not enough workouts for deload prediction (need 14, have ' + workoutData.length + ')');
      return null;
    }

    try {
      // Calculate accumulated fatigue over last 4 weeks
      const weeks = [];
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000));
        const weekEnd = new Date(Date.now() - ((i + 1) * 7 * 24 * 60 * 60 * 1000));
        
        const weekWorkouts = workoutData.filter(w => {
          const workoutDate = new Date(w.start_time);
          return workoutDate >= weekEnd && workoutDate <= weekStart;
        });

        const weekVolume = weekWorkouts.reduce((sum, w) => sum + (w.total_volume || 0), 0);
        const weekSets = weekWorkouts.reduce((sum, w) => sum + (w.total_sets || 0), 0);
        
        weeks.push({
          week: i + 1,
          volume: weekVolume,
          sets: weekSets,
          workouts: weekWorkouts.length
        });
      }

      // Calculate fatigue score (higher = more fatigued)
      const avgVolume = weeks.reduce((sum, w) => sum + w.volume, 0) / weeks.length;
      const volumeTrend = weeks[0].volume > avgVolume * 1.2 ? 'increasing' : 'stable';
      
      const totalSets = weeks.reduce((sum, w) => sum + w.sets, 0);
      const fatigueScore = totalSets / 4; // Average sets per week

      // Deload recommendation
      const weeksOfTraining = weeks.filter(w => w.workouts >= 3).length;
      const needsDeload = weeksOfTraining >= 4 || fatigueScore > 100 || volumeTrend === 'increasing';

      console.log('✅ Deload prediction calculated:', { needsDeload, fatigueScore });
      
      return {
        needsDeload,
        weeksOfTraining,
        fatigueScore: Math.round(fatigueScore),
        volumeTrend,
        lastDeload: null, // Would need to track this separately
        recommendedTiming: needsDeload ? 'This week' : weeksOfTraining >= 3 ? 'Next 1-2 weeks' : '3-4 weeks',
        deloadProtocol: {
          volumeReduction: '40-50%',
          intensityReduction: '10-20%',
          duration: '1 week',
          focus: 'Maintain intensity, reduce volume and frequency'
        },
        benefits: [
          'Allows nervous system recovery',
          'Reduces accumulated fatigue',
          'Prevents overtraining',
          'Prepares body for next training block'
        ]
      };
    } catch (error) {
      console.error('Error predicting deload week:', error);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading predictions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{background: 'linear-gradient(to bottom right, #f0fdf4, #dbeafe, #cffafe)'}}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🔮 AI Predictions</h1>
          <p className="text-gray-600">Data-driven insights and forecasts based on your health journey</p>
        </div>

        {/* Weight Loss Prediction */}
        {predictions.weightLoss ? (
          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-6 text-white mb-6">
            <div className="flex items-center mb-4">
              <Scale className="w-8 h-8 mr-3" />
              <h2 className="text-2xl font-semibold">Weight Loss Prediction</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
              <div>
                <div className="text-sm opacity-90 mb-1">Current Weight</div>
                <div className="text-3xl font-bold">{predictions.weightLoss.currentWeight} lbs</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Goal Weight</div>
                <div className="text-3xl font-bold">{predictions.weightLoss.goalWeight} lbs</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Weekly Change</div>
                <div className="text-3xl font-bold flex items-center">
                  {predictions.weightLoss.weeklyChange > 0 ? <TrendingUp className="w-6 h-6 mr-1" /> : <TrendingDown className="w-6 h-6 mr-1" />}
                  {Math.abs(predictions.weightLoss.weeklyChange)} lbs
                </div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Estimated Goal Date</div>
                <div className="text-2xl font-bold">{predictions.weightLoss.goalDate}</div>
                <div className="text-sm opacity-75">{predictions.weightLoss.weeksToGoal} weeks</div>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-sm">
              <strong>Confidence:</strong> {predictions.weightLoss.confidence}% • 
              <strong className="ml-2">Trend:</strong> {predictions.weightLoss.trend}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center mb-6">
            <Scale className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Weight Loss Prediction</h3>
            <p className="text-gray-600">Log at least 3 weight entries to see predictions</p>
          </div>
        )}

        {/* TDEE & Calorie Needs */}
        {predictions.tdee ? (
          <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-6 text-white mb-6">
            <div className="flex items-center mb-4">
              <Flame className="w-8 h-8 mr-3" />
              <h2 className="text-2xl font-semibold">Calorie Needs (TDEE)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div>
                <div className="text-sm opacity-90 mb-1">Your TDEE</div>
                <div className="text-4xl font-bold">{predictions.tdee.tdee}</div>
                <div className="text-sm opacity-75">calories/day</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Current Intake</div>
                <div className="text-4xl font-bold">{predictions.tdee.avgCalories}</div>
                <div className="text-sm opacity-75">calories/day</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Activity Level</div>
                <div className="text-2xl font-bold capitalize">{predictions.tdee.activityLevel}</div>
                <div className="text-sm opacity-75">{predictions.tdee.workoutsPerWeek}x/week</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg p-3">
                <div className="font-semibold mb-2">Weight Loss</div>
                <div className="text-sm">Mild: {predictions.tdee.deficit.mild} cal</div>
                <div className="text-sm">Moderate: {predictions.tdee.deficit.moderate} cal</div>
                <div className="text-sm">Aggressive: {predictions.tdee.deficit.aggressive} cal</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="font-semibold mb-2">Maintenance</div>
                <div className="text-sm">{predictions.tdee.maintenanceRange.min} - {predictions.tdee.maintenanceRange.max} cal</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="font-semibold mb-2">Muscle Gain</div>
                <div className="text-sm">Lean: {predictions.tdee.surplus.lean} cal</div>
                <div className="text-sm">Bulk: {predictions.tdee.surplus.bulk} cal</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center mb-6">
            <Flame className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Calorie Needs (TDEE)</h3>
            <p className="text-gray-600">Log 7+ days of weight and nutrition to calculate TDEE</p>
          </div>
        )}

        {/* Injury Risk Assessment */}
        {predictions.injuryRisk ? (
          <div className={`bg-gradient-to-r ${
            predictions.injuryRisk.riskLevel === 'high' ? 'from-red-600 to-pink-600' :
            predictions.injuryRisk.riskLevel === 'moderate' ? 'from-yellow-600 to-orange-600' :
            'from-green-600 to-emerald-600'
          } rounded-lg p-6 text-white mb-6`}>
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-8 h-8 mr-3" />
              <h2 className="text-2xl font-semibold">Injury Risk Assessment</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div>
                <div className="text-sm opacity-90 mb-1">Risk Level</div>
                <div className="text-4xl font-bold capitalize">{predictions.injuryRisk.riskLevel}</div>
                <div className="text-sm opacity-75">Score: {predictions.injuryRisk.riskScore}/100</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Volume Change</div>
                <div className="text-4xl font-bold">{predictions.injuryRisk.volumeIncrease > 0 ? '+' : ''}{predictions.injuryRisk.volumeIncrease}%</div>
                <div className="text-sm opacity-75">Last 7 days vs previous</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Training Frequency</div>
                <div className="text-4xl font-bold">{predictions.injuryRisk.frequency}x</div>
                <div className="text-sm opacity-75">per week</div>
              </div>
            </div>
            {predictions.injuryRisk.riskFactors.length > 0 && (
              <div className="bg-white/10 rounded-lg p-4 mb-4">
                <div className="font-semibold mb-2">Risk Factors:</div>
                <ul className="space-y-1 text-sm">
                  {predictions.injuryRisk.riskFactors.map((factor, i) => (
                    <li key={i}>• {factor}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="bg-white/10 rounded-lg p-4">
              <div className="font-semibold mb-2">Recommendations:</div>
              <ul className="space-y-1 text-sm">
                {predictions.injuryRisk.recommendations.map((rec, i) => (
                  <li key={i}>• {rec}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center mb-6">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Injury Risk Assessment</h3>
            <p className="text-gray-600">Log 7+ workouts to assess injury risk</p>
          </div>
        )}

        {/* Deload Week Predictor */}
        {predictions.deloadWeek ? (
          <div className={`bg-gradient-to-r ${
            predictions.deloadWeek.needsDeload ? 'from-purple-600 to-pink-600' : 'from-blue-600 to-cyan-600'
          } rounded-lg p-6 text-white mb-6`}>
            <div className="flex items-center mb-4">
              <Activity className="w-8 h-8 mr-3" />
              <h2 className="text-2xl font-semibold">Deload Week Predictor</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div>
                <div className="text-sm opacity-90 mb-1">Status</div>
                <div className="text-3xl font-bold">{predictions.deloadWeek.needsDeload ? '⚠️ Deload Needed' : '✅ On Track'}</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Fatigue Score</div>
                <div className="text-4xl font-bold">{predictions.deloadWeek.fatigueScore}</div>
                <div className="text-sm opacity-75">avg sets/week</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Recommended Timing</div>
                <div className="text-2xl font-bold">{predictions.deloadWeek.recommendedTiming}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="font-semibold mb-2">Deload Protocol:</div>
                <div className="text-sm">Volume: Reduce by {predictions.deloadWeek.deloadProtocol.volumeReduction}</div>
                <div className="text-sm">Intensity: Reduce by {predictions.deloadWeek.deloadProtocol.intensityReduction}</div>
                <div className="text-sm">Duration: {predictions.deloadWeek.deloadProtocol.duration}</div>
                <div className="text-sm mt-2 italic">{predictions.deloadWeek.deloadProtocol.focus}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="font-semibold mb-2">Benefits:</div>
                <ul className="space-y-1 text-sm">
                  {predictions.deloadWeek.benefits.map((benefit, i) => (
                    <li key={i}>• {benefit}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="text-sm opacity-75">
              Weeks of training: {predictions.deloadWeek.weeksOfTraining} • Volume trend: {predictions.deloadWeek.volumeTrend}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center mb-6">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Deload Week Predictor</h3>
            <p className="text-gray-600">Log 14+ workouts to predict deload timing</p>
          </div>
        )}

        {/* Medication Adherence */}
        {predictions.medicationAdherence ? (
          <div className={`bg-gradient-to-r ${
            predictions.medicationAdherence.status === 'excellent' ? 'from-green-600 to-emerald-600' :
            predictions.medicationAdherence.status === 'good' ? 'from-blue-600 to-cyan-600' :
            predictions.medicationAdherence.status === 'fair' ? 'from-yellow-600 to-orange-600' :
            'from-red-600 to-pink-600'
          } rounded-lg p-6 text-white mb-6`}>
            <div className="flex items-center mb-4">
              <Pill className="w-8 h-8 mr-3" />
              <h2 className="text-2xl font-semibold">Medication Adherence</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div>
                <div className="text-sm opacity-90 mb-1">Adherence Rate</div>
                <div className="text-4xl font-bold">{predictions.medicationAdherence.adherenceRate}%</div>
                <div className="text-sm opacity-75 capitalize">{predictions.medicationAdherence.status}</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Doses Taken</div>
                <div className="text-4xl font-bold">{predictions.medicationAdherence.taken}/{predictions.medicationAdherence.total}</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Worst Day</div>
                <div className="text-2xl font-bold">{predictions.medicationAdherence.worstDay.day}</div>
                <div className="text-sm opacity-75">{predictions.medicationAdherence.worstDay.rate}% adherence</div>
              </div>
            </div>
            {predictions.medicationAdherence.recommendations.length > 0 && (
              <div className="bg-white/10 rounded-lg p-4">
                <div className="font-semibold mb-2">Recommendations:</div>
                <ul className="space-y-1 text-sm">
                  {predictions.medicationAdherence.recommendations.map((rec, i) => (
                    <li key={i}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center mb-6">
            <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Medication Adherence</h3>
            <p className="text-gray-600">Log 14+ medication doses to analyze adherence</p>
          </div>
        )}

        {/* Nutrition Patterns */}
        {predictions.nutritionPatterns ? (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white mb-6">
            <div className="flex items-center mb-4">
              <Apple className="w-8 h-8 mr-3" />
              <h2 className="text-2xl font-semibold">Nutrition Pattern Analysis</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
              <div>
                <div className="text-sm opacity-90 mb-1">Avg Calories</div>
                <div className="text-3xl font-bold">{predictions.nutritionPatterns.avgMacros.calories}</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Protein</div>
                <div className="text-3xl font-bold">{predictions.nutritionPatterns.avgMacros.protein}g</div>
                <div className="text-sm opacity-75">{predictions.nutritionPatterns.ratios.protein}%</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Carbs</div>
                <div className="text-3xl font-bold">{predictions.nutritionPatterns.avgMacros.carbs}g</div>
                <div className="text-sm opacity-75">{predictions.nutritionPatterns.ratios.carbs}%</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Fat</div>
                <div className="text-3xl font-bold">{predictions.nutritionPatterns.avgMacros.fat}g</div>
                <div className="text-sm opacity-75">{predictions.nutritionPatterns.ratios.fat}%</div>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <div className="font-semibold mb-2">Day-to-Day Consistency: {predictions.nutritionPatterns.consistency}%</div>
              <div className="text-sm">Highest: {predictions.nutritionPatterns.highestDay.day} ({predictions.nutritionPatterns.highestDay.calories} cal)</div>
              <div className="text-sm">Lowest: {predictions.nutritionPatterns.lowestDay.day} ({predictions.nutritionPatterns.lowestDay.calories} cal)</div>
            </div>
            {predictions.nutritionPatterns.insights.length > 0 && (
              <div className="bg-white/10 rounded-lg p-4">
                <div className="font-semibold mb-2">Insights:</div>
                <ul className="space-y-1 text-sm">
                  {predictions.nutritionPatterns.insights.map((insight, i) => (
                    <li key={i}>• {insight}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center mb-6">
            <Apple className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nutrition Pattern Analysis</h3>
            <p className="text-gray-600">Log 7+ days of nutrition to analyze patterns</p>
          </div>
        )}

        {/* Info Footer */}
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <Brain className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All Predictions are FREE</h3>
          <p className="text-gray-600">
            Powered by statistical analysis and machine learning algorithms. 
            Predictions become more accurate as you log more data.
          </p>
        </div>
      </div>
    </div>
  );
}
