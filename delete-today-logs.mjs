import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mxggxpoxgqubojvumjlt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14Z2d4cG94Z3F1Ym9qdnVtamx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMjI5NjYsImV4cCI6MjA3MjY5ODk2Nn0.EWlmoH-_kw1A_gbs1rECLWkC30X50IOGx3GDSDNSYE4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteTodayLogs() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  console.log('Deleting logs between:', today.toISOString(), 'and', tomorrow.toISOString())

  // First, check what logs exist for today
  const { data: existingLogs, error: fetchError } = await supabase
    .from('medication_logs')
    .select('*')
    .gte('scheduled_time', today.toISOString())
    .lt('scheduled_time', tomorrow.toISOString())

  if (fetchError) {
    console.error('Error fetching logs:', fetchError)
    return
  }

  console.log('Found', existingLogs?.length || 0, 'logs for today')
  console.log('Logs:', JSON.stringify(existingLogs, null, 2))

  // Delete them
  const { error: deleteError } = await supabase
    .from('medication_logs')
    .delete()
    .gte('scheduled_time', today.toISOString())
    .lt('scheduled_time', tomorrow.toISOString())

  if (deleteError) {
    console.error('Error deleting logs:', deleteError)
  } else {
    console.log('Successfully deleted today\'s logs')
  }
}

deleteTodayLogs()
