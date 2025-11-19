import { useState, useEffect } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, Award, Calendar, Dumbbell, Target, 
  ChevronRight, Filter, Download, X, Edit2
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
    avgFormScore: 0
  });
  const [timeRange, setTimeRange] = useState('30'); // days
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);

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

      // Fetch personal records
      const { data: prsData } = await supabase
        .from('exercise_personal_records')
        .select(`
          *,
          exercises(name)
        `)
        .eq('user_id', user.id)
        .eq('is_current', true)
        .order('achieved_at', { ascending: false });
      setPersonalRecords(prsData || []);

      // Calculate overall stats
      const totalWorkouts = sessionsData?.length || 0;
      const totalVolume = sessionsData?.reduce((sum, s) => sum + (s.total_volume || 0), 0) || 0;
      const totalReps = sessionsData?.reduce((sum, s) => sum + (s.total_reps || 0), 0) || 0;

      // Fetch form analysis average
      const { data: formData } = await supabase
        .from('form_analysis_sessions')
        .select('average_form_score')
        .eq('user_id', user.id)
        .eq('analysis_status', 'completed');
      
      const avgFormScore = formData?.length > 0
        ? formData.reduce((sum, f) => sum + (f.average_form_score || 0), 0) / formData.length
        : 0;

      setStats({
        totalWorkouts,
        totalVolume: Math.round(totalVolume),
        totalReps,
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
            {exercises.map(exercise => (
              <button
                key={exercise.id}
                onClick={() => setSelectedExercise(exercise)}
                className={`p-3 rounded-lg border-2 transition-colors text-left ${
                  selectedExercise?.id === exercise.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="font-semibold text-gray-900 text-sm">{exercise.name}</div>
              </button>
            ))}
          </div>
        </div>

        {selectedExercise && progressData.length > 0 && (
          <>
            {/* Strength Progression Chart */}
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

            {/* Volume Chart */}
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

            {/* Predictive Analytics */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white mb-6">
              <h2 className="text-2xl font-semibold mb-4">AI-Powered Predictions</h2>
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
          </>
        )}

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
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors">
                  <div>
                    <div className="font-semibold text-gray-900">{session.workout?.name || 'Quick Workout'}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(session.start_time).toLocaleDateString()} • {session.total_exercises} exercises • {session.total_sets} sets
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">{Math.round(session.total_volume || 0)} lbs</div>
                    <div className="text-xs text-gray-600">Total Volume</div>
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
