import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mxggxpoxgqubojvumjlt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14Z2d4cG94Z3F1Ym9qdnVtamx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMjI5NjYsImV4cCI6MjA3MjY5ODk2Nn0.EWlmoH-_kw1A_gbs1rECLWkC30X50IOGx3GDSDNSYE4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  // Get a sample log to see what status values exist
  const { data: sampleLogs, error } = await supabase
    .from('medication_logs')
    .select('*')
    .limit(10)

  if (error) {
    console.error('Error fetching logs:', error)
    return
  }

  console.log('Sample logs count:', sampleLogs?.length)
  if (sampleLogs && sampleLogs.length > 0) {
    console.log('First log:', JSON.stringify(sampleLogs[0], null, 2))
    console.log('Status values:', [...new Set(sampleLogs.map(log => log.status))])
  } else {
    console.log('No logs found')
  }
}

checkSchema()
