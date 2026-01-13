import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase';
import { 
  Moon, Droplets, Footprints, Heart, Activity, 
  TrendingUp, Calendar, Plus, Check, X 
} from 'lucide-react';
import { useUnitPreference } from '../contexts/UnitPreferenceContext';

export default function DailyTracker({ user }) {
  const { units } = useUnitPreference();
  const [loading, setLoading] = useState(true);
  const [todayLog, setTodayLog] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [goals, setGoals] = useState({
    sleep: 8,
    water: 2000,
    steps: 10000,
    bpSystolic: 120,
    bpDiastolic: 80,
    glucose: 100
  });

  const [formData, setFormData] = useState({
    sleep_hours: '',
    sleep_quality: 'good',
    water_ml: '',
    steps: '',
    bp_systolic: '',
    bp_diastolic: '',
    glucose_mg_dl: '',
    weight_kg: '',
    body_fat_percent: '',
    notes: ''
  });

  // Unit preferences - load from localStorage or default based on global units
  const [waterUnit, setWaterUnit] = useState(() => {
    const stored = localStorage.getItem('yfit_water_unit');
    if (stored) return stored;
    // Default based on global Imperial/Metric setting
    return units === 'imperial' ? 'oz' : 'ml';
  }); // 'ml', 'oz', 'cups'
  const [glucoseUnit, setGlucoseUnit] = useState(() => {
    return localStorage.getItem('yfit_glucose_unit') || 'mg/dl';
  }); // 'mg/dl', 'mmol/l'
  const [isDoneForDay, setIsDoneForDay] = useState(false);
  
  // Weekly body measurements state
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [lastMeasurementDate, setLastMeasurementDate] = useState(null);
  const [measurements, setMeasurements] = useState({
    neck_cm: '',
    shoulders_cm: '',
    chest_cm: '',
    waist_cm: '',
    hips_cm: '',
    biceps_cm: '',
    forearms_cm: '',
    thighs_cm: '',
    calves_cm: ''
  });
  const [savingMeasurements, setSavingMeasurements] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTodayLog();
      fetchWeeklyData();
      fetchGoals();
      fetchLastMeasurement();
    }
  }, [user]);

  // Reset isDoneForDay at midnight
  useEffect(() => {
    const checkMidnight = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        setIsDoneForDay(false);
        fetchTodayLog();
      }
    }, 60000); // Check every minute
    return () => clearInterval(checkMidnight);
  }, []);

  const fetchTodayLog = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', `${today}T00:00:00`)
        .lte('logged_at', `${today}T23:59:59`)
        .order('logged_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setTodayLog(data[0]);
        setFormData({
          sleep_hours: data[0].sleep_hours || '',
          sleep_quality: data[0].sleep_quality || 'good',
          water_ml: data[0].water_ml || '',
          steps: data[0].steps || '',
          bp_systolic: data[0].bp_systolic || '',
          bp_diastolic: data[0].bp_diastolic || '',
          glucose_mg_dl: data[0].glucose_mg_dl || '',
          notes: data[0].notes || ''
        });
        // Check if log is marked as done (has notes with done marker or has all main fields)
        const hasMainFields = data[0].sleep_hours && data[0].water_ml && data[0].steps;
        if (hasMainFields) {
          setIsDoneForDay(true);
        }
      }
    } catch (error) {
      console.error('Error fetching today log:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyData = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', sevenDaysAgo.toISOString())
        .order('logged_at', { ascending: true });

      if (error) throw error;
      setWeeklyData(data || []);
    } catch (error) {
      console.error('Error fetching weekly data:', error);
    }
  };

  const fetchLastMeasurement = async () => {
    try {
      const { data, error } = await supabase
        .from('progress_measurements')
        .select('*')
        .eq('user_id', user.id)
        .in('measurement_type', ['neck', 'shoulders', 'chest', 'waist', 'hips', 'biceps', 'forearms', 'thighs', 'calves'])
        .order('measured_at', { ascending: false })
        .limit(9);

      if (error) throw error;

      if (data && data.length > 0) {
        setLastMeasurementDate(new Date(data[0].measured_at).toLocaleDateString());
        const measurementData = {};
        data.forEach(m => {
          measurementData[`${m.measurement_type}_cm`] = m.measurement_value;
        });
        setMeasurements(measurementData);
      }
    } catch (error) {
      console.error('Error fetching last measurement:', error);
    }
  };

  const saveMeasurements = async () => {
    setSavingMeasurements(true);
    try {
      const now = new Date().toISOString();
      
      // Save each measurement as a separate row
      const measurementTypes = ['neck', 'shoulders', 'chest', 'waist', 'hips', 'biceps', 'forearms', 'thighs', 'calves'];
      const promises = measurementTypes.map(type => {
        const value = measurements[`${type}_cm`];
        if (value) {
          return supabase.from('progress_measurements').insert({
            user_id: user.id,
            measurement_type: type,
            measurement_value: parseFloat(value),
            unit: units === 'imperial' ? 'in' : 'cm',
            measured_at: now
          });
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      setLastMeasurementDate(new Date().toLocaleDateString());
      setShowMeasurements(false);
      alert('✅ Measurements saved!');
    } catch (error) {
      console.error('Error saving measurements:', error);
      alert('❌ Error saving measurements');
    } finally {
      setSavingMeasurements(false);
    }
  };

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setGoals({
          sleep: data.sleep_hours_goal || 8,
         water: data.water_goal_ml || 2000,
          steps: data.steps_goal || 10000,
          bpSystolic: data.bp_systolic_goal || 120,
          bpDiastolic: data.bp_diastolic_goal || 80,
          glucose: data.glucose_goal || 100
        });
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const logData = {
        user_id: user.id,
        logged_at: new Date().toISOString(),
        sleep_hours: formData.sleep_hours ? parseFloat(formData.sleep_hours) : null,
        sleep_quality: formData.sleep_quality,
        water_ml: formData.water_ml ? parseInt(formData.water_ml) : null,
        steps: formData.steps ? parseInt(formData.steps) : null,
        bp_systolic: formData.bp_systolic ? parseInt(formData.bp_systolic) : null,
        bp_diastolic: formData.bp_diastolic ? parseInt(formData.bp_diastolic) : null,
        glucose_mg_dl: formData.glucose_mg_dl ? parseInt(formData.glucose_mg_dl) : null,
        notes: formData.notes || null
      };

      let result;
      if (todayLog) {
        // Update existing log
        result = await supabase
          .from('daily_logs')
          .update(logData)
          .eq('id', todayLog.id);
      } else {
        // Insert new log
        result = await supabase
          .from('daily_logs')
          .insert([logData]);
      }

      if (result.error) throw result.error;

      alert(todayLog ? 'Daily log updated!' : 'Daily log saved!');
      fetchTodayLog();
      fetchWeeklyData();
    } catch (error) {
      console.error('Error saving log:', error);
      alert('Error saving log: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (value, goal) => {
    if (!value || !goal) return 0;
    return Math.min(100, (value / goal) * 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Water conversion functions
  const convertWaterToMl = (value, unit) => {
    if (!value) return 0;
    const val = parseFloat(value);
    if (unit === 'ml') return val;
    if (unit === 'oz') return val * 29.5735; // 1 oz = 29.5735 ml
    if (unit === 'cups') return val * 236.588; // 1 cup = 236.588 ml
    return val;
  };

  const convertWaterFromMl = (mlValue, unit) => {
    if (!mlValue) return 0;
    const val = parseFloat(mlValue);
    if (unit === 'ml') return Math.round(val);
    if (unit === 'oz') return Math.round(val / 29.5735);
    if (unit === 'cups') return Math.round(val / 236.588 * 10) / 10; // 1 decimal for cups
    return val;
  };

  const getWaterDisplayValue = () => {
    return convertWaterFromMl(formData.water_ml, waterUnit);
  };

  const getWaterGoalDisplay = () => {
    return convertWaterFromMl(goals.water, waterUnit);
  };

  const addWater = (amount) => {
    const currentMl = parseFloat(formData.water_ml) || 0;
    const addMl = convertWaterToMl(amount, waterUnit);
    setFormData({...formData, water_ml: currentMl + addMl});
  };

  // Glucose conversion functions
  const convertGlucoseToMgDl = (value, unit) => {
    if (!value) return '';
    const val = parseFloat(value);
    if (unit === 'mg/dl') return val;
    if (unit === 'mmol/l') return val * 18.0182; // 1 mmol/L = 18.0182 mg/dL
    return val;
  };

  const convertGlucoseFromMgDl = (mgDlValue, unit) => {
    if (!mgDlValue) return '';
    const val = parseFloat(mgDlValue);
    if (unit === 'mg/dl') return Math.round(val);
    if (unit === 'mmol/l') return Math.round(val / 18.0182 * 10) / 10; // 1 decimal
    return val;
  };

  const getGlucoseDisplayValue = () => {
    return convertGlucoseFromMgDl(formData.glucose_mg_dl, glucoseUnit);
  };

  const getGlucoseGoalDisplay = () => {
    return convertGlucoseFromMgDl(goals.glucose, glucoseUnit);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-2 sm:p-6 overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Daily Tracker</h1>
          <p className="text-gray-600">Track your daily health metrics and habits</p>
        </div>

     

        {/* Today's Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {/* Sleep */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center mb-2">
              <Moon className="w-5 h-5 text-indigo-600 mr-2" />
              <span className="font-semibold text-gray-900">Sleep</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formData.sleep_hours || 0}h
            </div>
            <div className="text-sm text-gray-600 mb-2">Goal: {goals.sleep}h</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getProgressColor(calculateProgress(formData.sleep_hours, goals.sleep))}`}
                style={{ width: `${calculateProgress(formData.sleep_hours, goals.sleep)}%` }}
              />
            </div>
          </div>

          {/* Water */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Droplets className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-semibold text-gray-900">Water</span>
              </div>
              <select
                value={waterUnit}
                onChange={(e) => {
                  const newUnit = e.target.value;
                  setWaterUnit(newUnit);
                  localStorage.setItem('yfit_water_unit', newUnit);
                }}
                className="text-xs px-2 py-1 border border-gray-300 rounded"
              >
                <option value="ml">ml</option>
                <option value="oz">oz</option>
                <option value="cups">cups</option>
              </select>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {getWaterDisplayValue()} {waterUnit}
            </div>
            <div className="text-sm text-gray-600 mb-2">Goal: {getWaterGoalDisplay()} {waterUnit}</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getProgressColor(calculateProgress(formData.water_ml, goals.water))}`}
                style={{ width: `${calculateProgress(formData.water_ml, goals.water)}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center mb-2">
              <Footprints className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-semibold text-gray-900">Steps</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formData.steps || 0}
            </div>
            <div className="text-sm text-gray-600 mb-2">Goal: {goals.steps}</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getProgressColor(calculateProgress(formData.steps, goals.steps))}`}
                style={{ width: `${calculateProgress(formData.steps, goals.steps)}%` }}
              />
            </div>
          </div>

          {/* Blood Pressure */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center mb-2">
              <Heart className="w-5 h-5 text-red-600 mr-2" />
              <span className="font-semibold text-gray-900">BP</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formData.bp_systolic || '--'}/{formData.bp_diastolic || '--'}
            </div>
            <div className="text-sm text-gray-600 mb-2">Goal: {goals.bpSystolic}/{goals.bpDiastolic}</div>
            <div className="text-xs text-gray-500">
              {formData.bp_systolic && formData.bp_systolic <= goals.bpSystolic ? '✓ Good' : 'Monitor'}
            </div>
          </div>

          {/* Blood Glucose */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Activity className="w-5 h-5 text-purple-600 mr-2" />
                <span className="font-semibold text-gray-900">Glucose</span>
              </div>
              <select
                value={glucoseUnit}
                onChange={(e) => {
                  const newUnit = e.target.value;
                  setGlucoseUnit(newUnit);
                  localStorage.setItem('yfit_glucose_unit', newUnit);
                }}
                className="text-xs px-2 py-1 border border-gray-300 rounded"
              >
                <option value="mg/dl">mg/dL</option>
                <option value="mmol/l">mmol/L</option>
              </select>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {getGlucoseDisplayValue() || '--'}
            </div>
            <div className="text-sm text-gray-600 mb-2">Goal: {getGlucoseGoalDisplay()} {glucoseUnit}</div>
            <div className="text-xs text-gray-500">
              {formData.glucose_mg_dl && formData.glucose_mg_dl <= goals.glucose ? '✓ Good' : 'Monitor'}
            </div>
          </div>
        </div>

        {/* Logging Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {todayLog ? '📝 Update Today\'s Log' : '➕ Log Today\'s Metrics'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sleep */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  😴 Sleep Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={formData.sleep_hours}
                  onChange={(e) => setFormData({...formData, sleep_hours: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="8.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sleep Quality
                </label>
                <select
                  value={formData.sleep_quality}
                  onChange={(e) => setFormData({...formData, sleep_quality: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="poor">Poor</option>
                  <option value="fair">Fair</option>
                  <option value="good">Good</option>
                  <option value="excellent">Excellent</option>
                </select>
              </div>
            </div>

            {/* Water & Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💧 Water - Add Throughout Day ({waterUnit})
                </label>
                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-gray-600 mb-1">Current Total:</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {getWaterDisplayValue()} {waterUnit}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => addWater(waterUnit === 'ml' ? 250 : waterUnit === 'oz' ? 8 : 1)}
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition"
                  >
                    + {waterUnit === 'ml' ? '250ml' : waterUnit === 'oz' ? '8oz' : '1 cup'}
                  </button>
                  <button
                    type="button"
                    onClick={() => addWater(waterUnit === 'ml' ? 500 : waterUnit === 'oz' ? 16 : 2)}
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition"
                  >
                    + {waterUnit === 'ml' ? '500ml' : waterUnit === 'oz' ? '16oz' : '2 cups'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, water_ml: 0})}
                    className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🚶 Steps
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.steps}
                  onChange={(e) => setFormData({...formData, steps: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="10000"
                />
              </div>
            </div>

            {/* Blood Pressure */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🩺 Blood Pressure - Systolic
                </label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={formData.bp_systolic}
                  onChange={(e) => setFormData({...formData, bp_systolic: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="120"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Pressure - Diastolic
                </label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={formData.bp_diastolic}
                  onChange={(e) => setFormData({...formData, bp_diastolic: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="80"
                />
              </div>
            </div>

            {/* Blood Glucose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🩸 Blood Glucose ({glucoseUnit})
              </label>
              <input
                type="number"
                min="0"
                step={glucoseUnit === 'mmol/l' ? '0.1' : '1'}
                value={getGlucoseDisplayValue()}
                onChange={(e) => {
                  const mgDlValue = convertGlucoseToMgDl(e.target.value, glucoseUnit);
                  setFormData({...formData, glucose_mg_dl: mgDlValue});
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder={glucoseUnit === 'mg/dl' ? '100' : '5.6'}
              />
            </div>

            {/* Weight & Body Fat */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⚖️ Weight ({units === 'imperial' ? 'lbs' : 'kg'})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.weight_kg ? (units === 'imperial' ? (parseFloat(formData.weight_kg) * 2.20462).toFixed(1) : formData.weight_kg) : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const kgValue = units === 'imperial' ? (parseFloat(value) / 2.20462).toFixed(1) : value;
                    setFormData({...formData, weight_kg: kgValue});
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={units === 'imperial' ? '155.0' : '70.5'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💪 Body Fat (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.body_fat_percent}
                  onChange={(e) => setFormData({...formData, body_fat_percent: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="15.0"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                rows="3"
                placeholder="Any notes about today..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="submit"
                disabled={loading || isDoneForDay}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Saving...' : (todayLog ? '✓ Update Log' : '+ Save Log')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isDoneForDay) {
                    handleSubmit(new Event('submit'));
                    setIsDoneForDay(true);
                    alert('✅ Day complete! Your log is saved and locked.');
                  }
                }}
                disabled={isDoneForDay}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  isDoneForDay 
                    ? 'bg-green-100 text-green-700 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                }`}
              >
                {isDoneForDay ? '✓ Done for Today' : '🎯 Done for Day'}
              </button>
            </div>
            {isDoneForDay && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-green-700 font-medium">✅ Great job! Your daily log is complete and saved.</p>
                <p className="text-sm text-green-600 mt-1">You can still update if needed, or come back tomorrow for a new day!</p>
              </div>
            )}
          </form>
        </div>

        {/* Weekly Body Measurements */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">📏 Weekly Body Measurements</h2>
              {lastMeasurementDate && (
                <p className="text-sm text-gray-600 mt-1">Last measured: {lastMeasurementDate}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowMeasurements(!showMeasurements)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              {showMeasurements ? 'Hide' : 'Update Measurements'}
            </button>
          </div>

          {showMeasurements && (
            <div className="mt-6 space-y-6">
              {/* Torso */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Torso</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Neck ({units === 'imperial' ? 'in' : 'cm'})</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.neck_cm}
                      onChange={(e) => setMeasurements({...measurements, neck_cm: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Shoulders ({units === 'imperial' ? 'in' : 'cm'})</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.shoulders_cm}
                      onChange={(e) => setMeasurements({...measurements, shoulders_cm: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chest ({units === 'imperial' ? 'in' : 'cm'})</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.chest_cm}
                      onChange={(e) => setMeasurements({...measurements, chest_cm: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </div>

              {/* Core */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Core</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Waist ({units === 'imperial' ? 'in' : 'cm'})</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.waist_cm}
                      onChange={(e) => setMeasurements({...measurements, waist_cm: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hips ({units === 'imperial' ? 'in' : 'cm'})</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.hips_cm}
                      onChange={(e) => setMeasurements({...measurements, hips_cm: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </div>

              {/* Arms */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Arms</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Biceps ({units === 'imperial' ? 'in' : 'cm'})</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.biceps_cm}
                      onChange={(e) => setMeasurements({...measurements, biceps_cm: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Forearms ({units === 'imperial' ? 'in' : 'cm'})</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.forearms_cm}
                      onChange={(e) => setMeasurements({...measurements, forearms_cm: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </div>

              {/* Legs */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Legs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Thighs ({units === 'imperial' ? 'in' : 'cm'})</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.thighs_cm}
                      onChange={(e) => setMeasurements({...measurements, thighs_cm: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Calves ({units === 'imperial' ? 'in' : 'cm'})</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.calves_cm}
                      onChange={(e) => setMeasurements({...measurements, calves_cm: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={saveMeasurements}
                disabled={savingMeasurements}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {savingMeasurements ? 'Saving...' : '💾 Save Measurements'}
              </button>
            </div>
          )}
        </div>

        {/* Weekly Summary */}
        {weeklyData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📈 7-Day Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Avg Sleep</div>
                <div className="text-2xl font-bold text-indigo-600">
                  {(weeklyData.reduce((sum, d) => sum + (d.sleep_hours || 0), 0) / weeklyData.length).toFixed(1)}h
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Avg Water</div>
                <div className="text-2xl font-bold text-blue-600">
                  {(() => {
                    const avgMl = weeklyData.reduce((sum, d) => sum + (d.water_ml || 0), 0) / weeklyData.length;
                    const displayValue = convertWaterFromMl(avgMl, waterUnit);
                    return `${Math.round(displayValue)}${waterUnit}`;
                  })()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Avg Steps</div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(weeklyData.reduce((sum, d) => sum + (d.steps || 0), 0) / weeklyData.length)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Avg BP</div>
                <div className="text-2xl font-bold text-red-600">
                  {Math.round(weeklyData.reduce((sum, d) => sum + (d.bp_systolic || 0), 0) / weeklyData.filter(d => d.bp_systolic).length) || '--'}/
                  {Math.round(weeklyData.reduce((sum, d) => sum + (d.bp_diastolic || 0), 0) / weeklyData.filter(d => d.bp_diastolic).length) || '--'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Avg Glucose</div>
                <div className="text-2xl font-bold text-purple-600">
                  {(() => {
                    const filteredData = weeklyData.filter(d => d.glucose_mg_dl);
                    if (filteredData.length === 0) return '--';
                    const avgMgDl = filteredData.reduce((sum, d) => sum + (d.glucose_mg_dl || 0), 0) / filteredData.length;
                    const displayValue = convertGlucoseFromMgDl(avgMgDl, glucoseUnit);
                    return glucoseUnit === 'mmol/l' ? `${displayValue.toFixed(1)} ${glucoseUnit}` : `${Math.round(displayValue)} ${glucoseUnit}`;
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
