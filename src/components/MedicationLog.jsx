import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Check, X, Clock, TrendingUp, Pill } from 'lucide-react'

const BUILD_VERSION = '2026-01-14-v3-FORCE-NEW-BUNDLE'; // Force rebuild
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

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_time', startOfDay.toISOString())
        .lte('scheduled_time', endOfDay.toISOString())
        .order('scheduled_time', { ascending: false })

      if (error) throw error
      setTodayLogs(data || [])
    } catch (error) {
      console.error('Error loading today logs:', error)
    }
  }

  // Updated: 2026-01-14 - Fixed medication adherence calculation
  const calculateStats = async () => {
    try {
      // Get today's date at start of day
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get date 30 days ago
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get all logs from last 30 days (not just 'taken' status)
      const { data: allLogs, error } = await supabase
        .from('medication_logs')
        .select('*, user_medication:user_medications(is_supplement)')
        .eq('user_id', user.id)
        .gte('scheduled_time', thirtyDaysAgo.toISOString())

      if (error) throw error

      // Separate by type and status
      const medLogsTaken = allLogs?.filter(log => !log.user_medication?.is_supplement && log.status === 'taken') || [];
      const suppLogsTaken = allLogs?.filter(log => log.user_medication?.is_supplement && log.status === 'taken') || [];
      
      // Get unique days that have logs for medications
      const daysWithMedLogs = new Set();
      allLogs?.forEach(log => {
        if (!log.user_medication?.is_supplement) {
          const logDate = new Date(log.scheduled_time);
          logDate.setHours(0, 0, 0, 0);
          daysWithMedLogs.add(logDate.toISOString());
        }
      });
      
      // Get unique days that have logs for supplements
      const daysWithSuppLogs = new Set();
      allLogs?.forEach(log => {
        if (log.user_medication?.is_supplement) {
          const logDate = new Date(log.scheduled_time);
          logDate.setHours(0, 0, 0, 0);
          daysWithSuppLogs.add(logDate.toISOString());
        }
      });
      
      const medActiveDays = daysWithMedLogs.size || 1; // At least 1 day to avoid division by zero
      const suppActiveDays = daysWithSuppLogs.size || 1;
      
      // Calculate expected doses based on ACTIVE tracking days for each type
      let medTotal = 0;
      medications.forEach(med => {
        const dosesPerDay = med.frequency?.toLowerCase().includes('twice') ? 2 :
                           med.frequency?.toLowerCase().includes('three') ? 3 :
                           med.frequency?.toLowerCase().includes('four') ? 4 : 1;
        medTotal += medActiveDays * dosesPerDay;
      });
      
      let suppTotal = 0;
      supplements.forEach(supp => {
        const dosesPerDay = supp.frequency?.toLowerCase().includes('twice') ? 2 :
                           supp.frequency?.toLowerCase().includes('three') ? 3 :
                           supp.frequency?.toLowerCase().includes('four') ? 4 : 1;
        suppTotal += suppActiveDays * dosesPerDay;
      });
      
      const medRate = medTotal > 0 ? Math.round((medLogsTaken.length / medTotal) * 100) : 0;
      const suppRate = suppTotal > 0 ? Math.round((suppLogsTaken.length / suppTotal) * 100) : 0;
      
      setStats({
        medTaken: medLogsTaken.length,
        medTotal,
        medRate,
        suppTaken: suppLogsTaken.length,
        suppTotal,
        suppRate
      });
    } catch (error) {
      console.error('Error calculating stats:', error)
    }
  }

  // Helper function to get number of doses per day from frequency
  const getDosesPerDay = (frequency) => {
    if (!frequency) return 1;
    const freq = frequency.toLowerCase();
    if (freq.includes('twice')) return 2;
    if (freq.includes('three')) return 3;
    if (freq.includes('four')) return 4;
    return 1;
  }

  const handleCheckboxChange = async (itemId, isChecked, isSupplement, doseNumber = 1) => {
    try {
      if (isChecked) {
        // Log as taken
        await logItem(itemId, 'taken', doseNumber);
      } else {
        // Remove today's log for this item
        await removeLog(itemId);
      }
      await loadData();
    } catch (error) {
      console.error('Error updating checkbox:', error)
      alert('Failed to update')
    }
  }

  const logItem = async (itemId, status, doseNumber = 1) => {
    // Add a few seconds offset for each dose to make them unique
    const now = new Date();
    now.setSeconds(now.getSeconds() + (doseNumber - 1));
    const scheduledTime = now.toISOString();
    
    const { error } = await supabase
      .from('medication_logs')
      .insert({
        user_medication_id: itemId,
        user_id: user.id,
        scheduled_time: scheduledTime,
        actual_time: scheduledTime,
        status: status
      })

    if (error) throw error
  }

  const removeLog = async (itemId) => {

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Get today's logs for this item
    const { data: todayItemLogs } = await supabase
      .from('medication_logs')
      .select('id')
      .eq('user_medication_id', itemId)
      .eq('user_id', user.id)
      .gte('scheduled_time', startOfDay.toISOString())
      .order('scheduled_time', { ascending: false })
      .limit(1);

    if (!todayItemLogs || todayItemLogs.length === 0) return;

    // Delete the most recent log
    const { error } = await supabase
      .from('medication_logs')
      .delete()
      .eq('id', todayItemLogs[0].id);

    if (error) throw error;
  }

  const getItemDosesTakenToday = (itemId) => {
    return todayLogs.filter(log => 
      log.user_medication_id === itemId && log.status === 'taken'
    ).length;
  }

  const getItemNameFromLog = (log) => {
    const allItems = [...medications, ...supplements];
    const item = allItems.find(i => i.id === log.user_medication_id);
    if (!item) return 'Unknown';
    return item.medication?.name || item.custom_name || 'Unknown';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Daily Tracking</h2>
        <p className="text-gray-600 mt-1">Check off medications and supplements as you take them</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-blue-900">Medications</h3>
            <Pill className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-blue-900">{stats.medRate}%</span>
            <span className="text-sm text-blue-700">adherence</span>
          </div>
          <p className="text-sm text-blue-700">
            {stats.medTaken} of {stats.medTotal} doses taken
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-green-900">Supplements</h3>
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-green-900">{stats.suppRate}%</span>
            <span className="text-sm text-green-700">adherence</span>
          </div>
          <p className="text-sm text-green-700">
            {stats.suppTaken} of {stats.suppTotal} doses taken
          </p>
        </div>
      </div>

      {/* Today's Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Medications */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Pill className="w-5 h-5 text-blue-600" />
            Today's Medications
          </h3>
          {medications.length === 0 ? (
            <p className="text-gray-500 text-sm">No medications added yet</p>
          ) : (
            <div className="space-y-3">
              {medications.map((med) => {
                const dosesPerDay = getDosesPerDay(med.frequency);
                const dosesTaken = getItemDosesTakenToday(med.id);
                
                return (
                  <div
                    key={med.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex gap-2 mt-1">
                      {Array.from({ length: dosesPerDay }).map((_, index) => (
                        <input
                          key={index}
                          type="checkbox"
                          checked={index < dosesTaken}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Only allow checking if this is the next dose
                              if (index === dosesTaken) {
                                handleCheckboxChange(med.id, true, false, index + 1);
                              }
                            } else {
                              // Only allow unchecking the last checked box
                              if (index === dosesTaken - 1) {
                                handleCheckboxChange(med.id, false, false);
                              }
                            }
                          }}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {med.medication?.name || med.custom_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {med.dosage} • {med.frequency}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Supplements */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Today's Supplements
          </h3>
          {supplements.length === 0 ? (
            <p className="text-gray-500 text-sm">No supplements added yet</p>
          ) : (
            <div className="space-y-3">
              {supplements.map((supp) => {
                const dosesPerDay = getDosesPerDay(supp.frequency);
                const dosesTaken = getItemDosesTakenToday(supp.id);
                
                return (
                  <div
                    key={supp.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex gap-2 mt-1">
                      {Array.from({ length: dosesPerDay }).map((_, index) => (
                        <input
                          key={index}
                          type="checkbox"
                          checked={index < dosesTaken}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Only allow checking if this is the next dose
                              if (index === dosesTaken) {
                                handleCheckboxChange(supp.id, true, true, index + 1);
                              }
                            } else {
                              // Only allow unchecking the last checked box
                              if (index === dosesTaken - 1) {
                                handleCheckboxChange(supp.id, false, true);
                              }
                            }
                          }}
                          className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                        />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {supp.medication?.name || supp.custom_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {supp.dosage} • {supp.frequency}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Today's Log */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Activity</h3>
        {todayLogs.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            No activity logged today. Check off items above as you take them!
          </p>
        ) : (
          <div className="space-y-2">
            {todayLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  log.status === 'taken' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {log.status === 'taken' ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {getItemNameFromLog(log)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {log.status === 'taken' ? 'Taken' : 'Missed'} at {new Date(log.scheduled_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
