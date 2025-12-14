import { useState, useEffect } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, Award, Calendar, Dumbbell, Target, Navigation,
  ChevronRight, Filter, Download, X, Edit2, Trash2
} from 'lucide-react';

const FitnessProgress = () => {
  const [user, setUser] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [personalRecords, setPersonalRecords] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalVolume: 0,
    totalReps: 0,
    totalDistance: 0,
    avgFormScore: 0
  });
  const [timeRange, setTimeRange] = useState('30'); // days
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [hiddenExercises, setHiddenExercises] = useState([]);
  const [predictions, setPredictions] = useState({
    strengthForecast: null,
    plateauDetection: null,
    restDayRecommendation: null,
    goalAchievement: null,
    performanceTrends: null,
    exerciseCorrelations: []
  });

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, timeRange]);

  useEffect(() => {
    if (user && selectedExercise) {
      fetchExerciseProgress();
    }
  }, [user, selectedExercise, timeRange]);

  const initializeUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  };

  const fetchData = async () => {
    try {
      // Fetch exercises from completed sessions
      const { data: sessionExercises } = await supabase
        .from('session_exercises')
        .select('exercise_id, workout_sessions!inner(user_id)')
        .eq('workout_sessions.user_id', user.id);

      // Fetch exercises from workout templates
      const { data: templateExercises } = await supabase
        .from('workout_exercises')
        .select('exercise_id, workouts!inner(user_id)')
        .eq('workouts.user_id', user.id);

      // Get unique exercise IDs
      const completedExerciseIds = [...new Set((sessionExercises || []).map(se => se.exercise_id))];
      const templateExerciseIds = [...new Set((templateExercises || []).map(te => te.exercise_id))];
      const allExerciseIds = [...new Set([...completedExerciseIds, ...templateExerciseIds])];

      // Fetch exercise details for these IDs
      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('*')
        .in('id', allExerciseIds)
        .order('name');
      
      setExercises(exercisesData || []);

      // Fetch recent workout sessions
      const { data: sessionsData } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          workout:workouts(name)
        `)
        .eq('user_id', user.id)
        .eq('is_completed', true)
        .order('start_time', { ascending: false })
        .limit(10);
      setRecentSessions(sessionsData || []);

      // Calculate personal records from exercise_sets
      // Get all session_exercises for this user
      const userSessionIds = (sessionsData || []).map(s => s.id);
      
      if (userSessionIds.length > 0) {
        const { data: userSessionExercises } = await supabase
          .from('session_exercises')
          .select('id, exercise_id')
          .in('session_id', userSessionIds);

        if (userSessionExercises && userSessionExercises.length > 0) {
          const sessionExerciseIds = userSessionExercises.map(se => se.id);
          
          // Get all sets for these exercises
          const { data: allSets } = await supabase
            .from('exercise_sets')
            .select('*')
            .in('session_exercise_id', sessionExerciseIds);

          // Calculate PRs by exercise
          const prsByExercise = {};
          (allSets || []).forEach(set => {
            const sessionExercise = userSessionExercises.find(se => se.id === set.session_exercise_id);
            if (!sessionExercise) return;

            const exerciseId = sessionExercise.exercise_id;
            if (!prsByExercise[exerciseId]) {
              prsByExercise[exerciseId] = {
                maxWeight: 0,
                maxVolume: 0,
                maxReps: 0,
                maxDistance: 0,
                longestDuration: 0,
                bestPace: 0,
                bestSet: null
              };
            }

            const weight = parseFloat(set.weight) || 0;
            const reps = parseInt(set.reps) || 0;
            const volume = weight * reps;

            // Track strength metrics
            if (weight > prsByExercise[exerciseId].maxWeight) {
              prsByExercise[exerciseId].maxWeight = weight;
              prsByExercise[exerciseId].bestSet = set;
            }
            if (volume > prsByExercise[exerciseId].maxVolume) {
              prsByExercise[exerciseId].maxVolume = volume;
            }
            if (reps > prsByExercise[exerciseId].maxReps) {
              prsByExercise[exerciseId].maxReps = reps;
            }

            // Track cardio metrics
            const distance = parseFloat(set.distance) || 0;
            const duration = parseFloat(set.duration_minutes) || 0;
            const pace = parseFloat(set.pace) || 0;

            if (distance > prsByExercise[exerciseId].maxDistance) {
              prsByExercise[exerciseId].maxDistance = distance;
              if (!prsByExercise[exerciseId].bestSet) {
                prsByExercise[exerciseId].bestSet = set;
              }
            }
            if (duration > prsByExercise[exerciseId].longestDuration) {
              prsByExercise[exerciseId].longestDuration = duration;
            }
            if (pace > prsByExercise[exerciseId].bestPace) {
              prsByExercise[exerciseId].bestPace = pace;
            }
          });

          // Get exercise names and format PRs
          const exerciseIds = Object.keys(prsByExercise);
          if (exerciseIds.length > 0) {
            const { data: exercisesInfo } = await supabase
              .from('exercises')
              .select('id, name, category')
              .in('id', exerciseIds);

            const exerciseInfoMap = {};
            (exercisesInfo || []).forEach(ex => {
              exerciseInfoMap[ex.id] = { name: ex.name, category: ex.category };
            });

            // Helper function to get exercise type
            const getExerciseType = (category) => {
              if (!category) return 'strength';
              let categoryStr = category;
              if (typeof category === 'string' && category.startsWith('[')) {
                try {
                  const parsed = JSON.parse(category);
                  categoryStr = Array.isArray(parsed) ? parsed[0] : category;
                } catch {
                  categoryStr = category;
                }
              }
              const lowerCategory = String(categoryStr).toLowerCase();
              if (lowerCategory.includes('cardio')) return 'cardio';
              if (lowerCategory.includes('stretch')) return 'stretching';
              return 'strength';
            };

            const prsArray = Object.entries(prsByExercise).map(([exerciseId, prs]) => {
              const exerciseInfo = exerciseInfoMap[exerciseId] || { name: 'Unknown', category: null };
              const exerciseType = getExerciseType(exerciseInfo.category);
              
              // Determine record type and value based on exercise type
              let recordType, value;
              
              if (exerciseType === 'cardio') {
                recordType = 'max_distance';
                value = `${prs.maxDistance.toFixed(2)} miles`;
              } else if (exerciseType === 'stretching') {
                recordType = 'longest_duration';
                value = `${prs.longestDuration.toFixed(0)} min`;
              } else {
                recordType = 'max_weight';
                value = `${prs.maxWeight} lbs`;
              }
              
              return {
                id: exerciseId,
                exercise: { name: exerciseInfo.name },
                record_type: recordType,
                value: value,
                achieved_at: prs.bestSet?.created_at || new Date().toISOString()
              };
            });

            setPersonalRecords(prsArray.slice(0, 5)); // Show top 5
          } else {
            setPersonalRecords([]);
          }
        } else {
          setPersonalRecords([]);
        }
      } else {
        setPersonalRecords([]);
      }

      // Calculate overall stats
      const totalWorkouts = sessionsData?.length || 0;
      const totalVolume = sessionsData?.reduce((sum, s) => sum + (s.total_volume || 0), 0) || 0;
      const totalReps = sessionsData?.reduce((sum, s) => sum + (s.total_reps || 0), 0) || 0;
      const totalDistance = sessionsData?.reduce((sum, s) => sum + (s.total_distance || 0), 0) || 0;

      // Fetch form analysis average
      let avgFormScore = 0;
      
      // Skip form analysis query in demo mode
      if (!user.id.startsWith('demo')) {
        const { data: formData } = await supabase
          .from('form_analysis_sessions')
          .select('average_form_score')
          .eq('user_id', user.id)
          .eq('analysis_status', 'completed');
        
        avgFormScore = formData?.length > 0
          ? formData.reduce((sum, f) => sum + (f.average_form_score || 0), 0) / formData.length
          : 0;
      }

      setStats({
        totalWorkouts,
        totalVolume: Math.round(totalVolume),
        totalReps,
        totalDistance: Math.round(totalDistance * 100) / 100, // Round to 2 decimals
        avgFormScore: Math.round(avgFormScore)
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback: if filtering fails, show all exercises
      const { data: allExercises } = await supabase
        .from('exercises')
        .select('*')
        .order('name')
        .limit(20);
      setExercises(allExercises || []);
    }
  };

  const fetchExerciseProgress = async () => {
    try {
      const daysAgo = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // First get session_exercises for this exercise
      const { data: sessionExercisesData, error: seError } = await supabase
        .from('session_exercises')
        .select('id, session_id')
        .eq('exercise_id', selectedExercise.id);

      if (seError || !sessionExercisesData || sessionExercisesData.length === 0) {
        console.log('No session exercises found for this exercise');
        setProgressData([]);
        return;
      }

      const sessionExerciseIds = sessionExercisesData.map(se => se.id);
      const sessionIds = sessionExercisesData.map(se => se.session_id);

      // Get workout sessions for date filtering
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select('id, start_time')
        .eq('user_id', user.id)
        .in('id', sessionIds)
        .gte('start_time', startDate.toISOString());

      if (sessionsError || !sessionsData) {
        console.error('Error fetching sessions:', sessionsError);
        setProgressData([]);
        return;
      }

      const validSessionIds = sessionsData.map(s => s.id);
      const sessionDateMap = {};
      sessionsData.forEach(s => {
        sessionDateMap[s.id] = s.start_time;
      });

      // Filter session_exercises to only valid sessions
      const validSessionExerciseIds = sessionExercisesData
        .filter(se => validSessionIds.includes(se.session_id))
        .map(se => se.id);

      if (validSessionExerciseIds.length === 0) {
        setProgressData([]);
        return;
      }

      // Now get the actual sets data
      const { data: setsData, error: setsError } = await supabase
        .from('exercise_sets')
        .select('*')
        .in('session_exercise_id', validSessionExerciseIds);

      if (setsError) {
        console.error('Error fetching sets:', setsError);
        setProgressData([]);
        return;
      }

      // Map session_exercise_id back to session_id
      const seIdToSessionId = {};
      sessionExercisesData.forEach(se => {
        seIdToSessionId[se.id] = se.session_id;
      });

      // Group by date and calculate totals
      const dataByDate = {};
      (setsData || []).forEach(set => {
        const sessionId = seIdToSessionId[set.session_exercise_id];
        const timestamp = sessionDateMap[sessionId];
        if (!timestamp) return;

        const date = new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!dataByDate[date]) {
          dataByDate[date] = {
            date,
            weight: 0,
            volume: 0,
            reps: 0,
            sets: 0,
            maxWeight: 0,
            timestamp
          };
        }
        const weight = parseFloat(set.weight) || 0;
        const reps = parseInt(set.reps) || 0;
        const volume = weight * reps;
        
        dataByDate[date].volume += volume;
        dataByDate[date].reps += reps;
        dataByDate[date].sets += 1;
        dataByDate[date].maxWeight = Math.max(dataByDate[date].maxWeight, weight);
      });

      // Transform to array and calculate estimated 1RM
      const chartData = Object.values(dataByDate).map(d => ({
        date: d.date,
        weight: d.maxWeight,
        volume: Math.round(d.volume),
        reps: d.reps,
        sets: d.sets,
        estimated1RM: d.maxWeight > 0 ? Math.round(d.maxWeight * (1 + d.reps / 30)) : 0,
        timestamp: d.timestamp
      })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      setProgressData(chartData);
    } catch (error) {
      console.error('Error fetching exercise progress:', error);
    }
  };

  const fetchSessionDetails = async (sessionId) => {
    try {
      console.log('🔍 Fetching session details for:', sessionId);
      
      // Fetch session exercises
      const { data: sessionExercises, error: sessionError } = await supabase
        .from('session_exercises')
        .select('*')
        .eq('session_id', sessionId)
        .order('exercise_order');

      if (sessionError) {
        console.error('❌ Error fetching session exercises:', sessionError);
        setSessionDetails([]);
        return;
      }

      if (!sessionExercises || sessionExercises.length === 0) {
        console.log('⚠️ No exercises found for this session');
        setSessionDetails([]);
        return;
      }

      // Get session exercise IDs
      const sessionExerciseIds = sessionExercises.map(se => se.id);
      const exerciseIds = [...new Set(sessionExercises.map(se => se.exercise_id))];
      
      // Fetch exercise sets
      const { data: exerciseSets, error: setsError } = await supabase
        .from('exercise_sets')
        .select('*')
        .in('session_exercise_id', sessionExerciseIds)
        .order('set_number');

      if (setsError) {
        console.error('❌ Error fetching exercise sets:', setsError);
        setSessionDetails([]);
        return;
      }

      // Fetch exercise details separately
      const { data: exerciseDetails, error: exerciseError } = await supabase
        .from('exercises')
        .select('id, name, description')
        .in('id', exerciseIds);

      if (exerciseError) {
        console.error('❌ Error fetching exercise details:', exerciseError);
      }

      // Create maps
      const exerciseMap = {};
      (exerciseDetails || []).forEach(ex => {
        exerciseMap[ex.id] = ex;
      });

      const sessionExerciseMap = {};
      sessionExercises.forEach(se => {
        sessionExerciseMap[se.id] = se;
      });

      // Combine sets with exercise details
      const combinedData = (exerciseSets || []).map(set => {
        const sessionExercise = sessionExerciseMap[set.session_exercise_id];
        const exercise = exerciseMap[sessionExercise?.exercise_id];
        return {
          ...set,
          exercises: exercise || { name: 'Unknown Exercise', description: '' }
        };
      });
      
      console.log('✅ Session details loaded:', combinedData.length, 'sets');
      setSessionDetails(combinedData);
    } catch (error) {
      console.error('❌ Exception fetching session details:', error);
      setSessionDetails([]);
    }
  };

  const deleteWorkoutSession = async (sessionId, sessionName) => {
    if (!confirm(`Delete "${sessionName}"?\n\nThis will permanently delete:\n- The workout session\n- All exercise sets\n- All related data\n\nThis cannot be undone!`)) {
      return;
    }

    try {
      // Delete exercise sets first (foreign key constraint)
      const { data: sessionExercises } = await supabase
        .from('session_exercises')
        .select('id')
        .eq('session_id', sessionId);

      if (sessionExercises && sessionExercises.length > 0) {
        const sessionExerciseIds = sessionExercises.map(se => se.id);
        
        await supabase
          .from('exercise_sets')
          .delete()
          .in('session_exercise_id', sessionExerciseIds);

        await supabase
          .from('session_exercises')
          .delete()
          .eq('session_id', sessionId);
      }

      // Delete the session
      const { error } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      // Refresh data
      await fetchData();
      alert('Workout deleted successfully!');
    } catch (error) {
      console.error('Error deleting workout:', error);
      alert('Failed to delete workout: ' + error.message);
    }
  };

  const updateExerciseSet = async (setId, field, value) => {
    try {
      const { error } = await supabase
        .from('exercise_sets')
        .update({ [field]: value })
        .eq('id', setId);

      if (error) throw error;
      
      // Refresh session details
      if (selectedSession) {
        await fetchSessionDetails(selectedSession.id);
      }
    } catch (error) {
      console.error('Error updating set:', error);
      alert('Failed to update set');
    }
  };

  // Helper function to determine exercise type
  const getExerciseDisplayType = (exercise) => {
    if (!exercise) return 'weighted';
    
    const category = exercise.category || '';
    const equipment = exercise.equipment || [];
    
    // Parse category if it's a JSON string
    const categoryStr = typeof category === 'string' ? category.toLowerCase() : '';
    
    // Parse equipment array
    let equipmentArray = [];
    if (Array.isArray(equipment)) {
      equipmentArray = equipment.map(e => e.toLowerCase());
    } else if (typeof equipment === 'string') {
      try {
        equipmentArray = JSON.parse(equipment).map(e => e.toLowerCase());
      } catch {
        equipmentArray = [equipment.toLowerCase()];
      }
    }
    
    // Check exercise type
    if (categoryStr.includes('cardio')) return 'cardio';
    if (categoryStr.includes('stretching')) return 'stretching';
    if (equipmentArray.includes('bodyweight') || equipmentArray.includes('other')) return 'bodyweight';
    
    return 'weighted';
  };

  const predictNext1RM = () => {
    if (progressData.length < 2) return null;

    // Simple linear regression for prediction
    const xValues = progressData.map((_, i) => i);
    const yValues = progressData.map(d => d.estimated1RM);

    const n = xValues.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict next value
    const nextX = n;
    const prediction = slope * nextX + intercept;

    return Math.round(prediction);
  };

  const calculateStrengthForecast = () => {
    if (!selectedExercise || progressData.length < 3) return null;

    try {
      // Calculate growth rate
      const weights = progressData.map(d => d.maxWeight);
      const dates = progressData.map(d => new Date(d.timestamp).getTime());
      
      // Calculate average weekly growth
      const weeklyGrowth = [];
      for (let i = 1; i < weights.length; i++) {
        const daysDiff = (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24);
        const weightDiff = weights[i] - weights[i-1];
        const weeklyRate = (weightDiff / daysDiff) * 7;
        weeklyGrowth.push(weeklyRate);
      }

      const avgWeeklyGrowth = weeklyGrowth.reduce((a, b) => a + b, 0) / weeklyGrowth.length;
      const currentMax = weights[weights.length - 1];

      // Exponential growth model with diminishing returns
      const growthFactor = Math.max(0.5, 1 - (currentMax / 500)); // Diminishing returns as weight increases
      const adjustedGrowth = avgWeeklyGrowth * growthFactor;

      // Predictions for 4, 8, 12 weeks
      const predictions = [
        { weeks: 4, weight: Math.round(currentMax + (adjustedGrowth * 4)) },
        { weeks: 8, weight: Math.round(currentMax + (adjustedGrowth * 8 * 0.9)) }, // Slight deceleration
        { weeks: 12, weight: Math.round(currentMax + (adjustedGrowth * 12 * 0.85)) }
      ];

      // Calculate confidence based on data consistency
      const variance = weeklyGrowth.reduce((sum, rate) => sum + Math.pow(rate - avgWeeklyGrowth, 2), 0) / weeklyGrowth.length;
      const stdDev = Math.sqrt(variance);
      const confidence = Math.max(50, Math.min(95, 100 - (stdDev * 10)));

      return {
        currentMax,
        avgWeeklyGrowth: Math.round(avgWeeklyGrowth * 10) / 10,
        predictions,
        confidence: Math.round(confidence),
        trend: avgWeeklyGrowth > 0 ? 'increasing' : avgWeeklyGrowth < 0 ? 'decreasing' : 'stable'
      };
    } catch (error) {
      console.error('Error calculating strength forecast:', error);
      return null;
    }
  };

  const calculatePerformanceTrends = () => {
    if (recentSessions.length < 3) return null;

    try {
      const sessions = recentSessions.slice(0, 10); // Last 10 sessions
      
      // Calculate averages
      const avgVolume = sessions.reduce((sum, s) => sum + (s.total_volume || 0), 0) / sessions.length;
      const avgSets = sessions.reduce((sum, s) => sum + (s.total_sets || 0), 0) / sessions.length;
      const avgReps = sessions.reduce((sum, s) => sum + (s.total_reps || 0), 0) / sessions.length;

      // Calculate trends (comparing first half vs second half)
      const half = Math.floor(sessions.length / 2);
      const firstHalf = sessions.slice(0, half);
      const secondHalf = sessions.slice(half);

      const firstAvgVolume = firstHalf.reduce((sum, s) => sum + (s.total_volume || 0), 0) / firstHalf.length;
      const secondAvgVolume = secondHalf.reduce((sum, s) => sum + (s.total_volume || 0), 0) / secondHalf.length;

      const volumeTrend = ((secondAvgVolume - firstAvgVolume) / firstAvgVolume) * 100;

      // Predict next workout
      const predictedVolume = Math.round(avgVolume + (volumeTrend / 100 * avgVolume));
      const predictedSets = Math.round(avgSets);
      const predictedReps = Math.round(avgReps);

      return {
        avgVolume: Math.round(avgVolume),
        avgSets: Math.round(avgSets),
        avgReps: Math.round(avgReps),
        volumeTrend: Math.round(volumeTrend * 10) / 10,
        predictedVolume,
        predictedSets,
        predictedReps,
        trend: volumeTrend > 5 ? 'improving' : volumeTrend < -5 ? 'declining' : 'stable'
      };
    } catch (error) {
      console.error('Error calculating performance trends:', error);
      return null;
    }
  };

  const calculateGoalAchievement = () => {
    if (!selectedExercise || progressData.length < 3) return null;

    try {
      const forecast = calculateStrengthForecast();
      if (!forecast) return null;

      // Example goal: 10% increase from current max
      const currentMax = forecast.currentMax;
      const goalWeight = Math.round(currentMax * 1.1);
      
      // Calculate weeks to goal based on growth rate
      const weeksToGoal = Math.round((goalWeight - currentMax) / forecast.avgWeeklyGrowth);
      
      // Calculate probability based on consistency and trend
      let probability = forecast.confidence;
      if (forecast.trend === 'decreasing') probability *= 0.5;
      if (weeksToGoal > 24) probability *= 0.7; // Lower confidence for distant goals

      return {
        currentMax,
        goalWeight,
        weeksToGoal: Math.max(1, weeksToGoal),
        probability: Math.round(Math.min(95, Math.max(10, probability))),
        achievableBy: new Date(Date.now() + weeksToGoal * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        recommendation: weeksToGoal < 0 ? 'Goal already achieved!' : 
                       weeksToGoal < 12 ? 'Very achievable with consistent training' :
                       weeksToGoal < 24 ? 'Achievable with dedication' :
                       'Consider a more realistic short-term goal'
      };
    } catch (error) {
      console.error('Error calculating goal achievement:', error);
      return null;
    }
  };

  const detectPlateau = () => {
    if (!selectedExercise || progressData.length < 4) return null;

    try {
      const recentData = progressData.slice(-4); // Last 4 data points
      const weights = recentData.map(d => d.maxWeight);
      
      // Calculate variance in recent weights
      const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
      const variance = weights.reduce((sum, w) => sum + Math.pow(w - avg, 2), 0) / weights.length;
      const stdDev = Math.sqrt(variance);
      
      // Plateau detected if standard deviation is very low (< 2.5% of average)
      const isPlateau = stdDev < (avg * 0.025);
      
      // Check if weights are stagnant or decreasing
      const trend = weights[weights.length - 1] - weights[0];
      const isStagnant = Math.abs(trend) < (avg * 0.05); // Less than 5% change
      
      if (isPlateau || isStagnant) {
        return {
          detected: true,
          duration: recentData.length,
          currentWeight: weights[weights.length - 1],
          recommendations: [
            'Consider a deload week (reduce weight by 10-20%)',
            'Try different rep ranges (e.g., switch from 8-12 to 3-5 reps)',
            'Add variation exercises',
            'Check recovery: sleep, nutrition, stress levels',
            'Increase training frequency or volume gradually'
          ],
          severity: isStagnant && trend < 0 ? 'high' : 'moderate'
        };
      }
      
      return {
        detected: false,
        message: 'Good progress! Keep up the consistent training.'
      };
    } catch (error) {
      console.error('Error detecting plateau:', error);
      return null;
    }
  };

  const recommendRestDay = () => {
    if (recentSessions.length < 5) return null;

    try {
      // Use all available sessions for better accuracy
      const sessions = recentSessions;
      
      // Calculate workout frequency (sessions per week)
      const dates = sessions.map(s => new Date(s.start_time));
      
      // Calculate span between oldest and newest workout
      const oldestDate = dates[dates.length - 1].getTime();
      const newestDate = dates[0].getTime();
      const daysBetween = (newestDate - oldestDate) / (1000 * 60 * 60 * 24);
      
      let frequency;
      
      if (daysBetween < 7) {
        // For short time spans (< 1 week), use 30-day rolling average
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const last30Days = recentSessions.filter(s => new Date(s.start_time).getTime() > thirtyDaysAgo);
        frequency = (last30Days.length / 30) * 7;
      } else {
        // For longer spans, use actual data
        frequency = (sessions.length / daysBetween) * 7;
      }
      
      // Cap at 7x/week maximum (one workout per day)
      frequency = Math.min(7, frequency);
      
      // Calculate average volume and intensity
      const avgVolume = sessions.reduce((sum, s) => sum + (s.total_volume || 0), 0) / sessions.length;
      const recentVolume = sessions.slice(0, 3).reduce((sum, s) => sum + (s.total_volume || 0), 0) / 3;
      
      // Check for overtraining indicators
      const volumeIncrease = ((recentVolume - avgVolume) / avgVolume) * 100;
      const daysSinceLastWorkout = (Date.now() - dates[0].getTime()) / (1000 * 60 * 60 * 24);
      
      let needsRest = false;
      let reason = '';
      
      if (frequency > 6) {
        needsRest = true;
        reason = 'High training frequency (>6 days/week)';
      } else if (volumeIncrease > 30) {
        needsRest = true;
        reason = 'Significant volume increase (>30%)';
      } else if (daysSinceLastWorkout < 0.5) {
        needsRest = true;
        reason = 'Insufficient recovery time between sessions';
      }
      
      return {
        needsRest,
        reason,
        frequency: Math.max(0, Math.round(frequency * 10) / 10), // Ensure non-negative
        daysSinceLastWorkout: Math.round(daysSinceLastWorkout * 10) / 10,
        recommendation: needsRest ? 
          'Take 1-2 rest days to optimize recovery and prevent overtraining' :
          daysSinceLastWorkout > 3 ? 
            'Good time for your next workout!' :
            'Continue with your current schedule'
      };
    } catch (error) {
      console.error('Error calculating rest day recommendation:', error);
      return null;
    }
  };

  const analyzeExerciseCorrelations = async () => {
    if (!user || recentSessions.length < 5) return [];

    try {
      // Get all session exercises for user's sessions
      const sessionIds = recentSessions.map(s => s.id);
      const { data: sessionExercises } = await supabase
        .from('session_exercises')
        .select('id, session_id, exercise_id')
        .in('session_id', sessionIds);

      if (!sessionExercises || sessionExercises.length === 0) return [];

      const sessionExerciseIds = sessionExercises.map(se => se.id);
      
      // Get all sets
      const { data: allSets } = await supabase
        .from('exercise_sets')
        .select('*')
        .in('session_exercise_id', sessionExerciseIds);

      if (!allSets || allSets.length === 0) return [];

      // Group by exercise and calculate max weights over time
      const exerciseProgress = {};
      
      allSets.forEach(set => {
        const sessionExercise = sessionExercises.find(se => se.id === set.session_exercise_id);
        if (!sessionExercise) return;

        const exerciseId = sessionExercise.exercise_id;
        const sessionId = sessionExercise.session_id;
        const session = recentSessions.find(s => s.id === sessionId);
        if (!session) return;

        if (!exerciseProgress[exerciseId]) {
          exerciseProgress[exerciseId] = [];
        }

        exerciseProgress[exerciseId].push({
          date: new Date(session.start_time),
          weight: parseFloat(set.weight) || 0
        });
      });

      // Calculate correlations between exercises
      const exerciseIds = Object.keys(exerciseProgress);
      const correlations = [];

      for (let i = 0; i < exerciseIds.length; i++) {
        for (let j = i + 1; j < exerciseIds.length; j++) {
          const ex1Id = exerciseIds[i];
          const ex2Id = exerciseIds[j];
          
          const ex1Data = exerciseProgress[ex1Id];
          const ex2Data = exerciseProgress[ex2Id];

          if (ex1Data.length < 3 || ex2Data.length < 3) continue;

          // Calculate correlation coefficient
          const ex1Weights = ex1Data.map(d => d.weight);
          const ex2Weights = ex2Data.map(d => d.weight);

          const ex1Avg = ex1Weights.reduce((a, b) => a + b, 0) / ex1Weights.length;
          const ex2Avg = ex2Weights.reduce((a, b) => a + b, 0) / ex2Weights.length;

          let numerator = 0;
          let ex1Variance = 0;
          let ex2Variance = 0;

          for (let k = 0; k < Math.min(ex1Weights.length, ex2Weights.length); k++) {
            const ex1Diff = ex1Weights[k] - ex1Avg;
            const ex2Diff = ex2Weights[k] - ex2Avg;
            numerator += ex1Diff * ex2Diff;
            ex1Variance += ex1Diff * ex1Diff;
            ex2Variance += ex2Diff * ex2Diff;
          }

          const correlation = numerator / Math.sqrt(ex1Variance * ex2Variance);

          if (Math.abs(correlation) > 0.5) { // Only show strong correlations
            correlations.push({
              exercise1: ex1Id,
              exercise2: ex2Id,
              correlation: Math.round(correlation * 100) / 100,
              strength: Math.abs(correlation) > 0.7 ? 'strong' : 'moderate'
            });
          }
        }
      }

      // Get exercise names
      if (correlations.length > 0) {
        const allExerciseIds = [...new Set(correlations.flatMap(c => [c.exercise1, c.exercise2]))];
        const { data: exerciseNames } = await supabase
          .from('exercises')
          .select('id, name')
          .in('id', allExerciseIds);

        const nameMap = {};
        (exerciseNames || []).forEach(ex => {
          nameMap[ex.id] = ex.name;
        });

        return correlations.map(c => ({
          ...c,
          exercise1Name: nameMap[c.exercise1] || 'Unknown',
          exercise2Name: nameMap[c.exercise2] || 'Unknown',
          insight: c.correlation > 0 ? 
            `When ${nameMap[c.exercise1]} improves, ${nameMap[c.exercise2]} typically increases by ${Math.round(Math.abs(c.correlation) * 100)}%` :
            `${nameMap[c.exercise1]} and ${nameMap[c.exercise2]} show inverse relationship`
        })).slice(0, 5); // Top 5 correlations
      }

      return [];
    } catch (error) {
      console.error('Error analyzing exercise correlations:', error);
      return [];
    }
  };

  const calculateRecommendedWeight = () => {
    if (progressData.length === 0) return null;

    const latest = progressData[progressData.length - 1];
    const predicted1RM = predictNext1RM();

    if (!predicted1RM) return null;

    // Recommend 80% of predicted 1RM for working sets
    return Math.round(predicted1RM * 0.8);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading progress data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to view progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{background: 'linear-gradient(to bottom right, #f0fdf4, #dbeafe, #cffafe)'}}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Fitness Progress</h1>
          
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalWorkouts}</div>
            <div className="text-sm text-gray-600">Total Workouts</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Dumbbell className="w-6 h-6 text-purple-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalVolume.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Volume (lbs)</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalReps.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Reps</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Navigation className="w-6 h-6 text-cyan-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalDistance.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total Distance (miles)</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.avgFormScore}</div>
            <div className="text-sm text-gray-600">Avg Form Score</div>
          </div>
        </div>

        {/* Exercise Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Exercise to Track</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
            {exercises.filter(ex => !hiddenExercises.includes(ex.id)).map(exercise => (
              <button
                key={exercise.id}
                onClick={() => setSelectedExercise(exercise)}
                className={`p-3 rounded-lg border-2 transition-colors text-left ${
                  selectedExercise?.id === exercise.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900 text-sm flex-1">{exercise.name}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Hide "${exercise.name}" from this list?\n\nThis won't delete your workout data.`)) {
                        setHiddenExercises(prev => [...prev, exercise.id]);
                      }
                    }}
                    className="p-1 hover:bg-red-100 rounded transition-colors"
                  >
                    <X className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedExercise && progressData.length > 0 && (() => {
          const exerciseType = getExerciseDisplayType(selectedExercise);
          
          return (
            <>
              {/* Cardio Charts */}
              {exerciseType === 'cardio' && (
                <>
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      {selectedExercise.name} - Distance Progression
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="distance" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          name="Distance (miles)"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pace" 
                          stroke="#10B981" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Pace (mph)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      {selectedExercise.name} - Duration
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="duration" fill="#8B5CF6" name="Duration (minutes)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {/* Stretching Charts */}
              {exerciseType === 'stretching' && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {selectedExercise.name} - Duration Progression
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="duration" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        name="Duration (minutes)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Bodyweight Charts */}
              {exerciseType === 'bodyweight' && (
                <>
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      {selectedExercise.name} - Reps Progression
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="reps" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          name="Max Reps"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      {selectedExercise.name} - Total Reps per Session
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="reps" fill="#F59E0B" name="Total Reps" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {/* Weighted Strength Charts */}
              {exerciseType === 'weighted' && (
                <>
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      {selectedExercise.name} - Strength Progression
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          name="Max Weight (lbs)"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="estimated1RM" 
                          stroke="#10B981" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Estimated 1RM (lbs)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      {selectedExercise.name} - Training Volume
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="volume" fill="#8B5CF6" name="Total Volume (lbs)" />
                        <Bar dataKey="reps" fill="#F59E0B" name="Total Reps" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

            {/* Predictive Analytics - Only for weighted exercises */}
            {exerciseType === 'weighted' && (
            <div className="space-y-6 mb-6">
              {/* Strength Forecast */}
              {(() => {
                const forecast = calculateStrengthForecast();
                return forecast && (
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
                    <h2 className="text-2xl font-semibold mb-4">💪 Strength Forecast</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {forecast.predictions.map(pred => (
                        <div key={pred.weeks} className="bg-white/10 rounded-lg p-4">
                          <div className="text-sm opacity-90 mb-2">In {pred.weeks} Weeks</div>
                          <div className="text-3xl font-bold">{pred.weight} lbs</div>
                          <div className="text-xs opacity-75 mt-2">
                            +{pred.weight - forecast.currentMax} lbs from current
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span>Weekly Growth: +{forecast.avgWeeklyGrowth} lbs</span>
                      <span>Confidence: {forecast.confidence}%</span>
                      <span className="capitalize">Trend: {forecast.trend}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Goal Achievement */}
              {(() => {
                const goal = calculateGoalAchievement();
                return goal && (
                  <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-6 text-white">
                    <h2 className="text-2xl font-semibold mb-4">🎯 Goal Achievement Probability</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <div className="text-sm opacity-90 mb-2">Current Max</div>
                        <div className="text-3xl font-bold">{goal.currentMax} lbs</div>
                      </div>
                      <div>
                        <div className="text-sm opacity-90 mb-2">Goal Weight</div>
                        <div className="text-3xl font-bold">{goal.goalWeight} lbs</div>
                        <div className="text-xs opacity-75 mt-1">+10% increase</div>
                      </div>
                      <div>
                        <div className="text-sm opacity-90 mb-2">Success Probability</div>
                        <div className="text-3xl font-bold">{goal.probability}%</div>
                        <div className="text-xs opacity-75 mt-1">By {goal.achievableBy}</div>
                      </div>
                    </div>
                    <div className="mt-4 bg-white/10 rounded-lg p-3 text-sm">
                      {goal.recommendation}
                    </div>
                  </div>
                );
              })()}

              {/* Plateau Detection */}
              {(() => {
                const plateau = detectPlateau();
                return plateau && plateau.detected && (
                  <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-6 text-white">
                    <h2 className="text-2xl font-semibold mb-4">🚨 Plateau Detected</h2>
                    <div className="mb-4">
                      <p className="text-lg">Your progress has stalled at <strong>{plateau.currentWeight} lbs</strong></p>
                      <p className="text-sm opacity-75 mt-1">Severity: {plateau.severity}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="font-semibold mb-2">Recommendations:</div>
                      <ul className="space-y-1 text-sm">
                        {plateau.recommendations.map((rec, i) => (
                          <li key={i}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })()}

              {/* Rest Day Recommendation */}
              {(() => {
                const rest = recommendRestDay();
                return rest && (
                  <div className={`bg-gradient-to-r ${rest.needsRest ? 'from-yellow-600 to-orange-600' : 'from-cyan-600 to-blue-600'} rounded-lg p-6 text-white`}>
                    <h2 className="text-2xl font-semibold mb-4">🛌 Recovery Analysis</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                      <div>
                        <div className="text-sm opacity-90 mb-2">Training Frequency</div>
                        <div className="text-3xl font-bold">{rest.frequency}x/week</div>
                      </div>
                      <div>
                        <div className="text-sm opacity-90 mb-2">Days Since Last Workout</div>
                        <div className="text-3xl font-bold">{rest.daysSinceLastWorkout}</div>
                      </div>
                      <div>
                        <div className="text-sm opacity-90 mb-2">Status</div>
                        <div className="text-2xl font-bold">{rest.needsRest ? '⚠️ Rest Needed' : '✅ Good to Go'}</div>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="font-semibold">{rest.recommendation}</p>
                      {rest.reason && <p className="text-sm opacity-75 mt-1">Reason: {rest.reason}</p>}
                    </div>
                  </div>
                );
              })()}

              {/* Basic Predictions */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
                <h2 className="text-2xl font-semibold mb-4">📊 Quick Stats</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm opacity-90 mb-2">Predicted Next 1RM</div>
                    <div className="text-4xl font-bold">{predictNext1RM() || 'N/A'} lbs</div>
                    <div className="text-sm opacity-75 mt-2">
                      Based on your progression trend
                    </div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90 mb-2">Recommended Working Weight</div>
                    <div className="text-4xl font-bold">{calculateRecommendedWeight() || 'N/A'} lbs</div>
                    <div className="text-sm opacity-75 mt-2">
                      80% of predicted 1RM for optimal gains
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </>
          );
        })()}

        {selectedExercise && progressData.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center mb-6">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Progress Data Yet</h3>
            <p className="text-gray-600">
              Start logging workouts for {selectedExercise.name} to see your progress!
            </p>
          </div>
        )}

        {/* Personal Records */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Personal Records</h2>
            <Award className="w-6 h-6 text-yellow-600" />
          </div>
          {personalRecords.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No personal records yet. Keep training!</p>
          ) : (
            <div className="space-y-3">
              {personalRecords.map(pr => (
                <div key={pr.id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-900">{pr.exercise?.name}</div>
                    <div className="text-sm text-gray-600">
                      {pr.record_type.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-600">{pr.value}</div>
                    <div className="text-xs text-gray-600">
                      {new Date(pr.achieved_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Workouts</h2>
          {recentSessions.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No workout sessions yet</p>
          ) : (
            <div className="space-y-3">
              {recentSessions.map(session => (
                <div 
                  key={session.id} 
                  onClick={() => {
                    setSelectedSession(session);
                    fetchSessionDetails(session.id);
                  }}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      setSelectedSession(session);
                      fetchSessionDetails(session.id);
                    }}
                  >
                    <div className="font-semibold text-gray-900">{session.workout?.name || 'Quick Workout'}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(session.start_time).toLocaleDateString()} • {session.total_exercises} exercises • {session.total_sets} sets
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      {session.total_distance > 0 ? (
                        <>
                          <div className="text-lg font-bold text-blue-600">{session.total_distance.toFixed(2)} miles</div>
                          <div className="text-xs text-gray-600">Total Distance</div>
                        </>
                      ) : (
                        <>
                          <div className="text-lg font-bold text-blue-600">{Math.round(session.total_volume || 0)} lbs</div>
                          <div className="text-xs text-gray-600">Total Volume</div>
                        </>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWorkoutSession(session.id, session.workout?.name || 'Quick Workout');
                      }}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedSession.workout?.name || 'Quick Workout'}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(selectedSession.start_time).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedSession(null);
                    setSessionDetails(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              
              {/* Session Stats */}
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedSession.total_exercises || 0}</div>
                  <div className="text-xs text-gray-600">Exercises</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedSession.total_sets || 0}</div>
                  <div className="text-xs text-gray-600">Sets</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{selectedSession.total_reps || 0}</div>
                  <div className="text-xs text-gray-600">Reps</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{Math.round(selectedSession.total_volume || 0)}</div>
                  <div className="text-xs text-gray-600">Volume (lbs)</div>
                </div>
              </div>
            </div>

            {/* Exercise Details */}
            <div className="flex-1 overflow-y-auto p-6">
              {!sessionDetails ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading workout details...</p>
                </div>
              ) : sessionDetails.length === 0 ? (
                <p className="text-center text-gray-600 py-12">No exercise data found</p>
              ) : (
                <div className="space-y-4">
                  {sessionDetails.map((exercise, index) => (
                    <div key={exercise.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{exercise.exercises?.name || 'Unknown Exercise'}</h3>
                          <p className="text-sm text-gray-600">Set {exercise.set_number}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Weight (lbs)</label>
                          <input
                            type="number"
                            value={exercise.weight || 0}
                            onChange={(e) => updateExerciseSet(exercise.id, 'weight', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Reps</label>
                          <input
                            type="number"
                            value={exercise.reps || 0}
                            onChange={(e) => updateExerciseSet(exercise.id, 'reps', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">RPE</label>
                          <input
                            type="number"
                            value={exercise.rpe || 5}
                            onChange={(e) => updateExerciseSet(exercise.id, 'rpe', parseInt(e.target.value))}
                            min="1"
                            max="10"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Volume</label>
                          <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm font-semibold text-gray-900">
                            {Math.round((exercise.weight || 0) * (exercise.reps || 0))} lbs
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FitnessProgress;
