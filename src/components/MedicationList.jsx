import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Pill, Edit, Trash2, AlertCircle, Calendar, User, RefreshCw } from 'lucide-react'

export default function MedicationList({ user }) {
  const [medications, setMedications] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => {
    loadMedications()
  }, [user])

  const loadMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('user_medications')
        .select(`
          *,
          medication:medications(*),
          prescriber:medical_providers(name)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMedications(data || [])
    } catch (error) {
      console.error('Error loading medications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (medication) => {
    setEditingId(medication.id)
    setEditForm({
      dosage: medication.dosage,
      frequency: medication.frequency,
      notes: medication.notes || ''
    })
  }

  const handleSaveEdit = async (id) => {
    try {
      const { error } = await supabase
        .from('user_medications')
        .update(editForm)
        .eq('id', id)

      if (error) throw error
      
      setEditingId(null)
      loadMedications()
    } catch (error) {
      console.error('Error updating medication:', error)
      alert('Failed to update medication')
    }
  }

  const handleDiscontinue = async (id) => {
    if (!confirm('Are you sure you want to discontinue this medication?')) return

    try {
      const { error} = await supabase
        .from('user_medications')
        .update({ 
          is_active: false,
          end_date: new Date().toISOString().split('T')[0],
          discontinued_reason: 'Discontinued by user'
        })
        .eq('id', id)

      if (error) throw error
      loadMedications()
    } catch (error) {
      console.error('Error discontinuing medication:', error)
      alert('Failed to discontinue medication')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (medications.length === 0) {
    return (
      <div className="text-center py-12">
        <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Medications Yet</h3>
        <p className="text-gray-500 mb-6">
          Start by adding your current medications to track them and check for interactions.
        </p>
        <button
          onClick={() => window.location.hash = '#add-medication'}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:shadow-lg transition-all"
        >
          Add Your First Medication
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Current Medications</h2>
          <p className="text-gray-600 mt-1">{medications.length} active medication{medications.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={loadMedications}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {medications.map((med) => (
          <div
            key={med.id}
            className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all"
          >
            {editingId === med.id ? (
              // Edit Mode
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={editForm.dosage}
                    onChange={(e) => setEditForm({ ...editForm, dosage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <input
                    type="text"
                    value={editForm.frequency}
                    onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(med.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Pill className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {med.medication?.name || med.custom_name}
                      </h3>
                      {med.medication?.generic_name && med.medication.name !== med.medication.generic_name && (
                        <p className="text-sm text-gray-500">
                          Generic: {med.medication.generic_name}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="font-medium">{med.dosage}</span>
                        <span>•</span>
                        <span>{med.frequency}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(med)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDiscontinue(med.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Discontinue"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Started: {new Date(med.start_date).toLocaleDateString()}</span>
                  </div>
                  {med.prescriber && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>Dr. {med.prescriber.name}</span>
                    </div>
                  )}
                  {med.refills_remaining !== null && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <AlertCircle className="w-4 h-4" />
                      <span>{med.refills_remaining} refills remaining</span>
                    </div>
                  )}
                </div>

                {med.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Notes:</span> {med.notes}
                    </p>
                  </div>
                )}

                {med.medication?.warnings && (
                  <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                    <p className="text-sm text-yellow-800">
                      <span className="font-medium">⚠️ Warning:</span> {med.medication.warnings}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
