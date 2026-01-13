import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { FileText, Printer, Download, Plus, User, Calendar, Trash2 } from 'lucide-react'
import jsPDF from 'jspdf'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { Capacitor } from '@capacitor/core'

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
      const { data, error } = await supabase
        .from('user_medications')
        .select(`
          *,
          medication:medications(*),
          prescriber:medical_providers(name)
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
      // Auto-add "Dr." prefix if not present
      let providerName = providerForm.name.trim()
      if (!providerName.toLowerCase().startsWith('dr.') && !providerName.toLowerCase().startsWith('dr ')) {
        providerName = 'Dr. ' + providerName
      }

      const { error } = await supabase
        .from('medical_providers')
        .insert({
          user_id: user.id,
          ...providerForm,
          name: providerName
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

  const handleDeleteProvider = async (providerId) => {
    if (!confirm('Are you sure you want to delete this provider?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('medical_providers')
        .delete()
        .eq('id', providerId)
        .eq('user_id', user.id)

      if (error) throw error

      alert('Provider deleted successfully!')
      loadProviders()
    } catch (error) {
      console.error('Error deleting provider:', error)
      alert('Failed to delete provider')
    }
  }

  const handleDownloadPDF = async () => {
    try {
      console.log('Starting PDF generation...')
      const doc = new jsPDF()
      let y = 20
      
      doc.setFontSize(16)
      doc.text('Medication Report', 105, y, { align: 'center' })
      y += 10
      
      doc.setFontSize(10)
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, y, { align: 'center' })
      y += 15
      
      if (medications.length > 0) {
        doc.setFontSize(12)
        doc.text('Medications:', 20, y)
        y += 7
        doc.setFontSize(10)
        medications.forEach((med, i) => {
          doc.text(`${i+1}. ${med.medication?.name || med.custom_name}`, 25, y)
          y += 5
          doc.text(`   ${med.dosage} - ${med.frequency}`, 25, y)
          y += 7
        })
      }
      
      if (supplements.length > 0) {
        y += 5
        doc.setFontSize(12)
        doc.text('Supplements:', 20, y)
        y += 7
        doc.setFontSize(10)
        supplements.forEach((sup, i) => {
          doc.text(`${i+1}. ${sup.medication?.name || sup.custom_name}`, 25, y)
          y += 5
          doc.text(`   ${sup.dosage} - ${sup.frequency}`, 25, y)
          y += 7
        })
      }
      
      console.log('PDF generated, preparing to save...')
      
      // Check if running on native platform
      if (Capacitor.isNativePlatform()) {
        // Get PDF as base64
        const pdfOutput = doc.output('datauristring')
        const base64Data = pdfOutput.split(',')[1]
        
        const fileName = `Medication_Report_${new Date().toISOString().split('T')[0]}.pdf`
        
        // Save to filesystem
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents
        })
        
        console.log('File saved:', savedFile.uri)
        
        // Share the file
        await Share.share({
          title: 'Medication Report',
          text: 'My medication list',
          url: savedFile.uri,
          dialogTitle: 'Share or Save Medication Report'
        })
      } else {
        // Fallback for web
        doc.save('Medication_Report.pdf')
      }
    } catch (error) {
      console.error('PDF Error:', error)
      alert(`Failed to generate PDF: ${error.message}`)
    }
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
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            <Download className="w-4 h-4" />
            Download PDF
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
                    {allergy.allergen}
                    <span className="ml-2 text-sm font-normal">
                      ({allergy.severity})
                    </span>
                  </p>
                  {allergy.reaction && (
                    <p className="text-sm text-red-700 mt-1">
                      Reaction: {allergy.reaction}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medications Section */}
        {medications.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Current Medications</h2>
            <div className="space-y-4">
              {medications.map((med, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {med.medication?.name || med.custom_name}
                  </h3>
                  {med.medication?.generic_name && 
                   med.medication.name !== med.medication.generic_name && (
                    <p className="text-sm text-gray-600 italic">
                      Generic: {med.medication.generic_name}
                    </p>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-600">Dosage:</span>
                      <span className="font-medium break-words">{med.dosage}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-600">Frequency:</span>
                      <span className="font-medium break-words">{med.frequency}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-600">Route:</span>
                      <span className="font-medium">{med.route}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-600">Started:</span>
                      <span className="font-medium">
                        {new Date(med.start_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {med.prescriber && (
                    <p className="text-sm text-gray-600 mt-2">
                      Prescribed by: Dr. {med.prescriber.name}
                    </p>
                  )}
                  {med.notes && (
                    <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                      <span className="font-medium">Notes:</span> {med.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Supplements Section */}
        {supplements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Supplements & Vitamins</h2>
            <div className="space-y-3">
              {supplements.map((supp, index) => (
                <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                  <h3 className="font-semibold text-gray-900">
                    {supp.supplement?.name || supp.custom_name}
                  </h3>
                  <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-600">Dosage:</span>
                      <span className="font-medium break-words">{supp.dosage}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-600">Frequency:</span>
                      <span className="font-medium break-words">{supp.frequency}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-600">Started:</span>
                      <span className="font-medium">
                        {new Date(supp.start_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center text-sm text-gray-600">
          <p>This medication list was generated by YFIT AI - Health & Fitness Tracker</p>
          <p className="mt-1">Please review this list with your healthcare provider</p>
        </div>
      </div>

      {/* Healthcare Providers Section */}
      <div className="mt-8 print:hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">My Healthcare Providers</h3>
          <button
            onClick={() => setShowProviderForm(!showProviderForm)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Provider
          </button>
        </div>

        {showProviderForm && (
          <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">
            <h4 className="font-semibold text-gray-900 mb-4">Add New Provider</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={providerForm.name}
                  onChange={(e) => setProviderForm({...providerForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Smith (Dr. will be added automatically)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialty
                </label>
                <input
                  type="text"
                  value={providerForm.specialty}
                  onChange={(e) => setProviderForm({...providerForm, specialty: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Cardiologist"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={providerForm.phone}
                  onChange={(e) => setProviderForm({...providerForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={providerForm.email}
                  onChange={(e) => setProviderForm({...providerForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="doctor@clinic.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={providerForm.address}
                  onChange={(e) => setProviderForm({...providerForm, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  placeholder="123 Medical Center Dr, City, State 12345"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddProvider}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  Save Provider
                </button>
                <button
                  onClick={() => setShowProviderForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {providers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((provider, index) => (
              <div key={provider.id || index} className="bg-white border border-gray-300 rounded-lg p-4 relative">
                <button
                  onClick={() => handleDeleteProvider(provider.id)}
                  className="absolute top-2 right-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Delete provider"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-start gap-3 pr-8">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{provider.name}</h4>
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
