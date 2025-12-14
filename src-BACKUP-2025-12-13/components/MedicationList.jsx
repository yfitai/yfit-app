import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Pill, Edit, Trash2, AlertCircle, Calendar, Leaf } from 'lucide-react'

export default function MedicationList({ user, onAddMedication }) {
  const [medications, setMedications] = useState([])
  const [supplements, setSupplements] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadMedications(), loadSupplements()])
    } finally {
      setLoading(false)
    }
  }

  const loadMedications = async () => {
    try {
      if (user.id.startsWith('demo')) {
        const stored = localStorage.getItem('yfit_demo_medications');
        const allItems = stored ? JSON.parse(stored) : [];
        const meds = allItems.filter(item => !item.is_supplement);
        setMedications(meds);
        return;
      }

      const { data, error } = await supabase
        .from('user_medications')
        .select(`
          *,
          medication:medications(*),
          prescriber:medical_providers(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_supplement', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMedications(data || [])
    } catch (error) {
      console.error('Error loading medications:', error)
    }
  }

  const loadSupplements = async () => {
    try {
      if (user.id.startsWith('demo')) {
        const stored = localStorage.getItem('yfit_demo_medications');
        const allItems = stored ? JSON.parse(stored) : [];
        const supps = allItems.filter(item => item.is_supplement === true);
        setSupplements(supps);
        return;
      }

      const { data, error } = await supabase
        .from('user_medications')
        .select(`
          *,
          medication:medications(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_supplement', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSupplements(data || [])
    } catch (error) {
      console.error('Error loading supplements:', error)
    }
  }

  const handleEdit = (item) => {
    setEditingId(item.id)
    setEditForm({
      dosage: item.dosage,
      frequency: item.frequency,
      route: item.route || 'Oral',
      notes: item.notes || ''
    })
  }

  const handleSaveEdit = async () => {
    try {
      if (user.id.startsWith('demo')) {
        const stored = localStorage.getItem('yfit_demo_medications');
        const allItems = stored ? JSON.parse(stored) : [];
        const updated = allItems.map(item =>
          item.id === editingId ? { ...item, ...editForm } : item
        );
        localStorage.setItem('yfit_demo_medications', JSON.stringify(updated));
        setEditingId(null);
        await loadData();
        return;
      }

      const { error } = await supabase
        .from('user_medications')
        .update(editForm)
        .eq('id', editingId)
        .eq('user_id', user.id)

      if (error) throw error

      setEditingId(null)
      await loadData()
    } catch (error) {
      console.error('Error updating:', error)
      alert('Failed to update')
    }
  }

  const handleDiscontinue = async (itemId) => {
    if (!confirm('Are you sure you want to remove this item?')) return

    try {
      if (user.id.startsWith('demo')) {
        const stored = localStorage.getItem('yfit_demo_medications');
        const allItems = stored ? JSON.parse(stored) : [];
        const filtered = allItems.filter(item => item.id !== itemId);
        localStorage.setItem('yfit_demo_medications', JSON.stringify(filtered));
        await loadData();
        return;
      }

      const { error } = await supabase
        .from('user_medications')
        .update({ is_active: false })
        .eq('id', itemId)
        .eq('user_id', user.id)

      if (error) throw error

      await loadData()
    } catch (error) {
      console.error('Error discontinuing:', error)
      alert('Failed to discontinue medication')
    }
  }

  const renderItem = (item, isSupplement = false) => {
    const isEditing = editingId === item.id;

    return (
      <div
        key={item.id}
        className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all bg-white"
      >
        {isEditing ? (
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                value={editForm.frequency}
                onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Once daily">Once daily</option>
                <option value="Twice daily">Twice daily</option>
                <option value="Three times daily">Three times daily</option>
                <option value="Four times daily">Four times daily</option>
                <option value="Every other day">Every other day</option>
                <option value="Once weekly">Once weekly</option>
                <option value="As needed">As needed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route
              </label>
              <select
                value={editForm.route}
                onChange={(e) => setEditForm({ ...editForm, route: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Oral">Oral</option>
                <option value="Injection">Injection</option>
                <option value="Topical">Topical</option>
                <option value="Inhalation">Inhalation</option>
                <option value="Rectal">Rectal</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                Save
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          // Display Mode
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isSupplement ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {isSupplement ? (
                    <Leaf className="w-5 h-5 text-green-600" />
                  ) : (
                    <Pill className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {item.medication?.name || item.custom_name}
                  </h3>
                  {item.medication?.generic_name && item.medication.name !== item.medication.generic_name && (
                    <p className="text-sm text-gray-500">
                      Generic: {item.medication.generic_name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDiscontinue(item.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Details Section - Always Visible */}
            <div className="space-y-2 pl-13">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="font-medium text-gray-900">{item.dosage}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-700">{item.frequency}</span>
                {item.route && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-700">{item.route}</span>
                  </>
                )}
              </div>
              
              {item.start_date && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Started: {new Date(item.start_date).toLocaleDateString()}</span>
                </div>
              )}

              {item.refills_remaining !== null && item.refills_remaining !== undefined && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{item.refills_remaining} refills remaining</span>
                </div>
              )}

              {item.notes && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Notes:</span> {item.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (medications.length === 0 && supplements.length === 0) {
    return (
      <div className="text-center py-12">
        <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Medications or Supplements Yet</h3>
        <p className="text-gray-500 mb-6">
          Start by adding your current medications and supplements to track them.
        </p>
        <button
          onClick={onAddMedication}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:shadow-lg transition-all"
        >
          Add Your First Item
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Medications Section */}
      {medications.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Pill className="w-6 h-6 text-blue-600" />
                Current Medications
              </h2>
              <p className="text-gray-600 mt-1">{medications.length} active medication{medications.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="space-y-4">
            {medications.map((med) => renderItem(med, false))}
          </div>
        </div>
      )}

      {/* Supplements Section */}
      {supplements.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Leaf className="w-6 h-6 text-green-600" />
                Supplements
              </h2>
              <p className="text-gray-600 mt-1">{supplements.length} active supplement{supplements.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="space-y-4">
            {supplements.map((supp) => renderItem(supp, true))}
          </div>
        </div>
      )}
    </div>
  )
}
