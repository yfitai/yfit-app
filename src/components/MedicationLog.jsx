import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Check, X, Clock, TrendingUp, Pill } from 'lucide-react'

const BUILD_VERSION = '2026-01-15-daily-average-fix-v2'; // New calculation approach
console.log('🔥🔥🔥 MedicationLog loaded - version:', BUILD_VERSION, '🔥🔥🔥');

export default function MedicationLog({ user }) {
  const [medications, setMedications] = useState([])
  const [supplements, setSupplements] = useState([])
  const [todayLogs, setTodayLogs] = useState([])
  const [stats, setStats] = useState({ 
    medTaken: 0, medTotal: 0, medRate: 0,
    suppTaken: 0, suppTotal: 0, suppRate: 0
  })
  const [dailyBreakdown, setDailyBreakdown] = useState([])
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
      // Load medications and supplements first, get their data
      console.log('[DEBUG] loadData - Starting to load medications and supplements...')
      const medsPromise = loadMedications()
      const suppsPromise = loadSupplements()
      
      const [medsData, suppsData] = await Promise.all([medsPromise, suppsPromise])
      
      console.log('[DEBUG] loadData - medsData:', medsData, 'length:', medsData?.length)
      console.log('[DEBUG] loadData - suppsData:', suppsData, 'length:', suppsData?.length)
      
      // Then load today's logs, passing the loaded data
      await loadTodayLogs(medsData, suppsData)
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
        .order('created_at', { ascending: false })

      if (error) throw error
      console.log('[DEBUG] Loaded medications:', JSON.stringify(data, null, 2))
      setMedications(data || [])
      return data || [] // Return the data
    } catch (error) {
      console.error('Error loading medications:', error)
      return []
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
        .order('created_at', { ascending: false })

      if (error) throw error
      console.log('[DEBUG] Loaded supplements:', JSON.stringify(data, null, 2))
      setSupplements(data || [])
      return data || [] // Return the data
    } catch (error) {
      console.error('Error loading supplements:', error)
      return []
    }
  }

  const loadTodayLogs = async (medsData, suppsData) => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Use passed data or load fresh if not provided
      const meds = medsData || medications
      const supps = suppsData || supplements
      
      // Calculate how many logs SHOULD exist based on current medications
      let expectedLogCount = 0
      const allMeds = [...meds, ...supps]
      
      for (const med of allMeds) {
        let dosesPerDay = 1
        const freq = (med.frequency || '').toLowerCase()
        if (freq.includes('twice') || freq.includes('2')) {
          dosesPerDay = 2
        } else if (freq.includes('three') || freq.includes('3')) {
          dosesPerDay = 3
        } else if (freq.includes('four') || freq.includes('4')) {
          dosesPerDay = 4
        }
        expectedLogCount += dosesPerDay
      }
      
      console.log('[DEBUG] Expected log count for today:', expectedLogCount)

      // Check if today's logs already exist
      const { data: existingLogs, error: checkError } = await supabase
        .from('medication_logs')
        .select('*, user_medication:user_medications(*, medication:medications(name))')
        .eq('user_id', user.id)
        .gte('scheduled_time', today.toISOString())
        .lt('scheduled_time', tomorrow.toISOString())
        .order('scheduled_time')
      
      if (checkError) throw checkError
      
      const actualLogCount = existingLogs?.length || 0
      console.log('[DEBUG] Actual log count in database:', actualLogCount)
      
      // If log count matches expected, use existing logs
      if (actualLogCount === expectedLogCount && actualLogCount > 0) {
        console.log('[DEBUG] Log count matches, using existing logs')
        setTodayLogs(existingLogs)
        return
      }
      
      // Log count mismatch or no logs - regenerate
      console.log('[DEBUG] Log count mismatch or no logs. Regenerating...')
      
      // Delete existing logs for today
      if (actualLogCount > 0) {
        console.log('[DEBUG] Deleting', actualLogCount, 'existing logs...')
        const { error: deleteError } = await supabase
          .from('medication_logs')
          .delete()
          .eq('user_id', user.id)
          .gte('scheduled_time', today.toISOString())
          .lt('scheduled_time', tomorrow.toISOString())
        
        if (deleteError) {
          console.error('[DEBUG] Delete error:', deleteError)
          throw deleteError
        }
      }
      
      // Generate fresh logs
      await generateTodayLogs(meds, supps)
      
      // Fetch the newly generated logs
      const { data: newLogs, error: refetchError } = await supabase
        .from('medication_logs')
        .select('*, user_medication:user_medications(*, medication:medications(name))')
        .eq('user_id', user.id)
        .gte('scheduled_time', today.toISOString())
        .lt('scheduled_time', tomorrow.toISOString())
        .order('scheduled_time')
      
      if (refetchError) throw refetchError
      console.log('[DEBUG] Today logs after generation:', JSON.stringify(newLogs, null, 2))
      setTodayLogs(newLogs || [])
    } catch (error) {
      console.error('Error loading today logs:', error)
    }
  }

  const generateTodayLogs = async (medsData, suppsData) => {
    try {
      console.log('[DEBUG] generateTodayLogs called with medsData:', medsData?.length, 'suppsData:', suppsData?.length)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Get all active medications and supplements from parameters
      const allMeds = [...(medsData || []), ...(suppsData || [])]
      console.log('[DEBUG] generateTodayLogs - allMeds count:', allMeds.length)
      
      const logsToCreate = []
      
      for (const med of allMeds) {
        // Determine how many doses per day based on frequency
        let dosesPerDay = 1
        const freq = (med.frequency || '').toLowerCase()
        console.log(`[DEBUG] Med: ${med.custom_name || med.medication?.name}, Frequency: "${med.frequency}", Lowercase: "${freq}"`)
        if (freq.includes('twice') || freq.includes('2')) {
          dosesPerDay = 2
          console.log(`[DEBUG] Matched twice daily, dosesPerDay = 2`)
        } else if (freq.includes('three') || freq.includes('3')) {
          dosesPerDay = 3
        } else if (freq.includes('four') || freq.includes('4')) {
          dosesPerDay = 4
        }
        console.log(`[DEBUG] Final dosesPerDay for ${med.custom_name || med.medication?.name}: ${dosesPerDay}`)

        // Create log entries for each dose
        for (let i = 0; i < dosesPerDay; i++) {
          const scheduledTime = new Date(today)
          // Spread doses throughout the day
          if (dosesPerDay === 2) {
            scheduledTime.setHours(i === 0 ? 8 : 20) // 8 AM and 8 PM
          } else if (dosesPerDay === 3) {
            scheduledTime.setHours(i === 0 ? 8 : i === 1 ? 14 : 20) // 8 AM, 2 PM, 8 PM
          } else {
            scheduledTime.setHours(8) // 8 AM for once daily
          }

          logsToCreate.push({
            user_id: user.id,
            user_medication_id: med.id,
            scheduled_time: scheduledTime.toISOString(),
            status: 'skipped', // Valid statuses: 'taken', 'missed', 'skipped', 'late'
            actual_time: null
          })
        }
      }

      if (logsToCreate.length > 0) {
        console.log('[DEBUG] About to insert logs:', JSON.stringify(logsToCreate, null, 2))
        const { data, error } = await supabase
          .from('medication_logs')
          .insert(logsToCreate)
          .select()
        
        if (error) {
          console.error('[DEBUG] Insert error:', JSON.stringify(error, null, 2))
          throw error
        }
        console.log('[DEBUG] Generated', logsToCreate.length, 'logs for today')
        console.log('[DEBUG] Insert response:', data)
      }
    } catch (error) {
      console.error('Error generating today logs:', error)
    }
  }

  // NEW APPROACH: Calculate daily adherence percentages and average them
  // This version generates expected doses for each day based on active medications
  const calculateStats = async () => {
    // Calculate adherence statistics for medications and supplements
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
        .select('*, user_medication:user_medications(medication_id, is_supplement, frequency, medication:medications(name))')
        .eq('user_id', user.id)
        .gte('scheduled_time', thirtyDaysAgo.toISOString())

      if (error) throw error

      console.log('[DEBUG] allLogs from database:', allLogs);
      console.log('[DEBUG] allLogs count:', allLogs?.length || 0);

      // Get all active medications and supplements
      const allMeds = [...medications, ...supplements]
      console.log('[DEBUG] Active medications:', medications.length, 'supplements:', supplements.length)

      // If no active medications, show 0%
      if (allMeds.length === 0) {
        setStats({
          medTaken: 0,
          medTotal: 0,
          medRate: 0,
          suppTaken: 0,
          suppTotal: 0,
          suppRate: 0
        });
        setDailyBreakdown([]);
        return;
      }

      // Group actual logs by date
      const logsByDate = {};
      (allLogs || []).forEach(log => {
        const logDate = new Date(log.scheduled_time);
        logDate.setHours(0, 0, 0, 0);
        const dateKey = logDate.toISOString();
        if (!logsByDate[dateKey]) logsByDate[dateKey] = [];
        logsByDate[dateKey].push(log);
      });

      // Get all unique dates that have logs
      const loggedDates = Object.keys(logsByDate).map(d => new Date(d)).sort((a, b) => b - a);
      
      console.log('[DEBUG] Found', loggedDates.length, 'days with logs');

      // For each logged date, calculate expected vs actual
      const breakdown = [];
      let totalMedTaken = 0;
      let totalMedExpected = 0;
      let totalSuppTaken = 0;
      let totalSuppExpected = 0;
      const medDailyRates = [];
      const suppDailyRates = [];

      for (const date of loggedDates) {
        const dateKey = new Date(date);
        dateKey.setHours(0, 0, 0, 0);
        const dateKeyStr = dateKey.toISOString();
        
        // Get actual logs for this date
        const dayLogs = logsByDate[dateKeyStr] || [];
        
        // Generate expected doses for this date
        const expectedMeds = [];
        const expectedSupps = [];
        
        for (const med of allMeds) {
          // Check if medication was active on this date
          const medStartDate = med.start_date ? new Date(med.start_date) : null;
          if (medStartDate && medStartDate > dateKey) {
            continue; // Medication not started yet on this date
          }
          
          // Determine how many doses per day
          let dosesPerDay = 1;
          const freq = (med.frequency || '').toLowerCase();
          if (freq.includes('twice') || freq.includes('2')) {
            dosesPerDay = 2;
          } else if (freq.includes('three') || freq.includes('3')) {
            dosesPerDay = 3;
          } else if (freq.includes('four') || freq.includes('4')) {
            dosesPerDay = 4;
          }
          
          // Add to expected list
          for (let i = 0; i < dosesPerDay; i++) {
            const expectedDose = {
              medication_id: med.medication_id,
              medication_name: med.medication?.name || 'Unknown',
              user_medication_id: med.id,
              is_supplement: med.is_supplement,
              dose_number: i + 1
            };
            
            if (med.is_supplement) {
              expectedSupps.push(expectedDose);
            } else {
              expectedMeds.push(expectedDose);
            }
          }
        }
        
        // Match actual logs against expected doses
        const medLogs = [];
        const suppLogs = [];
        
        // Separate actual logs by type
        dayLogs.forEach(log => {
          if (log.user_medication?.is_supplement) {
            suppLogs.push(log);
          } else {
            medLogs.push(log);
          }
        });
        
        // Calculate medication adherence for this day
        const medTaken = medLogs.filter(l => l.status === 'taken').length;
        const medExpected = expectedMeds.length;
        const medMissed = Math.max(0, medExpected - medTaken);
        const medRate = medExpected > 0 ? Math.round((medTaken / medExpected) * 100) : 0;
        
        // Calculate supplement adherence for this day
        const suppTaken = suppLogs.filter(l => l.status === 'taken').length;
        const suppExpected = expectedSupps.length;
        const suppMissed = Math.max(0, suppExpected - suppTaken);
        const suppRate = suppExpected > 0 ? Math.round((suppTaken / suppExpected) * 100) : 0;
        
        // Identify which medications were missed
        const takenMedIds = new Set(medLogs.filter(l => l.status === 'taken').map(l => l.user_medication?.medication_id));
        const missedMeds = expectedMeds.filter(exp => !takenMedIds.has(exp.medication_id));
        
        const takenSuppIds = new Set(suppLogs.filter(l => l.status === 'taken').map(l => l.user_medication?.medication_id));
        const missedSupps = expectedSupps.filter(exp => !takenSuppIds.has(exp.medication_id));
        
        breakdown.push({
          date: dateKey,
          medLogs,
          medTaken,
          medTotal: medExpected,
          medMissed,
          medRate,
          missedMeds,
          suppLogs,
          suppTaken,
          suppTotal: suppExpected,
          suppMissed,
          suppRate,
          missedSupps
        });
        
        // Accumulate totals
        totalMedTaken += medTaken;
        totalMedExpected += medExpected;
        totalSuppTaken += suppTaken;
        totalSuppExpected += suppExpected;
        
        if (medExpected > 0) medDailyRates.push(medRate);
        if (suppExpected > 0) suppDailyRates.push(suppRate);
      }
      
      // Calculate overall adherence as average of daily rates
      const medRate = medDailyRates.length > 0
        ? Math.round(medDailyRates.reduce((a, b) => a + b, 0) / medDailyRates.length)
        : 0;
      
      const suppRate = suppDailyRates.length > 0
        ? Math.round(suppDailyRates.reduce((a, b) => a + b, 0) / suppDailyRates.length)
        : 0;
      
      // Calculate today's adherence separately
      const todayKey = new Date();
      todayKey.setHours(0, 0, 0, 0);
      const todayData = breakdown.find(d => d.date.getTime() === todayKey.getTime());
      
      const todayMedTaken = todayData?.medTaken || 0;
      const todayMedTotal = todayData?.medTotal || 0;
      const todayMedRate = todayData?.medRate || 0;
      const todaySuppTaken = todayData?.suppTaken || 0;
      const todaySuppTotal = todayData?.suppTotal || 0;
      const todaySuppRate = todayData?.suppRate || 0;
      
      console.log('[DEBUG] Med daily rates:', medDailyRates, 'Average:', medRate);
      console.log('[DEBUG] Supp daily rates:', suppDailyRates, 'Average:', suppRate);
      console.log('[DEBUG] Today - medTaken:', todayMedTaken, 'medTotal:', todayMedTotal, 'medRate:', todayMedRate);
      console.log('[DEBUG] Today - suppTaken:', todaySuppTaken, 'suppTotal:', todaySuppTotal, 'suppRate:', todaySuppRate);
      console.log('[DEBUG] Overall - medRate:', medRate, 'suppRate:', suppRate, 'daysTracked:', loggedDates.length);
      
      setDailyBreakdown(breakdown);
      setStats({
        // Today's stats
        todayMedTaken,
        todayMedTotal,
        todayMedRate,
        todaySuppTaken,
        todaySuppTotal,
        todaySuppRate,
        // Overall stats
        overallMedRate: medRate,
        overallSuppRate: suppRate,
        daysTracked: loggedDates.length
      });
    } catch (error) {
      console.error('Error calculating stats:', error)
    }
  }

  const handleToggleLog = async (logId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'taken' ? 'skipped' : 'taken'
      const actualTime = newStatus === 'taken' ? new Date().toISOString() : null

      const { error } = await supabase
        .from('medication_logs')
        .update({ 
          status: newStatus,
          actual_time: actualTime
        })
        .eq('id', logId)

      if (error) throw error

      // Reload today's logs (will use existing ones, not regenerate)
      await loadTodayLogs()
      // Recalculate stats
      await calculateStats()
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Medications */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-900">Today's Medications</h3>
            <Pill className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-600">{stats.todayMedRate}%</span>
            <span className="text-sm text-blue-600">adherence</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            {stats.todayMedTaken} of {stats.todayMedTotal} doses taken today
          </p>
        </div>

        {/* Overall Medication Adherence */}
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-900">Overall Medications</h3>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-600">{stats.overallMedRate}%</span>
            <span className="text-sm text-blue-600">average</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Across {stats.daysTracked} days tracked
          </p>
        </div>

        {/* Today's Supplements */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-900">Today's Supplements</h3>
            <Pill className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-600">{stats.todaySuppRate}%</span>
            <span className="text-sm text-green-600">adherence</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            {stats.todaySuppTaken} of {stats.todaySuppTotal} doses taken today
          </p>
        </div>

        {/* Overall Supplement Adherence */}
        <div className="bg-green-100 border border-green-300 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-900">Overall Supplements</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-600">{stats.overallSuppRate}%</span>
            <span className="text-sm text-green-600">average</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Across {stats.daysTracked} days tracked
          </p>
        </div>
      </div>

      {/* Today's Medications */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Today's Medications
        </h3>
        
        {medications.length === 0 ? (
          <p className="text-gray-500 text-sm">No medications scheduled for today</p>
        ) : (
          <div className="space-y-3">
            {medications.map(med => {
              const medLogs = todayLogs.filter(log => 
                log.user_medication_id === med.id && !log.user_medication?.is_supplement
              )
              console.log(`[DEBUG] ${med.custom_name || med.medication?.name}: ${medLogs.length} logs, frequency: ${med.frequency}`)
              return (
                <div key={med.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {medLogs.map(log => (
                    <button
                      key={log.id}
                      onClick={() => handleToggleLog(log.id, log.status)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        log.status === 'taken'
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {log.status === 'taken' && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                  <p className="font-medium">{med.custom_name || med.medication?.name || 'Unknown'}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Today's Supplements */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Today's Supplements
        </h3>
        
        {supplements.length === 0 ? (
          <p className="text-gray-500 text-sm">No supplements scheduled for today</p>
        ) : (
          <div className="space-y-3">
            {supplements.map(supp => {
              const suppLogs = todayLogs.filter(log => 
                log.user_medication_id === supp.id && log.user_medication?.is_supplement
              )
              return (
                <div key={supp.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {suppLogs.map(log => (
                    <button
                      key={log.id}
                      onClick={() => handleToggleLog(log.id, log.status)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        log.status === 'taken'
                          ? 'bg-green-600 border-green-600'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {log.status === 'taken' && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                  <p className="font-medium">{supp.custom_name || supp.medication?.name || 'Unknown'}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Daily Breakdown */}
      {dailyBreakdown.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Breakdown</h3>
          
          <div className="space-y-4">
            {dailyBreakdown.map((day, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">
                    {day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </h4>
                </div>

                {/* Medications for this day */}
                {day.medTotal > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">Medications</span>
                      <span className={`text-sm font-semibold ${
                        day.medRate === 100 ? 'text-green-600' : 
                        day.medRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {day.medRate}% ({day.medTaken}/{day.medTotal})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {/* Show taken medications */}
                      {day.medLogs.filter(log => log.status === 'taken').map(log => (
                        <div 
                          key={log.id}
                          className="text-xs px-2 py-1 rounded bg-green-100 text-green-800"
                        >
                          {log.user_medication?.medication?.name} ✓
                        </div>
                      ))}
                      {/* Show missed medications */}
                      {day.missedMeds && day.missedMeds.map((missed, idx) => (
                        <div 
                          key={`missed-${idx}`}
                          className="text-xs px-2 py-1 rounded bg-red-100 text-red-800"
                        >
                          {missed.medication_name} ✗
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
                      <span className={`text-sm font-semibold ${
                        day.suppRate === 100 ? 'text-green-600' : 
                        day.suppRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {day.suppRate}% ({day.suppTaken}/{day.suppTotal})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {/* Show taken supplements */}
                      {day.suppLogs.filter(log => log.status === 'taken').map(log => (
                        <div 
                          key={log.id}
                          className="text-xs px-2 py-1 rounded bg-green-100 text-green-800"
                        >
                          {log.user_medication?.medication?.name} ✓
                        </div>
                      ))}
                      {/* Show missed supplements */}
                      {day.missedSupps && day.missedSupps.map((missed, idx) => (
                        <div 
                          key={`missed-supp-${idx}`}
                          className="text-xs px-2 py-1 rounded bg-red-100 text-red-800"
                        >
                          {missed.medication_name} ✗
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
