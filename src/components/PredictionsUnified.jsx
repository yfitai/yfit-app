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
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    if (user) {
      fetchAllData();
    }
  }, [user]);  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch data and get results directly
      const [weightResults, workoutResults, nutritionResults, medicationResults] = await Promise.all([
        fetchWeightData(),
        fetchWorkoutData(),
        fetchNutritionData(),
        fetchMedicationData()
      ]);
      
      console.log('📊 Data fetched:', {
        weight: weightResults.length,
        workouts: workoutResults.length,
        nutrition: nutritionResults.length,
        medication: medicationResults.length
      });
      
      // Calculate predictions with fetched data (not state)
      calculatePredictionsDirectly(weightResults, workoutResults, nutritionResults, medicationResults);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeightData = async () => {
    try {
      const { data, error } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('user_id', user.id)
        .order('measurement_date', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      setWeightData(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching weight data:', error);
      setWeightData([]);
      return [];
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
      return data || [];
    } catch (error) {
      console.error('Error fetching workout data:', error);
      setWorkoutData([]);
      return [];
    }
  };

  const fetchNutritionData = async () => {
    try {
      const { data, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      setNutritionData(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      setNutritionData([]);
      return [];
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
      return data || [];
    } catch (error) {
      console.error('Error fetching medication data:', error);
      setMedicationData([]);
      return [];
    }
  };

  const calculatePredictionsDirectly = (wData, woData, nData, mData) => {
    console.log('🧮 Calculating predictions with:', { wData: wData.length, woData: woData.length, nData: nData.length, mData: mData.length });
    
    // Check for compressed data (workouts within short timeframe)
    let isCompressedData = false;
    if (woData.length >= 5) {
      const dates = woData.map(w => new Date(w.start_time));
      const daysBetween = (dates[0].getTime() - dates[dates.length - 1].getTime()) / (1000 * 60 * 60 * 24);
      if (daysBetween < 7) {
        isCompressedData = true;
        console.log('⚠️ Compressed data detected: ' + woData.length + ' workouts in ' + daysBetween.toFixed(1) + ' days');
      }
    }
    setPredictions({
      // Phase 1
      weightLoss: calculateWeightLossPrediction(wData),
      tdee: calculateTDEE(wData, woData, nData),
      medicationAdherence: predictMedicationAdherence(mData),
      nutritionPatterns: analyzeNutritionPatterns(nData),
      injuryRisk: assessInjuryRisk(woData),
      deloadWeek: predictDeloadWeek(woData),
      // Phase 2
      optimalTime: analyzeOptimalTrainingTime(woData),
      sleepImpact: analyzeSleepImpact([], woData), // No sleep data yet
      bodyRecomp: forecastBodyRecomposition(wData, woData, nData),
      habitStreak: predictHabitStreak(woData),
      bpGoal: predictBPGoal(wData),
      glucoseGoal: predictGlucoseGoal(wData),
      isCompressedData // Add flag for UI
    });
  };

  const calculateAllPredictions = () => {
    setPredictions({
      weightLoss: calculateWeightLossPrediction(weightData),
      tdee: calculateTDEE(weightData, workoutData, nutritionData),
      medicationAdherence: predictMedicationAdherence(medicationData),
      nutritionPatterns: analyzeNutritionPatterns(nutritionData),
      injuryRisk: assessInjuryRisk(workoutData),
      deloadWeek: predictDeloadWeek(workoutData)
    });
  };

  // 1. Weight Loss Prediction
  const calculateWeightLossPrediction = (data = weightData) => {
    if (data.length < 3) return null;

    try {
      const sortedWeights = [...data].sort((a, b) => 
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
        confidence: Math.min(95, 50 + (data.length * 3))
      };
    } catch (error) {
      console.error('Error calculating weight loss:', error);
      return null;
    }
  };

  // 2. TDEE Calculation
  const calculateTDEE = (wData = weightData, woData = workoutData, nData = nutritionData) => {
    if (wData.length < 7 || nData.length < 7) return null;

    try {
      // Calculate average daily calorie intake
      const avgCalories = nData.reduce((sum, log) => 
        sum + (parseFloat(log.calories) || 0), 0) / nData.length;

      // Calculate weight change over period
      const sortedWeights = [...wData].sort((a, b) => 
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
      const workoutsPerWeek = (woData.length / days) * 7;
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
  const predictMedicationAdherence = (data = medicationData) => {
    if (data.length < 14) return null;

    try {
      const taken = data.filter(log => log.taken).length;
      const total = data.length;
      const adherenceRate = (taken / total) * 100;

      // Analyze patterns
      const byDayOfWeek = {};
      const byTimeOfDay = {};
      
      data.forEach(log => {
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
  const analyzeNutritionPatterns = (data = nutritionData) => {
    if (data.length < 7) return null;

    try {
      const avgMacros = {
        protein: 0,
        carbs: 0,
        fat: 0,
        calories: 0
      };

      data.forEach(log => {
        avgMacros.protein += parseFloat(log.protein_g) || 0;
        avgMacros.carbs += parseFloat(log.carbs_g) || 0;
        avgMacros.fat += parseFloat(log.fat_g) || 0;
        avgMacros.calories += parseFloat(log.calories) || 0;
      });

      Object.keys(avgMacros).forEach(key => {
        avgMacros[key] = Math.round(avgMacros[key] / data.length);
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
      data.forEach(log => {
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
  const assessInjuryRisk = (data = workoutData) => {
    console.log('🔍 Injury Risk Debug:');
    console.log('Workout data length:', data.length);
    console.log('Workout data sample:', data.slice(0, 2));
    
    if (data.length < 7) {
      console.log('❌ Not enough workouts for injury risk (need 7, have ' + data.length + ')');
      return null;
    }

    try {
      const recentWorkouts = data.slice(0, 7);
      const olderWorkouts = data.slice(7, 14);

      const recentAvgVolume = recentWorkouts.reduce((sum, w) => sum + (w.total_volume || 0), 0) / recentWorkouts.length;
      const olderAvgVolume = olderWorkouts.length > 0 
        ? olderWorkouts.reduce((sum, w) => sum + (w.total_volume || 0), 0) / olderWorkouts.length 
        : recentAvgVolume;

      const rawVolumeIncrease = ((recentAvgVolume - olderAvgVolume) / olderAvgVolume) * 100;
      const volumeIncrease = Math.max(-200, Math.min(200, rawVolumeIncrease)); // Cap at ±200%

      // Calculate workout frequency
      const dates = data.map(w => new Date(w.start_time));
      const daysBetween = (dates[0].getTime() - dates[dates.length - 1].getTime()) / (1000 * 60 * 60 * 24);
      const rawFrequency = (data.length / daysBetween) * 7;
      const frequency = Math.min(7, rawFrequency); // Cap at 7x/week

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
  const predictDeloadWeek = (data = workoutData) => {
    console.log('🔍 Deload Week Debug:');
    console.log('Workout data length:', data.length);
    
    if (data.length < 14) {
      console.log('❌ Not enough workouts for deload prediction (need 14, have ' + data.length + ')');
      return null;
    }

    try {
      // Calculate accumulated fatigue over last 4 weeks
      const weeks = [];
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000));
        const weekEnd = new Date(Date.now() - ((i + 1) * 7 * 24 * 60 * 60 * 1000));
        
        const weekWorkouts = data.filter(w => {
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

  // ========== PHASE 2 PREDICTIONS ==========

  // 7. Optimal Training Time Analysis
  const analyzeOptimalTrainingTime = (data = workoutData) => {
    if (data.length < 10) return null;

    try {
      // Group workouts by hour of day
      const byHour = {};
      data.forEach(workout => {
        const hour = new Date(workout.start_time).getHours();
        if (!byHour[hour]) {
          byHour[hour] = {
            count: 0,
            totalVolume: 0,
            avgVolume: 0,
            workouts: []
          };
        }
        byHour[hour].count++;
        byHour[hour].totalVolume += workout.total_volume || 0;
        byHour[hour].workouts.push(workout);
      });

      // Calculate averages
      Object.keys(byHour).forEach(hour => {
        byHour[hour].avgVolume = byHour[hour].totalVolume / byHour[hour].count;
      });

      // Find best and worst times
      const hours = Object.keys(byHour).map(h => parseInt(h));
      const bestHour = hours.reduce((best, hour) => 
        byHour[hour].avgVolume > byHour[best].avgVolume ? hour : best
      );
      const worstHour = hours.reduce((worst, hour) => 
        byHour[hour].avgVolume < byHour[worst].avgVolume ? hour : worst
      );

      // Format time ranges
      const formatHour = (h) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const displayHour = h % 12 || 12;
        return `${displayHour}:00 ${period}`;
      };

      const bestTimeRange = `${formatHour(bestHour)} - ${formatHour(bestHour + 1)}`;
      const worstTimeRange = `${formatHour(worstHour)} - ${formatHour(worstHour + 1)}`;

      // Calculate performance difference (handle zero volume)
      const performanceDiff = byHour[worstHour].avgVolume > 0
        ? ((byHour[bestHour].avgVolume - byHour[worstHour].avgVolume) / byHour[worstHour].avgVolume) * 100
        : 100; // If worst is 0, just show 100% better

      return {
        bestTime: bestTimeRange,
        bestHour,
        bestAvgVolume: Math.round(byHour[bestHour].avgVolume),
        worstTime: worstTimeRange,
        worstAvgVolume: Math.round(byHour[worstHour].avgVolume),
        performanceDiff: Math.round(performanceDiff),
        hourlyData: byHour,
        recommendation: performanceDiff > 15 
          ? `Schedule workouts around ${bestTimeRange} for optimal performance`
          : 'Your performance is consistent across different times'
      };
    } catch (error) {
      console.error('Error analyzing optimal training time:', error);
      return null;
    }
  };

  // 8. Sleep Impact Analysis
  const analyzeSleepImpact = (sleepData = [], workData = workoutData) => {
    // Note: Requires sleep tracking data
    if (sleepData.length < 7 || workData.length < 7) return null;

    try {
      // This would correlate sleep data with workout performance
      // For now, return placeholder until sleep tracking is added
      return null;
    } catch (error) {
      console.error('Error analyzing sleep impact:', error);
      return null;
    }
  };

  // 9. Body Recomposition Forecast
  const forecastBodyRecomposition = (wData = weightData, woData = workoutData, nData = nutritionData) => {
    if (wData.length < 7 || woData.length < 10 || nData.length < 7) return null;

    try {
      // Calculate current trends
      const sortedWeights = [...wData].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const firstWeight = parseFloat(sortedWeights[0].weight);
      const lastWeight = parseFloat(sortedWeights[sortedWeights.length - 1].weight);
      const weightChange = lastWeight - firstWeight;
      const days = (new Date(sortedWeights[sortedWeights.length - 1].date).getTime() - 
                   new Date(sortedWeights[0].date).getTime()) / (1000 * 60 * 60 * 24);
      const weeklyWeightChange = (weightChange / days) * 7;

      // Calculate training volume trend
      const recentWorkouts = woData.slice(0, Math.floor(woData.length / 2));
      const olderWorkouts = woData.slice(Math.floor(woData.length / 2));
      const recentAvgVolume = recentWorkouts.reduce((sum, w) => sum + (w.total_volume || 0), 0) / recentWorkouts.length;
      const olderAvgVolume = olderWorkouts.reduce((sum, w) => sum + (w.total_volume || 0), 0) / olderWorkouts.length;
      const volumeIncrease = ((recentAvgVolume - olderAvgVolume) / olderAvgVolume) * 100;

      // Estimate body composition changes
      // Simplified model: strength gains + slight weight loss = recomp
      const isRecomping = volumeIncrease > 5 && Math.abs(weeklyWeightChange) < 0.5;
      
      // Project 12 weeks
      const projectedWeightChange = weeklyWeightChange * 12;
      const projectedWeight = lastWeight + projectedWeightChange;

      // Estimate muscle/fat split (simplified)
      let estimatedMuscleGain = 0;
      let estimatedFatLoss = 0;

      if (isRecomping) {
        estimatedMuscleGain = Math.abs(volumeIncrease) * 0.1; // Rough estimate
        estimatedFatLoss = Math.abs(projectedWeightChange) + estimatedMuscleGain;
      } else if (weeklyWeightChange < 0) {
        // Losing weight
        estimatedFatLoss = Math.abs(projectedWeightChange) * 0.75;
        estimatedMuscleGain = volumeIncrease > 0 ? Math.abs(projectedWeightChange) * 0.25 : 0;
      } else {
        // Gaining weight
        estimatedMuscleGain = projectedWeightChange * 0.5;
        estimatedFatLoss = 0;
      }

      return {
        currentWeight: Math.round(lastWeight * 10) / 10,
        projectedWeight: Math.round(projectedWeight * 10) / 10,
        weeklyWeightChange: Math.round(weeklyWeightChange * 100) / 100,
        isRecomping,
        estimatedMuscleGain: Math.round(estimatedMuscleGain * 10) / 10,
        estimatedFatLoss: Math.round(estimatedFatLoss * 10) / 10,
        volumeTrend: volumeIncrease > 5 ? 'increasing' : volumeIncrease < -5 ? 'decreasing' : 'stable',
        recommendation: isRecomping 
          ? 'Great! You\'re building muscle while losing fat'
          : weeklyWeightChange < -1 
            ? 'Consider increasing calories to preserve muscle'
            : 'Continue current approach'
      };
    } catch (error) {
      console.error('Error forecasting body recomposition:', error);
      return null;
    }
  };

  // 10. Habit Streak Predictions
  const predictHabitStreak = (data = workoutData) => {
    if (data.length < 14) return null;

    try {
      // Calculate current streak
      const sortedDates = data.map(w => new Date(w.start_time).toDateString()).sort();
      const uniqueDates = [...new Set(sortedDates)];
      
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 1;

      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const daysDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);

        if (daysDiff <= 2) { // Allow 1 rest day
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      // Check if still on streak
      const lastWorkout = new Date(data[0].start_time);
      const daysSinceLastWorkout = (Date.now() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24);
      currentStreak = daysSinceLastWorkout <= 2 ? tempStreak : 0;

      // Calculate consistency rate
      const totalDays = (Date.now() - new Date(data[data.length - 1].start_time).getTime()) / (1000 * 60 * 60 * 24);
      const consistencyRate = (uniqueDates.length / totalDays) * 100;

      // Predict streak maintenance
      const streakProbability = Math.min(95, consistencyRate * 1.2);

      // Cap frequency at 7x/week max
      const rawFrequency = (data.length / totalDays) * 7;
      const cappedFrequency = Math.min(7, rawFrequency);

      return {
        currentStreak,
        longestStreak,
        consistencyRate: Math.round(consistencyRate),
        streakProbability: Math.round(streakProbability),
        totalWorkouts: data.length,
        avgWorkoutsPerWeek: Math.round(cappedFrequency * 10) / 10,
        status: currentStreak > 0 ? 'active' : 'broken',
        recommendation: streakProbability > 70 
          ? 'You\'re on track! Keep up the consistency'
          : 'Try scheduling workouts in advance to improve consistency'
      };
    } catch (error) {
      console.error('Error predicting habit streak:', error);
      return null;
    }
  };

  // 9. Blood Pressure Goal Prediction
  const predictBPGoal = (healthData = weightData) => {
    if (healthData.length < 7) return null;

    try {
      const bpLogs = healthData.filter(d => d.blood_pressure_systolic && d.blood_pressure_diastolic);
      if (bpLogs.length < 7) return null;

      // Sort by date
      const sorted = bpLogs.sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at));
      
      // Calculate averages and trends
      const avgSystolic = sorted.reduce((sum, d) => sum + d.blood_pressure_systolic, 0) / sorted.length;
      const avgDiastolic = sorted.reduce((sum, d) => sum + d.blood_pressure_diastolic, 0) / sorted.length;

      // Calculate trend (recent vs older)
      const mid = Math.floor(sorted.length / 2);
      const olderSystolic = sorted.slice(0, mid).reduce((sum, d) => sum + d.blood_pressure_systolic, 0) / mid;
      const recentSystolic = sorted.slice(mid).reduce((sum, d) => sum + d.blood_pressure_systolic, 0) / (sorted.length - mid);
      const systolicChange = recentSystolic - olderSystolic;

      const olderDiastolic = sorted.slice(0, mid).reduce((sum, d) => sum + d.blood_pressure_diastolic, 0) / mid;
      const recentDiastolic = sorted.slice(mid).reduce((sum, d) => sum + d.blood_pressure_diastolic, 0) / (sorted.length - mid);
      const diastolicChange = recentDiastolic - olderDiastolic;

      // Determine status
      let status = 'normal';
      if (avgSystolic >= 140 || avgDiastolic >= 90) status = 'high';
      else if (avgSystolic >= 130 || avgDiastolic >= 80) status = 'elevated';
      else if (avgSystolic < 90 || avgDiastolic < 60) status = 'low';

      // Determine trend
      let trend = 'stable';
      if (Math.abs(systolicChange) < 2 && Math.abs(diastolicChange) < 2) trend = 'stable';
      else if (systolicChange < -2 || diastolicChange < -2) trend = 'improving';
      else if (systolicChange > 2 || diastolicChange > 2) trend = 'worsening';

      // Goal: 120/80
      const goalSystolic = 120;
      const goalDiastolic = 80;
      const systolicDiff = avgSystolic - goalSystolic;
      const diastolicDiff = avgDiastolic - goalDiastolic;

      // Predict weeks to goal (if improving)
      let weeksToGoal = null;
      if (trend === 'improving' && systolicChange < 0) {
        const weeksElapsed = (new Date(sorted[sorted.length - 1].logged_at) - new Date(sorted[0].logged_at)) / (1000 * 60 * 60 * 24 * 7);
        const ratePerWeek = systolicChange / weeksElapsed;
        weeksToGoal = Math.abs(systolicDiff / ratePerWeek);
      }

      return {
        avgSystolic: Math.round(avgSystolic),
        avgDiastolic: Math.round(avgDiastolic),
        status,
        trend,
        systolicChange: Math.round(systolicChange * 10) / 10,
        diastolicChange: Math.round(diastolicChange * 10) / 10,
        goalSystolic,
        goalDiastolic,
        systolicDiff: Math.round(systolicDiff),
        diastolicDiff: Math.round(diastolicDiff),
        weeksToGoal: weeksToGoal ? Math.round(weeksToGoal) : null,
        logsCount: bpLogs.length,
        recommendation: status === 'high' 
          ? 'Consult your doctor. Consider lifestyle changes: reduce sodium, exercise regularly, manage stress.'
          : status === 'elevated'
          ? 'Monitor closely. Focus on diet, exercise, and stress management to prevent progression.'
          : trend === 'improving'
          ? 'Great progress! Keep up your healthy habits.'
          : 'Maintain your current healthy lifestyle.'
      };
    } catch (error) {
      console.error('Error predicting BP goal:', error);
      return null;
    }
  };

  // 10. Blood Glucose Goal Prediction
  const predictGlucoseGoal = (healthData = weightData) => {
    if (healthData.length < 7) return null;

    try {
      const glucoseLogs = healthData.filter(d => d.glucose_mg_dl);
      if (glucoseLogs.length < 7) return null;

      // Sort by date
      const sorted = glucoseLogs.sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at));
      
      // Calculate average
      const avgGlucose = sorted.reduce((sum, d) => sum + d.glucose_mg_dl, 0) / sorted.length;

      // Calculate trend
      const mid = Math.floor(sorted.length / 2);
      const olderGlucose = sorted.slice(0, mid).reduce((sum, d) => sum + d.glucose_mg_dl, 0) / mid;
      const recentGlucose = sorted.slice(mid).reduce((sum, d) => sum + d.glucose_mg_dl, 0) / (sorted.length - mid);
      const glucoseChange = recentGlucose - olderGlucose;

      // Determine status (fasting glucose)
      let status = 'normal';
      if (avgGlucose >= 126) status = 'diabetic';
      else if (avgGlucose >= 100) status = 'prediabetic';
      else if (avgGlucose < 70) status = 'low';

      // Determine trend
      let trend = 'stable';
      if (Math.abs(glucoseChange) < 5) trend = 'stable';
      else if (glucoseChange < -5) trend = 'improving';
      else if (glucoseChange > 5) trend = 'worsening';

      // Goal: <100 mg/dL (normal)
      const goal = 100;
      const diff = avgGlucose - goal;

      // Estimate A1C (formula: (avg glucose + 46.7) / 28.7)
      const estimatedA1C = ((avgGlucose + 46.7) / 28.7).toFixed(1);

      // Predict weeks to goal (if improving)
      let weeksToGoal = null;
      if (trend === 'improving' && glucoseChange < 0 && avgGlucose > goal) {
        const weeksElapsed = (new Date(sorted[sorted.length - 1].logged_at) - new Date(sorted[0].logged_at)) / (1000 * 60 * 60 * 24 * 7);
        const ratePerWeek = glucoseChange / weeksElapsed;
        weeksToGoal = Math.abs(diff / ratePerWeek);
      }

      return {
        avgGlucose: Math.round(avgGlucose),
        status,
        trend,
        glucoseChange: Math.round(glucoseChange * 10) / 10,
        goal,
        diff: Math.round(diff),
        estimatedA1C,
        weeksToGoal: weeksToGoal ? Math.round(weeksToGoal) : null,
        logsCount: glucoseLogs.length,
        recommendation: status === 'diabetic'
          ? 'Consult your doctor immediately. Follow prescribed treatment and monitor regularly.'
          : status === 'prediabetic'
          ? 'Take action now: improve diet, increase exercise, lose weight if needed. Regular monitoring is key.'
          : status === 'low'
          ? 'Low blood sugar detected. Consult your doctor if this persists.'
          : trend === 'improving'
          ? 'Excellent progress! Continue your healthy lifestyle.'
          : 'Maintain your current healthy habits to keep glucose in normal range.'
      };
    } catch (error) {
      console.error('Error predicting glucose goal:', error);
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
    <div className="min-h-screen p-2 sm:p-6 overflow-x-hidden" style={{background: 'linear-gradient(to bottom right, #f0fdf4, #dbeafe, #cffafe)'}}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🔮 AI Predictions</h1>
          <p className="text-gray-600">Data-driven insights and forecasts based on your health journey</p>
        </div>

        {/* Compressed Data Disclaimer */}
        {predictions.isCompressedData && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Test Data Detected</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Your data appears to be compressed (multiple workouts in a short timeframe). Some predictions may show extreme values. For accurate predictions, log data over a longer period (weeks/months).</p>
                </div>
              </div>
            </div>
          </div>
        )}

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

        {/* ========== PHASE 2 PREDICTIONS ========== */}

        {/* Optimal Training Time */}
        {predictions.optimalTime ? (
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg p-6 text-white mb-6">
            <div className="flex items-center mb-4">
              <Clock className="w-8 h-8 mr-3" />
              <h2 className="text-2xl font-semibold">⏰ Optimal Training Time</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div>
                <div className="text-sm opacity-90 mb-1">Best Time</div>
                <div className="text-3xl font-bold">{predictions.optimalTime.bestTime}</div>
                <div className="text-sm opacity-75">Avg volume: {predictions.optimalTime.bestAvgVolume}</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Worst Time</div>
                <div className="text-2xl font-bold">{predictions.optimalTime.worstTime}</div>
                <div className="text-sm opacity-75">Avg volume: {predictions.optimalTime.worstAvgVolume}</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Performance Difference</div>
                <div className="text-3xl font-bold">{predictions.optimalTime.performanceDiff}%</div>
                <div className="text-sm opacity-75">better at peak time</div>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="font-semibold mb-2">Recommendation:</div>
              <p>{predictions.optimalTime.recommendation}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center mb-6">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Optimal Training Time</h3>
            <p className="text-gray-600">Log 10+ workouts at different times to find your peak performance window</p>
          </div>
        )}

        {/* Body Recomposition Forecast */}
        {predictions.bodyRecomp ? (
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg p-6 text-white mb-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-8 h-8 mr-3" />
              <h2 className="text-2xl font-semibold">💪 Body Recomposition Forecast</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
              <div>
                <div className="text-sm opacity-90 mb-1">Current Weight</div>
                <div className="text-3xl font-bold">{predictions.bodyRecomp.currentWeight} lbs</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">12-Week Projection</div>
                <div className="text-3xl font-bold">{predictions.bodyRecomp.projectedWeight} lbs</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Est. Muscle Gain</div>
                <div className="text-3xl font-bold text-green-200">+{predictions.bodyRecomp.estimatedMuscleGain} lbs</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Est. Fat Loss</div>
                <div className="text-3xl font-bold text-red-200">-{predictions.bodyRecomp.estimatedFatLoss} lbs</div>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm opacity-90">Status</div>
                  <div className="text-xl font-bold">{predictions.bodyRecomp.isRecomping ? '🔥 Recomping' : 'Standard Progress'}</div>
                </div>
                <div>
                  <div className="text-sm opacity-90">Volume Trend</div>
                  <div className="text-xl font-bold capitalize">{predictions.bodyRecomp.volumeTrend}</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="font-semibold mb-2">Recommendation:</div>
              <p>{predictions.bodyRecomp.recommendation}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center mb-6">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Body Recomposition Forecast</h3>
            <p className="text-gray-600">Log 7+ days of weight, 10+ workouts, and nutrition to forecast body composition</p>
          </div>
        )}

        {/* Habit Streak Predictions */}
        {predictions.habitStreak ? (
          <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-lg p-6 text-white mb-6">
            <div className="flex items-center mb-4">
              <Flame className="w-8 h-8 mr-3" />
              <h2 className="text-2xl font-semibold">🔥 Habit Streak Predictions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
              <div>
                <div className="text-sm opacity-90 mb-1">Current Streak</div>
                <div className="text-4xl font-bold">{predictions.habitStreak.currentStreak}</div>
                <div className="text-sm opacity-75">days</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Longest Streak</div>
                <div className="text-4xl font-bold">{predictions.habitStreak.longestStreak}</div>
                <div className="text-sm opacity-75">days</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Consistency Rate</div>
                <div className="text-4xl font-bold">{predictions.habitStreak.consistencyRate}%</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Streak Probability</div>
                <div className="text-4xl font-bold">{predictions.habitStreak.streakProbability}%</div>
                <div className="text-sm opacity-75">next 7 days</div>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm opacity-90">Total Workouts</div>
                  <div className="text-2xl font-bold">{predictions.habitStreak.totalWorkouts}</div>
                </div>
                <div>
                  <div className="text-sm opacity-90">Avg Per Week</div>
                  <div className="text-2xl font-bold">{predictions.habitStreak.avgWorkoutsPerWeek}x</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="font-semibold mb-2">Status: <span className="capitalize">{predictions.habitStreak.status}</span></div>
              <p>{predictions.habitStreak.recommendation}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center mb-6">
            <Flame className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Habit Streak Predictions</h3>
            <p className="text-gray-600">Log 14+ workouts to analyze consistency and predict streaks</p>
          </div>
        )}

        {/* Blood Pressure Goal Prediction */}
        {predictions.bpGoal ? (
          <div className={`bg-gradient-to-r ${
            predictions.bpGoal.status === 'high' ? 'from-red-600 to-pink-600' :
            predictions.bpGoal.status === 'elevated' ? 'from-yellow-600 to-orange-600' :
            predictions.bpGoal.status === 'low' ? 'from-blue-600 to-cyan-600' :
            'from-green-600 to-emerald-600'
          } rounded-lg p-6 text-white mb-6`}>
            <div className="flex items-center mb-4">
              <Activity className="w-8 h-8 mr-3" />
              <h2 className="text-2xl font-semibold">Blood Pressure Goal Tracking</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div>
                <div className="text-sm opacity-90 mb-1">Current Average</div>
                <div className="text-4xl font-bold">{predictions.bpGoal.avgSystolic}/{predictions.bpGoal.avgDiastolic}</div>
                <div className="text-sm opacity-75">mmHg</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Status</div>
                <div className="text-4xl font-bold capitalize">{predictions.bpGoal.status}</div>
                <div className="text-sm opacity-75">Trend: {predictions.bpGoal.trend}</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Goal</div>
                <div className="text-4xl font-bold">{predictions.bpGoal.goalSystolic}/{predictions.bpGoal.goalDiastolic}</div>
                <div className="text-sm opacity-75">mmHg (optimal)</div>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm opacity-90">Systolic Change</div>
                  <div className="text-2xl font-bold">{predictions.bpGoal.systolicChange > 0 ? '+' : ''}{predictions.bpGoal.systolicChange} mmHg</div>
                </div>
                <div>
                  <div className="text-sm opacity-90">Diastolic Change</div>
                  <div className="text-2xl font-bold">{predictions.bpGoal.diastolicChange > 0 ? '+' : ''}{predictions.bpGoal.diastolicChange} mmHg</div>
                </div>
              </div>
            </div>
            {predictions.bpGoal.weeksToGoal && (
              <div className="bg-white/10 rounded-lg p-4 mb-4">
                <div className="font-semibold mb-2">🎯 Estimated Time to Goal</div>
                <div className="text-3xl font-bold">{predictions.bpGoal.weeksToGoal} weeks</div>
                <div className="text-sm opacity-75 mt-1">Based on current improvement rate</div>
              </div>
            )}
            <div className="bg-white/10 rounded-lg p-4">
              <div className="font-semibold mb-2">💡 Recommendation</div>
              <p>{predictions.bpGoal.recommendation}</p>
              <div className="text-sm opacity-75 mt-2">Based on {predictions.bpGoal.logsCount} BP readings</div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center mb-6">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Blood Pressure Goal Tracking</h3>
            <p className="text-gray-600">Log 7+ blood pressure readings in Daily Tracker to track progress</p>
          </div>
        )}

        {/* Blood Glucose Goal Prediction */}
        {predictions.glucoseGoal ? (
          <div className={`bg-gradient-to-r ${
            predictions.glucoseGoal.status === 'diabetic' ? 'from-red-600 to-pink-600' :
            predictions.glucoseGoal.status === 'prediabetic' ? 'from-yellow-600 to-orange-600' :
            predictions.glucoseGoal.status === 'low' ? 'from-blue-600 to-cyan-600' :
            'from-green-600 to-emerald-600'
          } rounded-lg p-6 text-white mb-6`}>
            <div className="flex items-center mb-4">
              <TrendingUp className="w-8 h-8 mr-3" />
              <h2 className="text-2xl font-semibold">Blood Glucose Goal Tracking</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div>
                <div className="text-sm opacity-90 mb-1">Current Average</div>
                <div className="text-4xl font-bold">{predictions.glucoseGoal.avgGlucose}</div>
                <div className="text-sm opacity-75">mg/dL</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Status</div>
                <div className="text-4xl font-bold capitalize">{predictions.glucoseGoal.status}</div>
                <div className="text-sm opacity-75">Trend: {predictions.glucoseGoal.trend}</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Estimated A1C</div>
                <div className="text-4xl font-bold">{predictions.glucoseGoal.estimatedA1C}%</div>
                <div className="text-sm opacity-75">Based on avg glucose</div>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm opacity-90">Recent Change</div>
                  <div className="text-2xl font-bold">{predictions.glucoseGoal.glucoseChange > 0 ? '+' : ''}{predictions.glucoseGoal.glucoseChange} mg/dL</div>
                </div>
                <div>
                  <div className="text-sm opacity-90">Goal</div>
                  <div className="text-2xl font-bold">&lt;{predictions.glucoseGoal.goal} mg/dL</div>
                </div>
              </div>
            </div>
            {predictions.glucoseGoal.weeksToGoal && (
              <div className="bg-white/10 rounded-lg p-4 mb-4">
                <div className="font-semibold mb-2">🎯 Estimated Time to Goal</div>
                <div className="text-3xl font-bold">{predictions.glucoseGoal.weeksToGoal} weeks</div>
                <div className="text-sm opacity-75 mt-1">Based on current improvement rate</div>
              </div>
            )}
            <div className="bg-white/10 rounded-lg p-4">
              <div className="font-semibold mb-2">💡 Recommendation</div>
              <p>{predictions.glucoseGoal.recommendation}</p>
              <div className="text-sm opacity-75 mt-2">Based on {predictions.glucoseGoal.logsCount} glucose readings</div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center mb-6">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Blood Glucose Goal Tracking</h3>
            <p className="text-gray-600">Log 7+ blood glucose readings in Daily Tracker to track progress</p>
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
