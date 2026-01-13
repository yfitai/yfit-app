import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, getCurrentUser } from '../lib/supabase'

const UnitPreferenceContext = createContext()

export function UnitPreferenceProvider({ children }) {
  const [unitSystem, setUnitSystem] = useState('imperial') // default to imperial
  const [distanceUnit, setDistanceUnit] = useState('imperial') // default to imperial (mph/miles)
  const [loading, setLoading] = useState(true)

  // Load user's unit preferences from database
  useEffect(() => {
    loadUnitPreferences()
  }, [])

  const loadUnitPreferences = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferred_unit_system, preferred_distance_unit')
        .eq('user_id', user.id)
        .single()

      if (data && !error) {
        setUnitSystem(data.preferred_unit_system || 'imperial')
        setDistanceUnit(data.preferred_distance_unit || 'imperial')
      }
    } catch (error) {
      console.error('Error loading unit preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUnitSystem = async () => {
    const newSystem = unitSystem === 'metric' ? 'imperial' : 'metric'
    setUnitSystem(newSystem)

    // Save to database
    try {
      const user = await getCurrentUser()
      if (!user) return

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preferred_unit_system: newSystem,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('Error saving unit preference:', error)
      }
    } catch (error) {
      console.error('Error updating unit preference:', error)
    }
  }

  const toggleDistanceUnit = async () => {
    const newUnit = distanceUnit === 'metric' ? 'imperial' : 'metric'
    setDistanceUnit(newUnit)

    // Save to database
    try {
      const user = await getCurrentUser()
      if (!user) return

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preferred_distance_unit: newUnit,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('Error saving distance unit preference:', error)
      }
    } catch (error) {
      console.error('Error updating distance unit preference:', error)
    }
  }

  const value = {
    unitSystem,
    toggleUnitSystem,
    distanceUnit,
    toggleDistanceUnit,
    loading,
    isMetric: unitSystem === 'metric',
    isImperial: unitSystem === 'imperial',
    isDistanceMetric: distanceUnit === 'metric',
    isDistanceImperial: distanceUnit === 'imperial'
  }

  return (
    <UnitPreferenceContext.Provider value={value}>
      {children}
    </UnitPreferenceContext.Provider>
  )
}

export function useUnitPreference() {
  const context = useContext(UnitPreferenceContext)
  if (context === undefined) {
    throw new Error('useUnitPreference must be used within a UnitPreferenceProvider')
  }
  return context
}
