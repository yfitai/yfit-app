import { useState, useEffect } from 'react'
import { Health } from 'capacitor-health'
import { Capacitor } from '@capacitor/core'
import { Activity, Heart, Moon, Footprints, Zap, RefreshCw, Check, AlertCircle } from 'lucide-react'

export default function WearablesSync({ user, onSyncComplete }) {
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [syncStatus, setSyncStatus] = useState(null)
  const [error, setError] = useState(null)
  const [isAvailable, setIsAvailable] = useState(false)
  const [permissions, setPermissions] = useState({
    steps: false,
    heartRate: false,
    sleep: false,
    workouts: false,
    calories: false
  })

  useEffect(() => {
    checkAvailability()
    loadLastSync()
  }, [])

  const checkAvailability = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        setError('Wearables sync only available on mobile devices')
        return
      }

      const available = await Health.isAvailable()
      setIsAvailable(available)

      if (available) {
        await checkPermissions()
      }
    } catch (err) {
      console.error('Error checking health availability:', err)
      setError('Health data not available on this device')
    }
  }

  const checkPermissions = async () => {
    try {
      // Check if we have permissions for each data type
      const perms = {
        steps: true, // Assume granted, will fail gracefully if not
        heartRate: true,
        sleep: true,
        workouts: true,
        calories: true
      }
      setPermissions(perms)
    } catch (err) {
      console.error('Error checking permissions:', err)
    }
  }

  const requestPermissions = async () => {
    try {
      setSyncing(true)
      setError(null)

      // Request all permissions
      await Health.requestAuthorization({
        read: [
          'steps',
          'distance',
          'calories',
          'heart_rate',
          'sleep',
          'activity'
        ],
        write: ['activity', 'calories']
      })

      await checkPermissions()
      setSyncing(false)
      return true
    } catch (err) {
      console.error('Error requesting permissions:', err)
      setError('Failed to get health data permissions')
      setSyncing(false)
      return false
    }
  }

  const loadLastSync = () => {
    try {
      const stored = localStorage.getItem('yfit_last_wearables_sync')
      if (stored) {
        setLastSync(new Date(stored))
      }
    } catch (err) {
      console.error('Error loading last sync:', err)
    }
  }

  const syncHealthData = async () => {
    try {
      setSyncing(true)
      setError(null)
      setSyncStatus('Requesting permissions...')

      // Request permissions first
      const hasPermissions = await requestPermissions()
      if (!hasPermissions) {
        return
      }

      const now = new Date()
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)

      const syncedData = {}

      // Sync Steps
      setSyncStatus('Syncing steps...')
      try {
        const stepsData = await Health.queryAggregated({
          startDate: yesterday.toISOString(),
          endDate: now.toISOString(),
          dataType: 'steps',
          interval: 'day'
        })
        syncedData.steps = stepsData.reduce((sum, day) => sum + (day.value || 0), 0)
      } catch (err) {
        console.error('Error syncing steps:', err)
      }

      // Sync Heart Rate
      setSyncStatus('Syncing heart rate...')
      try {
        const heartData = await Health.query({
          startDate: yesterday.toISOString(),
          endDate: now.toISOString(),
          dataType: 'heart_rate'
        })
        if (heartData.length > 0) {
          const avgHeartRate = heartData.reduce((sum, reading) => sum + reading.value, 0) / heartData.length
          syncedData.heartRate = Math.round(avgHeartRate)
        }
      } catch (err) {
        console.error('Error syncing heart rate:', err)
      }

      // Sync Sleep
      setSyncStatus('Syncing sleep...')
      try {
        const sleepData = await Health.queryAggregated({
          startDate: yesterday.toISOString(),
          endDate: now.toISOString(),
          dataType: 'sleep',
          interval: 'day'
        })
        if (sleepData.length > 0) {
          // Convert minutes to hours
          syncedData.sleep = Math.round((sleepData[0].value / 60) * 10) / 10
        }
      } catch (err) {
        console.error('Error syncing sleep:', err)
      }

      // Sync Calories
      setSyncStatus('Syncing calories...')
      try {
        const caloriesData = await Health.queryAggregated({
          startDate: yesterday.toISOString(),
          endDate: now.toISOString(),
          dataType: 'calories',
          interval: 'day'
        })
        syncedData.calories = caloriesData.reduce((sum, day) => sum + (day.value || 0), 0)
      } catch (err) {
        console.error('Error syncing calories:', err)
      }

      // Sync Workouts
      setSyncStatus('Syncing workouts...')
      try {
        const workoutsData = await Health.query({
          startDate: yesterday.toISOString(),
          endDate: now.toISOString(),
          dataType: 'activity'
        })
        syncedData.workouts = workoutsData.length
      } catch (err) {
        console.error('Error syncing workouts:', err)
      }

      // Save last sync time
      localStorage.setItem('yfit_last_wearables_sync', now.toISOString())
      setLastSync(now)

      // Notify parent component
      if (onSyncComplete) {
        onSyncComplete(syncedData)
      }

      setSyncStatus('Sync complete!')
      setTimeout(() => {
        setSyncStatus(null)
        setSyncing(false)
      }, 2000)

    } catch (err) {
      console.error('Error syncing health data:', err)
      setError('Failed to sync health data: ' + err.message)
      setSyncing(false)
      setSyncStatus(null)
    }
  }

  const formatLastSync = () => {
    if (!lastSync) return 'Never'
    
    const now = new Date()
    const diff = now - lastSync
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  if (!Capacitor.isNativePlatform()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">
              Mobile Only Feature
            </h3>
            <p className="text-sm text-yellow-800">
              Wearables sync is only available on the mobile app. Install YFIT on your phone to sync data from Apple Health or Google Fit.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Wearables Sync
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {Capacitor.getPlatform() === 'ios' ? 'Apple Health' : 'Google Fit'}
          </p>
        </div>
        <button
          onClick={syncHealthData}
          disabled={syncing || !isAvailable}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
            syncing || !isAvailable
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {/* Sync Status */}
      {syncStatus && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 flex items-center gap-2">
            {syncStatus.includes('complete') ? (
              <Check className="w-4 h-4" />
            ) : (
              <RefreshCw className="w-4 h-4 animate-spin" />
            )}
            {syncStatus}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        </div>
      )}

      {/* Last Sync */}
      <div className="text-sm text-gray-600 mb-4">
        Last synced: <span className="font-medium text-gray-900">{formatLastSync()}</span>
      </div>

      {/* Data Types */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Footprints className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">Steps</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Heart className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">Heart Rate</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Moon className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">Sleep</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">Calories</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          {Capacitor.getPlatform() === 'ios' 
            ? 'Make sure your Apple Watch or fitness tracker is synced with Apple Health.'
            : 'Make sure your fitness tracker is connected to Google Fit.'}
        </p>
      </div>
    </div>
  )
}
