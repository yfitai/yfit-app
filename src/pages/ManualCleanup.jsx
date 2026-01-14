import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ManualCleanup() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCleanup = async () => {
    setLoading(true)
    setStatus('Starting cleanup...')

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setStatus('❌ Error: Not logged in')
        setLoading(false)
        return
      }

      setStatus('🗑️ Deleting old data...')

      // Delete all data (ignoring errors for tables that don't exist)
      const tables = [
        'workout_sessions',
        'meals',
        'calculated_metrics',
        'user_goals',
        'body_measurements',
        'medication_logs',
        'weight_logs',
        'body_composition_logs',
        'body_measurements_logs',
        'health_metrics_logs',
        'meal_logs'
      ]

      let successCount = 0
      let skipCount = 0

      for (const table of tables) {
        try {
          const { error } = await supabase
            .from(table)
            .delete()
            .eq('user_id', user.id)

          if (error) {
            // Ignore table not found errors
            if (error.code === 'PGRST116' || error.status === 404 || error.status === 406) {
              console.log(`⏭️ Skipped ${table} (doesn't exist)`)
              skipCount++
            } else {
              console.error(`❌ Error deleting from ${table}:`, error)
            }
          } else {
            console.log(`✅ Deleted from ${table}`)
            successCount++
          }
        } catch (err) {
          console.error(`❌ Error with ${table}:`, err)
        }
      }

      setStatus(`✅ Cleanup complete!\n\n✅ Cleared: ${successCount} tables\n⏭️ Skipped: ${skipCount} tables (didn't exist)\n\n✅ Your workout templates, medications, custom foods, and favorites are preserved!\n\nYou can now close this page and start fresh!`)
      setLoading(false)
    } catch (error) {
      console.error('Cleanup error:', error)
      setStatus(`❌ Error: ${error.message}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">🧹 Manual Data Cleanup</h1>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-800 font-medium">⚠️ This will permanently delete:</p>
          <ul className="list-disc list-inside text-yellow-700 mt-2 space-y-1">
            <li>All meal logs & completed workout sessions</li>
            <li>Your current goals and body measurements</li>
            <li>All progress data and analytics</li>
            <li>Medication adherence logs</li>
          </ul>
        </div>

        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <p className="text-green-800 font-medium">✅ This will preserve:</p>
          <ul className="list-disc list-inside text-green-700 mt-2 space-y-1">
            <li>Your workout templates (exercises)</li>
            <li>Your medications list (names, doses, schedules)</li>
            <li>Custom foods & favorites</li>
            <li>Meal templates</li>
          </ul>
        </div>

        {!status && (
          <button
            onClick={handleCleanup}
            disabled={loading}
            className="w-full px-6 py-4 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading ? '🔄 Cleaning up...' : '🗑️ Start Cleanup'}
          </button>
        )}

        {status && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm text-gray-800">{status}</pre>
          </div>
        )}

        <div className="mt-6 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
