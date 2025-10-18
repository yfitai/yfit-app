import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Check, X, Clock, Calendar, TrendingUp } from 'lucide-react'

export default function MedicationLog({ user }) {
  const [medications, setMedications] = useState([])
  const [logs, setLogs] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [stats, setStats] = useState({ taken: 0, missed: 0, skipped: 0, adherenceRate: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [user, selectedDate])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadMedications(),
        loadLogs(),
        calculateStats()
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('user_medications')
        .select(`
          *,
          medication:medications(name)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at')

      if (error) throw error
      setMedications(data || [])
    } catch (error) {
      console.error('Error loading medications:', error)
    }
  }

  const loadLogs = async () => {
    try {
      const startOfDay = `${selectedDate}T00:00:00`
      const endOfDay = `${selectedDate}T23:59:59`

      const { data, error } = await supabase
        .from('medication_logs')
        .select(`
          *,
          user_medication:user_medications(
            *,
            medication:medications(name)
          )
        `)
        .eq('user_id', user.id)
        .gte('scheduled_time', startOfDay)
        .lte('scheduled_time', endOfDay)
        .order('scheduled_time')

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error loading logs:', error)
    }
  }

  const calculateStats = async () => {
    try {
      // Get logs for the past 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data, error } = await supabase
        .from('medication_logs')
        .select('status')
        .eq('user_id', user.id)
        .gte('scheduled_time', thirtyDaysAgo.toISOString())

      if (error) throw error

      const taken = data?.filter(log => log.status === 'taken').length || 0
      const missed = data?.filter(log => log.status === 'missed').length || 0
      const skipped = data?.filter(log => log.status === 'skipped').length || 0
      const total = data?.length || 0

      const adherenceRate = total > 0 ? Math.round((taken / total) * 100) : 0

      setStats({ taken, missed, skipped, adherenceRate })
    } catch (error) {
      console.error('Error calculating stats:', error)
    }
  }

  const logDose = async (medicationId, status, notes = '') => {
    try {
      const scheduledTime = new Date().toISOString()
      const actualTime = status === 'taken' ? new Date().toISOString() : null

      const { error } = await supabase
        .from('medication_logs')
        .insert({
          user_medication_id: medicationId,
          user_id: user.id,
          scheduled_time: scheduledTime,
          actual_time: actualTime,
          status: status,
          notes: notes || null
        })

      if (error) throw error

      loadData()
    } catch (error) {
      console.error('Error logging dose:', error)
      alert('Failed to log medication')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'taken':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'missed':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'skipped':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'late':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'taken':
        return <Check className="w-4 h-4" />
      case 'missed':
        return <X className="w-4 h-4" />
      case 'skipped':
        return <Clock className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Medication Adherence Log</h2>
        <p className="text-gray-600 mt-1">Track when you take your medications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900">{stats.taken}</p>
              <p className="text-sm text-green-700">Taken (30d)</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-900">{stats.missed}</p>
              <p className="text-sm text-red-700">Missed (30d)</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-900">{stats.skipped}</p>
              <p className="text-sm text-yellow-700">Skipped (30d)</p>
            </div>
          </div>
        </div>

        <div className={`${stats.adherenceRate >= 80 ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'} border rounded-lg p-4`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${stats.adherenceRate >= 80 ? 'bg-green-100' : 'bg-orange-100'} rounded-lg flex items-center justify-center`}>
              <TrendingUp className={`w-6 h-6 ${stats.adherenceRate >= 80 ? 'text-green-600' : 'text-orange-600'}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${stats.adherenceRate >= 80 ? 'text-green-900' : 'text-orange-900'}`}>
                {stats.adherenceRate}%
              </p>
              <p className={`text-sm ${stats.adherenceRate >= 80 ? 'text-green-700' : 'text-orange-700'}`}>
                Adherence Rate
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Date
        </label>
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Log Medication Section */}
      {medications.length > 0 && (
        <div className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Log Medication Now</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medications.map((med) => (
              <div
                key={med.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <h4 className="font-semibold text-gray-800 mb-2">
                  {med.medication?.name || med.custom_name}
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  {med.dosage} • {med.frequency}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => logDose(med.id, 'taken')}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm"
                  >
                    <Check className="w-4 h-4" />
                    Taken
                  </button>
                  <button
                    onClick={() => logDose(med.id, 'missed')}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm"
                  >
                    <X className="w-4 h-4" />
                    Missed
                  </button>
                  <button
                    onClick={() => logDose(med.id, 'skipped')}
                    className="flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all text-sm"
                  >
                    <Clock className="w-4 h-4" />
                    Skipped
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Log */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Log for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h3>

        {logs.length > 0 ? (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full border ${getStatusColor(log.status)} flex items-center gap-2 text-sm font-medium`}>
                      {getStatusIcon(log.status)}
                      <span className="capitalize">{log.status}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {log.user_medication?.medication?.name || log.user_medication?.custom_name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {log.user_medication?.dosage} • {log.user_medication?.frequency}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {log.actual_time ? (
                      <span>
                        {new Date(log.actual_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : (
                      <span>
                        Scheduled: {new Date(log.scheduled_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
                {log.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Notes:</span> {log.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No medication logs for this date</p>
            <p className="text-sm text-gray-500 mt-1">
              Use the "Log Medication Now" section above to record doses
            </p>
          </div>
        )}
      </div>

      {medications.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Medications to Log</h3>
          <p className="text-gray-500">
            Add medications first to start tracking adherence.
          </p>
        </div>
      )}
    </div>
  )
}
