import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search, Plus, AlertTriangle, CheckCircle } from 'lucide-react'

export default function MedicationSearch({ user }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedMed, setSelectedMed] = useState(null)
  const [providers, setProviders] = useState([])
  const [safetyAlerts, setSafetyAlerts] = useState([])
  const [showCustomForm, setShowCustomForm] = useState(false)

  const [form, setForm] = useState({
    dosage: '',
    frequency: '',
    route: 'Oral',
    start_date: new Date().toISOString().split('T')[0],
    prescriber_id: '',
    pharmacy: '',
    refills_remaining: '',
    notes: ''
  })

  const [customForm, setCustomForm] = useState({
    custom_name: '',
    custom_generic_name: '',
    dosage: '',
    frequency: '',
    route: 'Oral',
    start_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  useEffect(() => {
    loadProviders()
  }, [user])

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchMedications()
    } else {
      setSearchResults([])
    }
  }, [searchTerm])

  const loadProviders = async () => {
    try {
      // Skip in demo mode
      if (user.id.startsWith('demo')) {
        const stored = localStorage.getItem('yfit_demo_providers');
        setProviders(stored ? JSON.parse(stored) : []);
        return;
      }

      const { data, error } = await supabase
        .from('medical_providers')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error
      setProviders(data || [])
    } catch (error) {
      console.error('Error loading providers:', error)
    }
  }

  const searchMedications = async () => {
    setSearching(true)
    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%`)
        .limit(10)

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('Error searching medications:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleSelectMedication = async (medication) => {
    setSelectedMed(medication)
    setSearchTerm('')
    setSearchResults([])
    
    // Check for potential interactions
    await checkInteractions(medication.id)
  }

  const checkInteractions = async (medicationId) => {
    try {
      // Get user's current medications
      const { data: userMeds, error: medsError } = await supabase
        .from('user_medications')
        .select('medication_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .not('medication_id', 'is', null)

      if (medsError) throw medsError

      if (!userMeds || userMeds.length === 0) {
        setSafetyAlerts([])
        return
      }

      const currentMedIds = userMeds.map(m => m.medication_id)

      // Check for interactions
      const { data: interactions, error: intError } = await supabase
        .from('drug_interactions')
        .select(`
          *,
          drug_a:medications!drug_interactions_drug_a_id_fkey(name),
          drug_b:medications!drug_interactions_drug_b_id_fkey(name)
        `)
        .or(`and(drug_a_id.in.(${currentMedIds.join(',')}),drug_b_id.eq.${medicationId}),and(drug_b_id.in.(${currentMedIds.join(',')}),drug_a_id.eq.${medicationId})`)

      if (intError) throw intError
      setSafetyAlerts(interactions || [])
    } catch (error) {
      console.error('Error checking interactions:', error)
    }
  }

  const handleAddMedication = async () => {
    if (!selectedMed || !form.dosage || !form.frequency) {
      alert('Please fill in all required fields')
      return
    }

    try {
      // Handle demo mode
      if (user.id.startsWith('demo')) {
        const stored = localStorage.getItem('yfit_demo_medications');
        const medications = stored ? JSON.parse(stored) : [];
        
        const newMed = {
          id: `demo-med-${Date.now()}`,
          user_id: user.id,
          medication_id: selectedMed.id,
          medication: selectedMed,
          dosage: form.dosage,
          frequency: form.frequency,
          route: form.route,
          start_date: form.start_date,
          prescriber_id: form.prescriber_id || null,
          pharmacy: form.pharmacy || null,
          refills_remaining: form.refills_remaining ? parseInt(form.refills_remaining) : null,
          notes: form.notes || null,
          is_active: true,
          created_at: new Date().toISOString()
        };
        
        medications.push(newMed);
        localStorage.setItem('yfit_demo_medications', JSON.stringify(medications));
        
        alert('Medication added successfully!');
        setSelectedMed(null);
        setForm({
          dosage: '',
          frequency: '',
          route: 'Oral',
          start_date: new Date().toISOString().split('T')[0],
          prescriber_id: '',
          pharmacy: '',
          refills_remaining: '',
          notes: ''
        });
        setSafetyAlerts([]);
        return;
      }

      const { data, error } = await supabase
        .from('user_medications')
        .insert({
          user_id: user.id,
          medication_id: selectedMed.id,
          dosage: form.dosage,
          frequency: form.frequency,
          route: form.route,
          start_date: form.start_date,
          prescriber_id: form.prescriber_id || null,
          pharmacy: form.pharmacy || null,
          refills_remaining: form.refills_remaining ? parseInt(form.refills_remaining) : null,
          notes: form.notes || null,
          is_active: true
        })
        .select()

      if (error) throw error

      alert('Medication added successfully!')
      setSelectedMed(null)
      setForm({
        dosage: '',
        frequency: '',
        route: 'Oral',
        start_date: new Date().toISOString().split('T')[0],
        prescriber_id: '',
        pharmacy: '',
        refills_remaining: '',
        notes: ''
      })
      setSafetyAlerts([])
    } catch (error) {
      console.error('Error adding medication:', error)
      alert('Failed to add medication')
    }
  }

  const handleAddCustomMedication = async () => {
    if (!customForm.custom_name || !customForm.dosage || !customForm.frequency) {
      alert('Please fill in all required fields')
      return
    }

    try {
      // Handle demo mode
      if (user.id.startsWith('demo')) {
        const stored = localStorage.getItem('yfit_demo_medications');
        const medications = stored ? JSON.parse(stored) : [];
        
        const newMed = {
          id: `demo-med-${Date.now()}`,
          user_id: user.id,
          custom_name: customForm.custom_name,
          custom_generic_name: customForm.custom_generic_name || null,
          dosage: customForm.dosage,
          frequency: customForm.frequency,
          route: customForm.route,
          start_date: customForm.start_date,
          notes: customForm.notes || null,
          is_active: true,
          created_at: new Date().toISOString()
        };
        
        medications.push(newMed);
        localStorage.setItem('yfit_demo_medications', JSON.stringify(medications));
        
        alert('Custom medication added successfully!');
        setShowCustomForm(false);
        setCustomForm({
          custom_name: '',
          custom_generic_name: '',
          dosage: '',
          frequency: '',
          route: 'Oral',
          start_date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        return;
      }

      const { data, error } = await supabase
        .from('user_medications')
        .insert({
          user_id: user.id,
          custom_name: customForm.custom_name,
          custom_generic_name: customForm.custom_generic_name || null,
          dosage: customForm.dosage,
          frequency: customForm.frequency,
          route: customForm.route,
          start_date: customForm.start_date,
          notes: customForm.notes || null,
          is_active: true
        })
        .select()

      if (error) throw error

      alert('Custom medication added successfully!')
      setShowCustomForm(false)
      setCustomForm({
        custom_name: '',
        custom_generic_name: '',
        is_supplement: false,
        dosage: '',
        frequency: '',
        route: 'Oral',
        start_date: new Date().toISOString().split('T')[0],
        notes: ''
      })
    } catch (error) {
      console.error('Error adding custom medication:', error)
      alert('Failed to add custom medication')
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'contraindicated':
      case 'major':
        return 'bg-red-50 border-red-400 text-red-800'
      case 'moderate':
        return 'bg-yellow-50 border-yellow-400 text-yellow-800'
      case 'minor':
        return 'bg-blue-50 border-blue-400 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-400 text-gray-800'
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Medication</h2>

      {/* Toggle between database search and custom entry */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setShowCustomForm(false)}
          className={`px-4 py-2 rounded-lg transition-all ${
            !showCustomForm
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Search Database
        </button>
        <button
          onClick={() => setShowCustomForm(true)}
          className={`px-4 py-2 rounded-lg transition-all ${
            showCustomForm
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Add Custom Medication
        </button>
      </div>

      {!showCustomForm ? (
        <>
          {/* Search Bar */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search for Medication
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type medication name (e.g., Lisinopril, Metformin)..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {searchResults.map((med) => (
                  <button
                    key={med.id}
                    onClick={() => handleSelectMedication(med)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-all border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-800">{med.name}</div>
                    {med.generic_name && med.name !== med.generic_name && (
                      <div className="text-sm text-gray-500">Generic: {med.generic_name}</div>
                    )}
                    {med.drug_class && (
                      <div className="text-xs text-gray-400 mt-1">{med.drug_class}</div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {searching && (
              <div className="mt-2 text-sm text-gray-500">Searching...</div>
            )}
          </div>

          {/* Selected Medication Form */}
          {selectedMed && (
            <div className="border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Add {selectedMed.name}
              </h3>

              {/* Safety Alerts */}
              {safetyAlerts.length > 0 && (
                <div className="mb-6 space-y-3">
                  {safetyAlerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`border-l-4 p-4 rounded-r-lg ${getSeverityColor(alert.severity)}`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">
                            {alert.severity.toUpperCase()} Interaction Detected
                          </p>
                          <p className="text-sm mt-1">{alert.description}</p>
                          {alert.management && (
                            <p className="text-sm mt-2">
                              <span className="font-medium">Management:</span> {alert.management}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosage *
                  </label>
                  <input
                    type="text"
                    value={form.dosage}
                    onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                    placeholder="e.g., 10mg, 500mg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency *
                  </label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select frequency</option>
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
                    value={form.route}
                    onChange={(e) => setForm({ ...form, route: e.target.value })}
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
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prescriber
                  </label>
                  <select
                    value={form.prescriber_id}
                    onChange={(e) => setForm({ ...form, prescriber_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select prescriber</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        Dr. {provider.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pharmacy
                  </label>
                  <input
                    type="text"
                    value={form.pharmacy}
                    onChange={(e) => setForm({ ...form, pharmacy: e.target.value })}
                    placeholder="Pharmacy name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Refills Remaining
                  </label>
                  <input
                    type="number"
                    value={form.refills_remaining}
                    onChange={(e) => setForm({ ...form, refills_remaining: e.target.value })}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Any special instructions or notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddMedication}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Add Medication
                </button>
                <button
                  onClick={() => {
                    setSelectedMed(null)
                    setSafetyAlerts([])
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Custom Medication Form */
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Add Custom Medication
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Use this form if your medication is not in our database.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medication Name *
              </label>
              <input
                type="text"
                value={customForm.custom_name}
                onChange={(e) => setCustomForm({ ...customForm, custom_name: e.target.value })}
                placeholder="Brand or generic name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Generic Name
              </label>
              <input
                type="text"
                value={customForm.custom_generic_name}
                onChange={(e) => setCustomForm({ ...customForm, custom_generic_name: e.target.value })}
                placeholder="Generic name (if different)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customForm.is_supplement}
                  onChange={(e) => setCustomForm({ ...customForm, is_supplement: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  This is a supplement/vitamin (not a prescription medication)
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dosage *
              </label>
              <input
                type="text"
                value={customForm.dosage}
                onChange={(e) => setCustomForm({ ...customForm, dosage: e.target.value })}
                placeholder="e.g., 10mg, 500mg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency *
              </label>
              <select
                value={customForm.frequency}
                onChange={(e) => setCustomForm({ ...customForm, frequency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select frequency</option>
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
                value={customForm.route}
                onChange={(e) => setCustomForm({ ...customForm, route: e.target.value })}
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
                Start Date
              </label>
              <input
                type="date"
                value={customForm.start_date}
                onChange={(e) => setCustomForm({ ...customForm, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={customForm.notes}
              onChange={(e) => setCustomForm({ ...customForm, notes: e.target.value })}
              rows={3}
              placeholder="Any special instructions or notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAddCustomMedication}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Custom Medication
            </button>
            <button
              onClick={() => setShowCustomForm(false)}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
