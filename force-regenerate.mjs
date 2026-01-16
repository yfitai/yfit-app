import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  `https://${process.env.VITE_SUPABASE_URL}.supabase.co`,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Delete all logs for today
const today = new Date()
today.setHours(0, 0, 0, 0)
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)

console.log('Deleting logs for today:', today.toISOString())

const { data, error } = await supabase
  .from('medication_logs')
  .delete()
  .gte('scheduled_time', today.toISOString())
  .lt('scheduled_time', tomorrow.toISOString())

if (error) {
  console.error('Error:', error)
} else {
  console.log('Deleted', data?.length || 0, 'logs')
  console.log('Now refresh the page to see new logs generated')
}
