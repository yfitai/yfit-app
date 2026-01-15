import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Check, X, Clock, TrendingUp, Pill } from 'lucide-react'

const BUILD_VERSION = '2026-01-15-daily-average-fix'; // New calculation approach
console.log('MedicationLog loaded - version:', BUILD_VERSION);

export default function MedicationLog({ user }) {
  const [medications, setMedications] = useState([])
  const [supplements, setSupplements] = useState([])
  const [todayLogs, setTodayLogs] = useState([])
  const [stats, setStats] = useState({ 
    medTaken: 0, medTotal: 0, medRate: 0,
    suppTaken: 0, suppTotal: 0, suppRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [user])

  // Recalculate stats whenever medications or supplements change
  useEffect(() => {
    if (medications.length > 0 || supplements.length > 0) {
      calculateStats()
    }
  }, [medications, supplements])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadMedications(),
        loadSupplements(),
        loadTodayLogs()
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('user_medications')
        .select('*, medication:medications(name)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_supplement', false)
        .order('created_at')

      if (error) throw error
      setMedications(data || [])
    } catch (error) {
      console.error('Error loading medications:', error)
    }
  }

  const loadSupplements = async () => {
    try {
      const { data, error } = await supabase
        .from('user_medications')
        .select('*, medication:medications(name)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_supplement', true)
        .order('created_at')

      if (error) throw error
      setSupplements(data || [])
    } catch (error) {
      console.error('Error loading supplements:', error)
    }
  }

  const loadTodayLogs = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { data, error } = await supabase
        .from('medication_logs')
        .select('*, user_medication:user_medications(*, medication:medications(name))')
        .eq('user_id', user.id)
        .gte('scheduled_time', today.toISOString())
        .lt('scheduled_time', tomorrow.toISOString())
        .order('scheduled_time')

      if (error) throw error
      setTodayLogs(data || [])
    } catch (error) {
      console.error('Error loading today logs:', error)
    }
  }

  // NEW APPROACH: Calculate daily adherence percentages and average them
  const calculateStats = async () => {
    try {
      // Get today's date at start of day
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get date 30 days ago
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get all logs from last 30 days
      const { data: allLogs, error } = await supabase
        .from('medication_logs')
        .select('*, user_medication:user_medications(is_supplement, frequency)')
        .eq('user_id', user.id)
        .gte('scheduled_time', thirtyDaysAgo.toISOString())

      if (error) throw error

      console.log('[DEBUG] allLogs from database:', allLogs);
      console.log('[DEBUG] allLogs count:', allLogs?.length || 0);

      // If no logs, show 0%
      if (!allLogs || allLogs.length === 0) {
        setStats({
          medTaken: 0,
          medTotal: 0,
          medRate: 0,
          suppTaken: 0,
          suppTotal: 0,
          suppRate: 0
        });
        return;
      }

      // Group logs by date and type (medication vs supplement)
      const medLogsByDate = {};
      const suppLogsByDate = {};

      allLogs.forEach(log => {
        const logDate = new Date(log.scheduled_time);
        logDate.setHours(0, 0, 0, 0);
        const dateKey = logDate.toISOString();

        if (log.user_medication?.is_supplement) {
          if (!suppLogsByDate[dateKey]) suppLogsByDate[dateKey] = [];
          suppLogsByDate[dateKey].push(log);
        } else {
          if (!medLogsByDate[dateKey]) medLogsByDate[dateKey] = [];
          medLogsByDate[dateKey].push(log);
        }
      });

      // Calculate daily adherence for medications
      const medDailyRates = [];
      let totalMedTaken = 0;
      let totalMedExpected = 0;

      Object.values(medLogsByDate).forEach(dayLogs => {
        const taken = dayLogs.filter(log => log.status === 'taken').length;
        const expected = dayLogs.length;
        totalMedTaken += taken;
        totalMedExpected += expected;
        if (expected > 0) {
          medDailyRates.push((taken / expected) * 100);
        }
      });

      // Calculate daily adherence for supplements
      const suppDailyRates = [];
      let totalSuppTaken = 0;
      let totalSuppExpected = 0;

      Object.values(suppLogsByDate).forEach(dayLogs => {
        const taken = dayLogs.filter(log => log.status === 'taken').length;
        const expected = dayLogs.length;
        totalSuppTaken += taken;
        totalSuppExpected += expected;
        if (expected > 0) {
          suppDailyRates.push((taken / expected) * 100);
        }
      });

      // Average the daily rates
      const medRate = medDailyRates.length > 0
        ? Math.round(medDailyRates.reduce((a, b) => a + b, 0) / medDailyRates.length)
        : 0;

      const suppRate = suppDailyRates.length > 0
        ? Math.round(suppDailyRates.reduce((a, b) => a + b, 0) / suppDailyRates.length)
        : 0;

      console.log('[DEBUG] Med daily rates:', medDailyRates, 'Average:', medRate);
      console.log('[DEBUG] Supp daily rates:', suppDailyRates, 'Average:', suppRate);
      console.log('[DEBUG] Final - medTaken:', totalMedTaken, 'medTotal:', totalMedExpected, 'medRate:', medRate);
      console.log('[DEBUG] Final - suppTaken:', totalSuppTaken, 'suppTotal:', totalSuppExpected, 'suppRate:', suppRate);

      setStats({
        medTaken: totalMedTaken,
        medTotal: totalMedExpected,
        medRate,
        suppTaken: totalSuppTaken,
        suppTotal: totalSuppExpected,
        suppRate
      });
    } catch (error) {
      console.error('Error calculating stats:', error)
    }
  }

  const handleToggleLog = async (logId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'taken' ? 'pending' : 'taken'
      const actualTime = newStatus === 'taken' ? new Date().toISOString() : null

      const { error } = await supabase
        .from('medication_logs')
        .update({ 
          status: newStatus,
          actual_time: actualTime
        })
        .eq('id', logId)

      if (error) throw error

      // Reload data
      await Promise.all([
        loadTodayLogs(),
        calculateStats()
      ])
    } catch (error) {
      console.error('Error toggling log:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Adherence Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-900">Medications</h3>
            <Pill className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-600">{stats.medRate}%</span>
            <span className="text-sm text-blue-600">adherence</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            {stats.medTaken} of {stats.medTotal} doses taken
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-900">Supplements</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-600">{stats.suppRate}%</span>
            <span className="text-sm text-green-600">adherence</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            {stats.suppTaken} of {stats.suppTotal} doses taken
          </p>
        </div>
      </div>

      {/* Today's Medications */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Today's Medications
        </h3>
        
        {todayLogs.filter(log => !log.user_medication?.is_supplement).length === 0 ? (
          <p className="text-gray-500 text-sm">No medications scheduled for today</p>
        ) : (
          <div className="space-y-3">
            {todayLogs
              .filter(log => !log.user_medication?.is_supplement)
              .map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleLog(log.id, log.status)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        log.status === 'taken'
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {log.status === 'taken' && <Check className="w-4 h-4 text-white" />}
                    </button>
                    <div>
                      <p className="font-medium">{log.user_medication?.medication?.name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(log.scheduled_time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  {log.status === 'taken' && log.actual_time && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Taken at {new Date(log.actual_time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Today's Supplements */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Today's Supplements
        </h3>
        
        {todayLogs.filter(log => log.user_medication?.is_supplement).length === 0 ? (
          <p className="text-gray-500 text-sm">No supplements scheduled for today</p>
        ) : (
          <div className="space-y-3">
            {todayLogs
              .filter(log => log.user_medication?.is_supplement)
              .map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleLog(log.id, log.status)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        log.status === 'taken'
                          ? 'bg-green-600 border-green-600'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {log.status === 'taken' && <Check className="w-4 h-4 text-white" />}
                    </button>
                    <div>
                      <p className="font-medium">{log.user_medication?.medication?.name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(log.scheduled_time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  {log.status === 'taken' && log.actual_time && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Taken at {new Date(log.actual_time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
