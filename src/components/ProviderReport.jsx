import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { FileText, Printer, Download, Plus, User, Calendar } from 'lucide-react'

export default function ProviderReport({ user }) {
  const [medications, setMedications] = useState([])
  const [supplements, setSupplements] = useState([])
  const [allergies, setAllergies] = useState([])
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showProviderForm, setShowProviderForm] = useState(false)

  const [providerForm, setProviderForm] = useState({
    name: '',
    specialty: '',
    phone: '',
    email: '',
    address: ''
  })

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadMedications(),
        loadSupplements(),
        loadAllergies(),
        loadProviders()
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadMedications = async () => {
    try {
      // Skip in demo mode
      if (user.id.startsWith('demo')) {
        const stored = localStorage.getItem('yfit_demo_medications');
        setMedications(stored ? JSON.parse(stored) : []);
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
        .order('created_at')

      if (error) throw error
      setMedications(data || [])
    } catch (error) {
      console.error('Error loading medications:', error)
    }
  }

  const loadSupplements = async () => {
    try {
      // Skip in demo mode
      if (user.id.startsWith('demo')) {
        const stored = localStorage.getItem('yfit_demo_supplements');
        setSupplements(stored ? JSON.parse(stored) : []);
        return;
      }

      const { data, error } = await supabase
        .from('user_supplements')
        .select(`
          *,
          supplement:vitamins_supplements(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at')

      if (error) throw error
      setSupplements(data || [])
    } catch (error) {
      console.error('Error loading supplements:', error)
    }
  }

  const loadAllergies = async () => {
    try {
      // Skip in demo mode
      if (user.id.startsWith('demo')) {
        const stored = localStorage.getItem('yfit_demo_allergies');
        setAllergies(stored ? JSON.parse(stored) : []);
        return;
      }

      const { data, error } = await supabase
        .from('user_allergies')
        .select('*')
        .eq('user_id', user.id)
        .order('allergen')

      if (error) throw error
      setAllergies(data || [])
    } catch (error) {
      console.error('Error loading allergies:', error)
    }
  }

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

  const handleAddProvider = async () => {
    if (!providerForm.name) {
      alert('Please enter provider name')
      return
    }

    try {
      const { error } = await supabase
        .from('medical_providers')
        .insert({
          user_id: user.id,
          ...providerForm
        })

      if (error) throw error

      alert('Provider added successfully!')
      setShowProviderForm(false)
      setProviderForm({
        name: '',
        specialty: '',
        phone: '',
        email: '',
        address: ''
      })
      loadProviders()
    } catch (error) {
      console.error('Error adding provider:', error)
      alert('Failed to add provider')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // Create text content
    let content = '='.repeat(60) + '\n'
    content += 'MEDICATION LIST\n'
    content += '='.repeat(60) + '\n\n'
    content += `Patient Name: ${user.email}\n`
    content += `Date Generated: ${new Date().toLocaleDateString()}\n\n`

    if (allergies.length > 0) {
      content += '--- ALLERGIES ---\n'
      allergies.forEach(allergy => {
        content += `• ${allergy.allergen} (${allergy.severity})\n`
        if (allergy.reaction) content += `  Reaction: ${allergy.reaction}\n`
      })
      content += '\n'
    }

    if (medications.length > 0) {
      content += '--- CURRENT MEDICATIONS ---\n'
      medications.forEach((med, index) => {
        content += `${index + 1}. ${med.medication?.name || med.custom_name}\n`
        if (med.medication?.generic_name && med.medication.name !== med.medication.generic_name) {
          content += `   Generic: ${med.medication.generic_name}\n`
        }
        content += `   Dosage: ${med.dosage}\n`
        content += `   Frequency: ${med.frequency}\n`
        content += `   Route: ${med.route}\n`
        content += `   Started: ${new Date(med.start_date).toLocaleDateString()}\n`
        if (med.prescriber) content += `   Prescriber: Dr. ${med.prescriber.name}\n`
        if (med.notes) content += `   Notes: ${med.notes}\n`
        content += '\n'
      })
    }

    if (supplements.length > 0) {
      content += '--- SUPPLEMENTS ---\n'
      supplements.forEach((supp, index) => {
        content += `${index + 1}. ${supp.supplement?.name || supp.custom_name}\n`
        content += `   Dosage: ${supp.dosage}\n`
        content += `   Frequency: ${supp.frequency}\n`
        content += `   Started: ${new Date(supp.start_date).toLocaleDateString()}\n`
        content += '\n'
      })
    }

    content += '='.repeat(60) + '\n'
    content += 'This list was generated by YFIT AI - Health & Fitness Tracker\n'
    content += '='.repeat(60) + '\n'

    // Create download
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `medication-list-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Provider Report</h2>
          <p className="text-gray-600 mt-1">
            Generate a medication list to share with healthcare providers
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      {/* Printable Report */}
      <div className="bg-white border border-gray-300 rounded-lg p-8 print:border-0 print:p-0">
        {/* Header */}
        <div className="mb-8 pb-6 border-b-2 border-gray-300">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Medication List</h1>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-600">Patient</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date Generated</p>
              <p className="font-medium text-gray-900">
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Allergies Section */}
        {allergies.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              ALLERGIES
            </h2>
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              {allergies.map((allergy, index) => (
                <div key={index} className="mb-2 last:mb-0">
                  <p className="font-semibold text-red-900">
                    {allergy.allergen} <span className="text-sm">({allergy.severity})</span>
                  </p>
                  {allergy.reaction && (
                    <p className="text-sm text-red-700">Reaction: {allergy.reaction}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medications Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Medications</h2>
          {medications.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">#</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Medication</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Dosage</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Frequency</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Route</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Start Date</th>
                </tr>
              </thead>
              <tbody>
                {medications.map((med, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div>
                        <p className="font-medium">{med.medication?.name || med.custom_name}</p>
                        {med.medication?.generic_name && med.medication.name !== med.medication.generic_name && (
                          <p className="text-sm text-gray-600">({med.medication.generic_name})</p>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">{med.dosage}</td>
                    <td className="border border-gray-300 px-4 py-2">{med.frequency}</td>
                    <td className="border border-gray-300 px-4 py-2">{med.route}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      {new Date(med.start_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-600 italic">No current medications</p>
          )}
        </div>

        {/* Supplements Section */}
        {supplements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Supplements</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">#</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Supplement</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Dosage</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Frequency</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Start Date</th>
                </tr>
              </thead>
              <tbody>
                {supplements.map((supp, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      {supp.supplement?.name || supp.custom_name}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">{supp.dosage}</td>
                    <td className="border border-gray-300 px-4 py-2">{supp.frequency}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      {new Date(supp.start_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t-2 border-gray-300 text-sm text-gray-600">
          <p>This medication list was generated by YFIT AI - Health & Fitness Tracker</p>
          <p className="mt-1">
            Please verify all information with the patient and update as necessary.
          </p>
        </div>
      </div>

      {/* Providers Section (Not Printed) */}
      <div className="mt-8 print:hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Healthcare Providers</h3>
          <button
            onClick={() => setShowProviderForm(!showProviderForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Provider
          </button>
        </div>

        {showProviderForm && (
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-800 mb-4">Add New Provider</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={providerForm.name}
                  onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                  placeholder="Dr. John Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialty
                </label>
                <input
                  type="text"
                  value={providerForm.specialty}
                  onChange={(e) => setProviderForm({ ...providerForm, specialty: e.target.value })}
                  placeholder="Cardiologist"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={providerForm.phone}
                  onChange={(e) => setProviderForm({ ...providerForm, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={providerForm.email}
                  onChange={(e) => setProviderForm({ ...providerForm, email: e.target.value })}
                  placeholder="doctor@clinic.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={providerForm.address}
                  onChange={(e) => setProviderForm({ ...providerForm, address: e.target.value })}
                  placeholder="123 Medical Center Dr, City, State 12345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddProvider}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Provider
              </button>
              <button
                onClick={() => setShowProviderForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {providers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Dr. {provider.name}</h4>
                    {provider.specialty && (
                      <p className="text-sm text-gray-600">{provider.specialty}</p>
                    )}
                    {provider.phone && (
                      <p className="text-sm text-gray-600 mt-1">{provider.phone}</p>
                    )}
                    {provider.email && (
                      <p className="text-sm text-gray-600">{provider.email}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">No providers added yet</p>
        )}
      </div>
    </div>
  )
}
