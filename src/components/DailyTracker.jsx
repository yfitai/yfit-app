import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Moon, Droplets, Footprints, Heart, Activity, 
  TrendingUp, Calendar, Plus, Check, X 
} from 'lucide-react';

export default function DailyTracker({ user }) {
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
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchTodayLog();
      fetchWeeklyData();
      fetchGoals();
    }
  }, [user]);

  const fetchTodayLog = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('health_metrics_logs')
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
          bp_systolic: data[0].blood_pressure_systolic || '',
          bp_diastolic: data[0].blood_pressure_diastolic || '',
          glucose_mg_dl: data[0].glucose_mg_dl || '',
          notes: data[0].notes || ''
        });
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
        .from('health_metrics_logs')
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
          water: data.water_ml_goal || 2000,
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
        blood_pressure_systolic: formData.bp_systolic ? parseInt(formData.bp_systolic) : null,
        blood_pressure_diastolic: formData.bp_diastolic ? parseInt(formData.bp_diastolic) : null,
        glucose_mg_dl: formData.glucose_mg_dl ? parseInt(formData.glucose_mg_dl) : null,
        notes: formData.notes || null
      };

      let result;
      if (todayLog) {
        // Update existing log
        result = await supabase
          .from('health_metrics_logs')
          .update(logData)
          .eq('id', todayLog.id);
      } else {
        // Insert new log
        result = await supabase
          .from('health_metrics_logs')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
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
            <div className="flex items-center mb-2">
              <Droplets className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-semibold text-gray-900">Water</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formData.water_ml || 0}ml
            </div>
            <div className="text-sm text-gray-600 mb-2">Goal: {goals.water}ml</div>
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
            <div className="flex items-center mb-2">
              <Activity className="w-5 h-5 text-purple-600 mr-2" />
              <span className="font-semibold text-gray-900">Glucose</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formData.glucose_mg_dl || '--'}
            </div>
            <div className="text-sm text-gray-600 mb-2">Goal: {goals.glucose} mg/dL</div>
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
                  💧 Water (ml)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.water_ml}
                  onChange={(e) => setFormData({...formData, water_ml: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="2000"
                />
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
                🩸 Blood Glucose (mg/dL)
              </label>
              <input
                type="number"
                min="0"
                max="600"
                value={formData.glucose_mg_dl}
                onChange={(e) => setFormData({...formData, glucose_mg_dl: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="100"
              />
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : (todayLog ? '✓ Update Log' : '+ Save Log')}
            </button>
          </form>
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
                  {Math.round(weeklyData.reduce((sum, d) => sum + (d.water_ml || 0), 0) / weeklyData.length)}ml
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
                  {Math.round(weeklyData.reduce((sum, d) => sum + (d.blood_pressure_systolic || 0), 0) / weeklyData.filter(d => d.blood_pressure_systolic).length) || '--'}/
                  {Math.round(weeklyData.reduce((sum, d) => sum + (d.blood_pressure_diastolic || 0), 0) / weeklyData.filter(d => d.blood_pressure_diastolic).length) || '--'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Avg Glucose</div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(weeklyData.reduce((sum, d) => sum + (d.glucose_mg_dl || 0), 0) / weeklyData.filter(d => d.glucose_mg_dl).length) || '--'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
