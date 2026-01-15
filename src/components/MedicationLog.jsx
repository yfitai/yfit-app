import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Check, X, Clock, TrendingUp, Pill, Calendar } from 'lucide-react'

const BUILD_VERSION = '2026-01-15-daily-breakdown-v2';
console.log('MedicationLog loaded - version:', BUILD_VERSION);

export default function MedicationLog({ user }) {
  const [medications, setMedications] = useState([])
  const [supplements, setSupplements] = useState([])
  const [todayLogs, setTodayLogs] = useState([])
  const [dailyBreakdown, setDailyBreakdown] = useState([])
  const [stats, setStats] = useState({ 
    medDaysLogged: 0,
    medAvgRate: 0,
    suppDaysLogged: 0,
    suppAvgRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [user])

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

  const loadSupplements = async () {
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

  const calculateStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: allLogs, error } = await supabase
        .from('medication_logs')
        .select('*, user_medication:user_medications(is_supplement, frequency)')
        .eq('user_id', user.id)
        .gte('scheduled_time', thirtyDaysAgo.toISOString())
        .order('scheduled_time', { ascending: false })

      if (error) throw error

      if (!allLogs || allLogs.length === 0) {
        setStats({
          medDaysLogged: 0,
          medAvgRate: 0,
          suppDaysLogged: 0,
          suppAvgRate: 0
        });
        setDailyBreakdown([]);
        return;
      }

      // Group logs by date
      const logsByDate = {};
      
      allLogs.forEach(log => {
        const logDate = new Date(log.scheduled_time);
        logDate.setHours(0, 0, 0, 0);
        const dateKey = logDate.toISOString().split('T')[0];

        if (!logsByDate[dateKey]) {
          logsByDate[dateKey] = {
            date: logDate,
            medications: [],
            supplements: []
          };
        }

        if (log.user_medication?.is_supplement) {
          logsByDate[dateKey].supplements.push(log);
        } else {
          logsByDate[dateKey].medications.push(log);
        }
      });

      // Calculate daily percentages
      const breakdown = [];
      const medDailyRates = [];
      const suppDailyRates = [];

      Object.entries(logsByDate).forEach(([dateKey, dayData]) => {
        const medTaken = dayData.medications.filter(l => l.status === 'taken').length;
        const medTotal = dayData.medications.length;
        const medRate = medTotal > 0 ? Math.round((medTaken / medTotal) * 100) : 0;

        const suppTaken = dayData.supplements.filter(l => l.status === 'taken').length;
        const suppTotal = dayData.supplements.length;
        const suppRate = suppTotal > 0 ? Math.round((suppTaken / suppTotal) * 100) : 0;

        if (medTotal > 0) medDailyRates.push(medRate);
        if (suppTotal > 0) suppDailyRates.push(suppRate);

        breakdown.push({
          date: dayData.date,
          dateKey,
          medTaken,
          medTotal,
          medRate,
          suppTaken,
          suppTotal,
          suppRate,
          medications: dayData.medications,
          supplements: dayData.supplements
        });
      });

      // Calculate overall averages
      const medAvgRate = medDailyRates.length > 0
        ? Math.round(medDailyRates.reduce((a, b) => a + b, 0) / medDailyRates.length)
        : 0;

      const suppAvgRate = suppDailyRates.length > 0
        ? Math.round(suppDailyRates.reduce((a, b) => a + b, 0) / suppDailyRates.length)
        : 0;

      setStats({
        medDaysLogged: medDailyRates.length,
        medAvgRate,
        suppDaysLogged: suppDailyRates.length,
        suppAvgRate
      });

      setDailyBreakdown(breakdown);

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

      await Promise.all([
        loadTodayLogs(),
        calculateStats()
      ])
    } catch (error) {
      console.error('Error toggling log:', error)
    }
  }

  const formatDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) return 'Today';
    if (compareDate.getTime() === yesterday.getTime()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
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
      {/* Overall Adherence Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-900">Medications</h3>
            <Pill className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-600">{stats.medAvgRate}%</span>
            <span className="text-sm text-blue-600">average adherence</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            {stats.medDaysLogged} {stats.medDaysLogged === 1 ? 'day' : 'days'} logged
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-900">Supplements</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-600">{stats.suppAvgRate}%</span>
            <span className="text-sm text-green-600">average adherence</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            {stats.suppDaysLogged} {stats.suppDaysLogged === 1 ? 'day' : 'days'} logged
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

      {/* Daily Breakdown */}
      {dailyBreakdown.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Daily Breakdown
          </h3>
          
          <div className="space-y-4">
            {dailyBreakdown.map((day) => (
              <div key={day.dateKey} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{formatDate(day.date)}</h4>
                  <span className="text-sm text-gray-500">{day.date.toLocaleDateString('en-US')}</span>
                </div>

                {/* Medications for this day */}
                {day.medTotal > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">Medications</span>
                      <span className={`text-sm font-semibold ${day.medRate === 100 ? 'text-green-600' : day.medRate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {day.medRate}% ({day.medTaken}/{day.medTotal})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {day.medications.map(log => (
                        <div 
                          key={log.id}
                          className={`text-xs px-2 py-1 rounded ${
                            log.status === 'taken' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {log.user_medication?.medication?.name} {log.status === 'taken' ? '✓' : '✗'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Supplements for this day */}
                {day.suppTotal > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-900">Supplements</span>
                      <span className={`text-sm font-semibold ${day.suppRate === 100 ? 'text-green-600' : day.suppRate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {day.suppRate}% ({day.suppTaken}/{day.suppTotal})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {day.supplements.map(log => (
                        <div 
                          key={log.id}
                          className={`text-xs px-2 py-1 rounded ${
                            log.status === 'taken' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {log.user_medication?.medication?.name} {log.status === 'taken' ? '✓' : '✗'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
