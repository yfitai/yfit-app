import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { AlertTriangle, CheckCircle, Shield } from 'lucide-react'



export default function InteractionChecker({ user }) {
  const [medications, setMedications] = useState([])
  const [supplements, setSupplements] = useState([])
  const [safetyAlerts, setSafetyAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadMedications(),
        loadSupplements(),
        loadSafetyAlerts()
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
          medication:medications(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_supplement', false)

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
        .select(`
          *,
          medication:medications(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_supplement', true)

      if (error) throw error
      setSupplements(data || [])
    } catch (error) {
      console.error('Error loading supplements:', error)
    }
  }

  const loadSafetyAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('safety_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_acknowledged', false)
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setSafetyAlerts(data || [])
    } catch (error) {
      console.error('Error loading safety alerts:', error)
    }
  }

  const acknowledgeAlert = async (alertId) => {
    try {
      const { error } = await supabase
        .from('safety_alerts')
        .update({
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId)

      if (error) throw error
      loadSafetyAlerts()
    } catch (error) {
      console.error('Error acknowledging alert:', error)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-400',
          text: 'text-red-800',
          icon: 'text-red-600'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-400',
          text: 'text-yellow-800',
          icon: 'text-yellow-600'
        }
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-400',
          text: 'text-blue-800',
          icon: 'text-blue-600'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-400',
          text: 'text-gray-800',
          icon: 'text-gray-600'
        }
    }
  }

  const getAlertTypeLabel = (type) => {
    const labels = {
      interaction: 'Drug Interaction',
      allergy: 'Allergy Alert',
      duplicate: 'Duplicate Therapy',
      dosage: 'Dosage Warning',
      age: 'Age-Related Concern',
      condition: 'Medical Condition Alert',
      other: 'Safety Alert'
    }
    return labels[type] || 'Alert'
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
        <h2 className="text-2xl font-bold text-gray-800">Safety Check</h2>
        <p className="text-gray-600 mt-1">
          Review interactions and safety alerts for your medications
        </p>
      </div>


      {/* Current Medications Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{medications.length}</p>
              <p className="text-sm text-blue-700">Active Medications</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900">{supplements.length}</p>
              <p className="text-sm text-green-700">Active Supplements</p>
            </div>
          </div>
        </div>

        <div className={`${safetyAlerts.length > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${safetyAlerts.length > 0 ? 'bg-red-100' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
              <AlertTriangle className={`w-6 h-6 ${safetyAlerts.length > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${safetyAlerts.length > 0 ? 'text-red-900' : 'text-gray-700'}`}>
                {safetyAlerts.length}
              </p>
              <p className={`text-sm ${safetyAlerts.length > 0 ? 'text-red-700' : 'text-gray-600'}`}>
                Active Alerts
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Alerts */}
      {safetyAlerts.length > 0 ? (
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold text-gray-800">Active Safety Alerts</h3>
          {safetyAlerts.map((alert) => {
            const colors = getSeverityColor(alert.severity)
            return (
              <div
                key={alert.id}
                className={`${colors.bg} border-l-4 ${colors.border} rounded-r-lg p-5`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <AlertTriangle className={`w-6 h-6 ${colors.icon} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium ${colors.text} bg-white rounded`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600">
                          {getAlertTypeLabel(alert.alert_type)}
                        </span>
                      </div>
                      <h4 className={`font-semibold ${colors.text} mb-2`}>
                        {alert.title}
                      </h4>
                      <p className={`text-sm ${colors.text} mb-3`}>
                        {alert.description}
                      </p>
                      {alert.recommendation && (
                        <div className="bg-white rounded-lg p-3 mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Recommendation:
                          </p>
                          <p className="text-sm text-gray-600">
                            {alert.recommendation}
                          </p>
                        </div>
                      )}
                      {alert.metadata && alert.metadata.evidence_level && (
                        <p className="text-xs text-gray-500 mt-2">
                          Evidence Level: {alert.metadata.evidence_level.replace('_', ' ').toUpperCase()}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-all text-sm font-medium flex-shrink-0"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 mb-8">
          <div className="flex items-center justify-center gap-3 text-green-700">
            <CheckCircle className="w-8 h-8" />
            <div>
              <p className="text-lg font-semibold">No Active Safety Alerts</p>
              <p className="text-sm text-green-600 mt-1">
                Your current medications and supplements have no detected interactions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Medications List */}
      {medications.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Medications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medications.map((med) => (
              <div
                key={med.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <h4 className="font-semibold text-gray-800">
                  {med.medication?.name || med.custom_name}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {med.dosage} • {med.frequency}
                </p>
                {med.medication?.drug_class && (
                  <p className="text-xs text-gray-500 mt-1">
                    {med.medication.drug_class}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Supplements List */}
      {supplements.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Supplements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supplements.map((supp) => (
              <div
                key={supp.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <h4 className="font-semibold text-gray-800">
                  {supp.medication?.name || supp.custom_name}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {supp.dosage} • {supp.frequency}
                </p>
                {supp.medication?.drug_class && (
                  <p className="text-xs text-gray-500 mt-1 capitalize">
                    {supp.medication.drug_class}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {medications.length === 0 && supplements.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Medications to Check
          </h3>
          <p className="text-gray-500">
            Add medications or supplements to check for interactions.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Disclaimer:</strong> This interaction checker is for informational purposes only. 
          It does not replace professional medical advice. Always consult your healthcare provider 
          before making changes to your medications. If you experience any adverse effects, seek 
          immediate medical attention.
        </p>
      </div>
    </div>
  )
}
