/**
 * Google Fit API Integration
 * Uses REST API to fetch health data from Google Fit
 */

import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

const GOOGLE_FIT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.sleep.read'
]

/**
 * Initiate Google Fit OAuth flow
 */
export async function initiateGoogleFitAuth(clientId ) {
  const platform = Capacitor.getPlatform()
  
  // Use localhost for redirect
  const redirectUri = platform === 'android' 
    ? 'https://localhost/' 
    : 'http://localhost:5173/'
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: GOOGLE_FIT_SCOPES.join(' ' ),
    include_granted_scopes: 'true',
    state: 'google_fit_auth'
  })
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString( )}`
  
  // Open in-app browser
  await Browser.open({ 
    url: authUrl,
    presentationStyle: 'popover'
  })
  
  // Listen for the redirect
  return new Promise((resolve, reject) => {
    const listener = Browser.addListener('browserPageLoaded', async () => {
      const url = await Browser.getUrl()
      
      if (url && url.includes('#access_token=')) {
        // Extract token from URL
        const hash = url.split('#')[1]
        const params = new URLSearchParams(hash)
        const accessToken = params.get('access_token')
        
        if (accessToken) {
          // Close browser
          await Browser.close()
          listener.remove()
          resolve(accessToken)
        }
      }
    })
    
    // Handle browser close
    Browser.addListener('browserFinished', () => {
      listener.remove()
      reject(new Error('OAuth cancelled by user'))
    })
  })
}

/**
 * Fetch steps data from Google Fit
 */
export async function getSteps(accessToken, startDate, endDate) {
  try {
    const response = await fetch(
      'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aggregateBy: [{
            dataTypeName: 'com.google.step_count.delta',
            dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
          }],
          bucketByTime: { durationMillis: 86400000 }, // 1 day
          startTimeMillis: startDate.getTime( ),
          endTimeMillis: endDate.getTime()
        })
      }
    )
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch steps')
    }
    
    // Sum up all steps
    let totalSteps = 0
    data.bucket?.forEach(bucket => {
      bucket.dataset?.forEach(dataset => {
        dataset.point?.forEach(point => {
          totalSteps += point.value?.[0]?.intVal || 0
        })
      })
    })
    
    return totalSteps
  } catch (error) {
    console.error('Error fetching steps:', error)
    throw error
  }
}

/**
 * Fetch heart rate data from Google Fit
 */
export async function getHeartRate(accessToken, startDate, endDate) {
  try {
    const response = await fetch(
      'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aggregateBy: [{
            dataTypeName: 'com.google.heart_rate.bpm'
          }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: startDate.getTime( ),
          endTimeMillis: endDate.getTime()
        })
      }
    )
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch heart rate')
    }
    
    // Calculate average heart rate
    let sum = 0
    let count = 0
    data.bucket?.forEach(bucket => {
      bucket.dataset?.forEach(dataset => {
        dataset.point?.forEach(point => {
          const hr = point.value?.[0]?.fpVal
          if (hr) {
            sum += hr
            count++
          }
        })
      })
    })
    
    return count > 0 ? Math.round(sum / count) : null
  } catch (error) {
    console.error('Error fetching heart rate:', error)
    throw error
  }
}

/**
 * Fetch sleep data from Google Fit
 */
export async function getSleep(accessToken, startDate, endDate) {
  try {
    const response = await fetch(
      'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aggregateBy: [{
            dataTypeName: 'com.google.sleep.segment'
          }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: startDate.getTime( ),
          endTimeMillis: endDate.getTime()
        })
      }
    )
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch sleep')
    }
    
    // Calculate total sleep hours
    let totalMinutes = 0
    data.bucket?.forEach(bucket => {
      bucket.dataset?.forEach(dataset => {
        dataset.point?.forEach(point => {
          const start = point.startTimeNanos / 1000000
          const end = point.endTimeNanos / 1000000
          totalMinutes += (end - start) / 60000
        })
      })
    })
    
    return totalMinutes > 0 ? Math.round((totalMinutes / 60) * 10) / 10 : null
  } catch (error) {
    console.error('Error fetching sleep:', error)
    throw error
  }
}

/**
 * Fetch all health data from Google Fit
 */
export async function syncGoogleFitData(accessToken) {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  
  try {
    const [steps, heartRate, sleep] = await Promise.all([
      getSteps(accessToken, yesterday, now),
      getHeartRate(accessToken, yesterday, now),
      getSleep(accessToken, yesterday, now)
    ])
    
    return {
      steps,
      heartRate,
      sleep,
      syncedAt: now.toISOString()
    }
  } catch (error) {
    console.error('Error syncing Google Fit data:', error)
    throw error
  }
}
