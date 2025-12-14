import React, { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { syncGoogleFitData, initiateGoogleFitAuth } from '../lib/googleFit'
import { supabase } from '../lib/supabase'
import './WearablesSync.css'

const WearablesSync = ({ onDataSynced }) => {
  const [platform, setPlatform] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [error, setError] = useState(null)
  const [healthData, setHealthData] = useState(null)
  const [googleFitToken, setGoogleFitToken] = useState(null)

  const GOOGLE_CLIENT_ID = '298223107294-67tf18uqbddio22vl86gc87prcejb9s7.apps.googleusercontent.com'

  useEffect(() => {
    const currentPlatform = Capacitor.getPlatform()
    setPlatform(currentPlatform)
    checkConnectionStatus()
    loadLastSyncTime()
  }, [])

  const checkConnectionStatus = async () => {
    try {
      const currentPlatform = Capacitor.getPlatform()
      
      if (currentPlatform === 'android') {
        const token = localStorage.getItem('googleFitAccessToken')
        if (token) {
          setGoogleFitToken(token)
          setIsConnected(true)
        }
      }
    } catch (err) {
      console.error('Error checking connection status:', err)
    }
  }

  const loadLastSyncTime = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('wearable_syncs')
        .select('synced_at')
        .eq('user_id', user.id)
        .order('synced_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setLastSync(new Date(data.synced_at))
      }
    } catch (err) {
      console.error('Error loading last sync time:', err)
    }
  }

  const connectHealthService = async () => {
    setError(null)
    setIsConnecting(true)
    
    try {
      if (platform === 'ios') {
        setError('Apple Health sync coming soon for iOS users!')
      } else if (platform === 'android') {
        const accessToken = await initiateGoogleFitAuth(GOOGLE_CLIENT_ID)
        
        if (accessToken) {
          localStorage.setItem('googleFitAccessToken', accessToken)
          setGoogleFitToken(accessToken)
          setIsConnected(true)
          setTimeout(() => syncData(), 1000)
        }
      } else {
        setError('Wearables sync is only available on iOS and Android devices.')
      }
    } catch (err) {
      console.error('Error connecting to health service:', err)
      setError('Failed to connect: ' + err.message)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectHealthService = () => {
    if (platform === 'android') {
      localStorage.removeItem('googleFitAccessToken')
      setGoogleFitToken(null)
    }
    setIsConnected(false)
    setHealthData(null)
    setLastSync(null)
  }

  const syncGoogleFit = async () => {
    if (!googleFitToken) {
      throw new Error('Not connected to Google Fit')
    }

    try {
      const data = await syncGoogleFitData(googleFitToken)
      return data
    } catch (err) {
      if (err.message?.includes('401') || err.message?.includes('invalid')) {
        localStorage.removeItem('googleFitAccessToken')
        setGoogleFitToken(null)
        setIsConnected(false)
        throw new Error('Google Fit session expired. Please reconnect.')
      }
      throw err
    }
  }

  const syncData = async () => {
    if (!isConnected) {
      setError('Please connect to your health service first.')
      return
    }

    setIsSyncing(true)
    setError(null)

    try {
      let data
      
      if (platform === 'ios') {
        throw new Error('Apple Health sync coming soon!')
      } else if (platform === 'android') {
        data = await syncGoogleFit()
      } else {
        throw new Error('Unsupported platform')
      }

      setHealthData(data)
      setLastSync(new Date(data.syncedAt))

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('wearable_syncs').insert({
          user_id: user.id,
          platform: platform,
          steps: data.steps,
          heart_rate: data.heartRate,
          sleep_hours: data.sleep,
          synced_at: data.syncedAt
        })
      }

      if (onDataSynced) {
        onDataSynced(data)
      }

      setError(null)
    } catch (err) {
      console.error('Error syncing data:', err)
      setError('Sync failed: ' + err.message)
    } finally {
      setIsSyncing(false)
    }
  }

  const getPlatformName = () => {
    if (platform === 'ios') return 'Apple Health'
    if (platform === 'android') return 'Google Fit'
    return 'Health Service'
  }

  const formatLastSync = () => {
    if (!lastSync) return 'Never'
    
    const now = new Date()
    const diff = now - lastSync
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  if (platform === 'web') {
    return (
      <div className="wearables-sync">
        <div className="sync-unavailable">
          <p>⌚ Wearables sync is only available on mobile devices</p>
        </div>
      </div>
    )
  }

  return (
    <div className="wearables-sync">
      <div className="sync-header">
        <h3>⌚ Wearables Sync</h3>
        <span className="platform-badge">{getPlatformName()}</span>
      </div>

      {!isConnected ? (
        <div className="sync-connect">
          <p>Connect your {getPlatformName()} to automatically sync:</p>
          <ul>
            <li>📊 Daily steps</li>
            <li>❤️ Heart rate</li>
            <li>😴 Sleep hours</li>
          </ul>
          <button 
            className="btn-connect"
            onClick={connectHealthService}
            disabled={isConnecting}
          >
            {isConnecting ? '⏳ Connecting...' : `Connect ${getPlatformName()}`}
          </button>
        </div>
      ) : (
        <div className="sync-connected">
          <div className="sync-status">
            <span className="status-indicator connected">●</span>
            <span>Connected to {getPlatformName()}</span>
          </div>

          {healthData && (
            <div className="health-data-preview">
              <div className="data-item">
                <span className="data-label">Steps</span>
                <span className="data-value">{healthData.steps?.toLocaleString() || '—'}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Heart Rate</span>
                <span className="data-value">{healthData.heartRate ? `${healthData.heartRate} bpm` : '—'}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Sleep</span>
                <span className="data-value">{healthData.sleep ? `${healthData.sleep} hrs` : '—'}</span>
              </div>
            </div>
          )}

          <div className="sync-actions">
            <button 
              className="btn-sync"
              onClick={syncData}
              disabled={isSyncing}
            >
              {isSyncing ? '⏳ Syncing...' : '🔄 Sync Now'}
            </button>
            <button 
              className="btn-disconnect"
              onClick={disconnectHealthService}
            >
              Disconnect
            </button>
          </div>

          <div className="last-sync">
            Last synced: {formatLastSync()}
          </div>
        </div>
      )}

      {error && (
        <div className="sync-error">
          ⚠️ {error}
        </div>
      )}
    </div>
  )
}

export default WearablesSync
