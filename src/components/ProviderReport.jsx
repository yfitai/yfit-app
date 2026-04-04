import { useState, useEffect, useRef } from 'react'
import { supabase, getUserProfile } from '../lib/supabase'
import { FileText, Printer, Download, Plus, User, Trash2 } from 'lucide-react'
import jsPDF from 'jspdf'

export default function ProviderReport({ user }) {
  const [medications, setMedications] = useState([])
  const [supplements, setSupplements] = useState([])
  const [allergies, setAllergies] = useState([])
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showProviderForm, setShowProviderForm] = useState(false)
  const [profile, setProfile] = useState(null)
  const [selectedProviderId, setSelectedProviderId] = useState('')
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const reportRef = useRef(null)

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
      const profileData = await getUserProfile(user.id)
      setProfile(profileData)
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
      const { data: explicitMeds, error: err1 } = await supabase
        .from('user_medications')
        .select(`*, medication:medications(*)`)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_supplement', false)
        .order('created_at')

      if (err1) console.error('[ProviderReport] Error loading explicit meds:', err1)

      const { data: nullFlagMeds, error: err2 } = await supabase
        .from('user_medications')
        .select(`*, medication:medications(*)`)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .is('is_supplement', null)
        .order('created_at')

      if (err2) console.error('[ProviderReport] Error loading null-flag meds:', err2)

      const combined = [...(explicitMeds || []), ...(nullFlagMeds || [])]
      setMedications(combined)
    } catch (error) {
      console.error('Error loading medications:', error)
    }
  }

  const loadSupplements = async () => {
    try {
      const { data: suppData, error: suppError } = await supabase
        .from('user_supplements')
        .select(`*, supplement:vitamins_supplements(*)`)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at')

      if (suppError) console.error('Error loading user_supplements:', suppError)

      const { data: customSuppData, error: customSuppError } = await supabase
        .from('user_medications')
        .select(`*, medication:medications(*)`)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_supplement', true)
        .order('created_at')

      if (customSuppError) console.error('Error loading custom supplements:', customSuppError)

      const normalizedCustomSupps = (customSuppData || []).map(s => ({
        ...s,
        supplement: s.medication || null,
        custom_name: s.custom_name || s.medication?.name || 'Unknown Supplement'
      }))

      const combined = [...(suppData || []), ...normalizedCustomSupps]
      setSupplements(combined)
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
      let providerName = providerForm.name.trim()
      if (!providerName.toLowerCase().startsWith('dr.') && !providerName.toLowerCase().startsWith('dr ')) {
        providerName = 'Dr. ' + providerName
      }

      const { error } = await supabase
        .from('medical_providers')
        .insert({ user_id: user.id, ...providerForm, name: providerName })

      if (error) throw error

      alert('Provider added successfully!')
      setShowProviderForm(false)
      setProviderForm({ name: '', specialty: '', phone: '', email: '', address: '' })
      loadProviders()
    } catch (error) {
      console.error('Error adding provider:', error)
      alert('Failed to add provider')
    }
  }

  const handleDeleteProvider = async (providerId) => {
    if (!confirm('Are you sure you want to delete this provider?')) return

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

  // ── PDF Generation (web-safe, no Capacitor dependency) ──────────────────────
  const handleDownloadPDF = async () => {
    setPdfGenerating(true)
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const margin = 20
      const contentW = pageW - margin * 2
      let y = margin

      const patientName =
        profile?.full_name ||
        (`${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`).trim() ||
        user.email

      const selectedProvider = providers.find(p => p.id === selectedProviderId)
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      })

      // ── Header bar ──
      doc.setFillColor(37, 99, 235) // blue-600
      doc.rect(0, 0, pageW, 14, 'F')
      doc.setFontSize(9)
      doc.setTextColor(255, 255, 255)
      doc.text('YFIT AI — Health & Fitness Tracker', margin, 9)
      doc.text('Confidential Medical Document', pageW - margin, 9, { align: 'right' })
      y = 24

      // ── Title ──
      doc.setTextColor(17, 24, 39)
      doc.setFontSize(22)
      doc.setFont(undefined, 'bold')
      doc.text('Medication List', margin, y)
      y += 8

      // ── Patient info row ──
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(75, 85, 99)
      doc.text(`Patient: `, margin, y)
      doc.setTextColor(17, 24, 39)
      doc.setFont(undefined, 'bold')
      doc.text(patientName, margin + 18, y)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(75, 85, 99)
      doc.text(`Date: ${dateStr}`, pageW - margin, y, { align: 'right' })
      y += 6

      if (selectedProvider) {
        doc.setTextColor(75, 85, 99)
        doc.text('Prepared for: ', margin, y)
        doc.setTextColor(17, 24, 39)
        doc.setFont(undefined, 'bold')
        doc.text(
          `${selectedProvider.name}${selectedProvider.specialty ? ', ' + selectedProvider.specialty : ''}`,
          margin + 26,
          y
        )
        doc.setFont(undefined, 'normal')
        y += 6
      }

      // Divider
      doc.setDrawColor(209, 213, 219)
      doc.setLineWidth(0.4)
      doc.line(margin, y, pageW - margin, y)
      y += 8

      const checkPage = (needed = 12) => {
        if (y + needed > pageH - 15) {
          doc.addPage()
          y = margin
        }
      }

      const sectionHeader = (title, r, g, b) => {
        checkPage(14)
        doc.setFillColor(r, g, b)
        doc.rect(margin, y - 4, contentW, 8, 'F')
        doc.setFontSize(11)
        doc.setFont(undefined, 'bold')
        doc.setTextColor(255, 255, 255)
        doc.text(title, margin + 3, y + 1)
        doc.setFont(undefined, 'normal')
        doc.setTextColor(17, 24, 39)
        y += 10
      }

      // ── Allergies ──
      if (allergies.length > 0) {
        sectionHeader('⚠  ALLERGIES', 185, 28, 28)
        allergies.forEach((allergy, i) => {
          checkPage(12)
          doc.setFontSize(10)
          doc.setFont(undefined, 'bold')
          doc.setTextColor(185, 28, 28)
          doc.text(`${i + 1}. ${allergy.allergen} (${allergy.severity || 'Unknown'})`, margin + 4, y)
          doc.setFont(undefined, 'normal')
          doc.setTextColor(17, 24, 39)
          y += 5
          if (allergy.reaction) {
            checkPage(6)
            doc.setFontSize(9)
            doc.setTextColor(75, 85, 99)
            doc.text(`   Reaction: ${allergy.reaction}`, margin + 4, y)
            doc.setTextColor(17, 24, 39)
            y += 5
          }
          y += 2
        })
        y += 4
      }

      // ── Medications ──
      if (medications.length > 0) {
        sectionHeader('Current Medications', 37, 99, 235)
        medications.forEach((med, i) => {
          const medName = med.medication?.name || med.custom_name || 'Unknown Medication'
          const dosage = med.dosage || 'N/A'
          const frequency = med.frequency || 'N/A'
          const route = med.route || ''
          const started = med.start_date
            ? new Date(med.start_date).toLocaleDateString()
            : 'N/A'

          checkPage(20)
          // Left accent bar
          doc.setFillColor(37, 99, 235)
          doc.rect(margin, y - 3, 2, 14, 'F')

          doc.setFontSize(11)
          doc.setFont(undefined, 'bold')
          doc.text(`${i + 1}. ${medName}`, margin + 6, y)
          y += 5

          if (med.medication?.generic_name && med.medication.name !== med.medication.generic_name) {
            doc.setFontSize(9)
            doc.setFont(undefined, 'italic')
            doc.setTextColor(107, 114, 128)
            doc.text(`Generic: ${med.medication.generic_name}`, margin + 6, y)
            doc.setFont(undefined, 'normal')
            doc.setTextColor(17, 24, 39)
            y += 4
          }

          doc.setFontSize(9)
          doc.setFont(undefined, 'normal')
          doc.setTextColor(75, 85, 99)
          const details = [
            `Dosage: ${dosage}`,
            route ? `Route: ${route}` : null,
            `Frequency: ${frequency}`,
            `Started: ${started}`,
          ].filter(Boolean).join('   |   ')
          doc.text(details, margin + 6, y)
          doc.setTextColor(17, 24, 39)
          y += 5

          if (med.prescriber_name) {
            checkPage(6)
            doc.setFontSize(9)
            doc.setTextColor(75, 85, 99)
            doc.text(`Prescribed by: ${med.prescriber_name}`, margin + 6, y)
            doc.setTextColor(17, 24, 39)
            y += 5
          }

          if (med.notes) {
            checkPage(8)
            const noteLines = doc.splitTextToSize(`Notes: ${med.notes}`, contentW - 12)
            doc.setFontSize(9)
            doc.setTextColor(75, 85, 99)
            noteLines.forEach(line => {
              checkPage(5)
              doc.text(line, margin + 6, y)
              y += 4
            })
            doc.setTextColor(17, 24, 39)
          }
          y += 5
        })
        y += 2
      } else {
        checkPage(10)
        doc.setFontSize(10)
        doc.setTextColor(107, 114, 128)
        doc.text('No current medications on file.', margin + 4, y)
        doc.setTextColor(17, 24, 39)
        y += 10
      }

      // ── Supplements ──
      if (supplements.length > 0) {
        sectionHeader('Supplements & Vitamins', 5, 150, 105)
        supplements.forEach((sup, i) => {
          const supName = sup.supplement?.name || sup.custom_name || 'Unknown Supplement'
          const dosage = sup.dosage || 'N/A'
          const frequency = sup.frequency || 'N/A'
          const started = sup.start_date
            ? new Date(sup.start_date).toLocaleDateString()
            : 'N/A'

          checkPage(16)
          doc.setFillColor(5, 150, 105)
          doc.rect(margin, y - 3, 2, 10, 'F')

          doc.setFontSize(11)
          doc.setFont(undefined, 'bold')
          doc.setTextColor(17, 24, 39)
          doc.text(`${i + 1}. ${supName}`, margin + 6, y)
          y += 5

          doc.setFontSize(9)
          doc.setFont(undefined, 'normal')
          doc.setTextColor(75, 85, 99)
          doc.text(
            `Dosage: ${dosage}   |   Frequency: ${frequency}   |   Started: ${started}`,
            margin + 6,
            y
          )
          doc.setTextColor(17, 24, 39)
          y += 7
        })
      }

      // ── Footer ──
      const totalPages = doc.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFillColor(243, 244, 246)
        doc.rect(0, pageH - 12, pageW, 12, 'F')
        doc.setFontSize(8)
        doc.setTextColor(107, 114, 128)
        doc.text(
          'Generated by YFIT AI — Please review this list with your healthcare provider',
          margin,
          pageH - 5
        )
        doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 5, { align: 'right' })
      }

      // ── Save ──
      const fileName = `Medication_Report_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error('PDF Error:', error)
      alert(`Failed to generate PDF: ${error.message}`)
    } finally {
      setPdfGenerating(false)
    }
  }

  // ── Print (opens a clean print window with only the report) ─────────────────
  const handlePrint = () => {
    const reportEl = reportRef.current
    if (!reportEl) return

    const printWindow = window.open('', '_blank', 'width=800,height=900')
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups for this site and try again.')
      return
    }

    const patientName =
      profile?.full_name ||
      (`${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`).trim() ||
      user.email

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Medication List — ${patientName}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #111827; background: #fff; padding: 20mm; }
            h1 { font-size: 22pt; font-weight: 700; margin-bottom: 4px; }
            h2 { font-size: 13pt; font-weight: 700; margin: 16px 0 8px; padding: 4px 8px; border-radius: 4px; }
            h3 { font-size: 11pt; font-weight: 700; margin-bottom: 3px; }
            .header-bar { background: #1d4ed8; color: #fff; padding: 6px 12px; font-size: 9pt; display: flex; justify-content: space-between; margin: -20mm -20mm 16px; padding: 8px 20mm; }
            .meta { display: flex; gap: 32px; margin-bottom: 12px; font-size: 10pt; color: #4b5563; }
            .meta strong { color: #111827; }
            .divider { border: none; border-top: 1.5px solid #d1d5db; margin: 12px 0; }
            .section-allergies { background: #fef2f2; border: 1.5px solid #fca5a5; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; }
            .section-allergies h2 { background: #dc2626; color: #fff; margin: -10px -14px 10px; padding: 6px 14px; border-radius: 4px 4px 0 0; }
            .section-meds h2 { background: #2563eb; color: #fff; }
            .section-supps h2 { background: #059669; color: #fff; }
            .med-item { border-left: 3px solid #2563eb; padding: 6px 0 6px 12px; margin-bottom: 10px; }
            .supp-item { border-left: 3px solid #059669; padding: 6px 0 6px 12px; margin-bottom: 8px; }
            .allergy-item { margin-bottom: 6px; }
            .detail-row { display: flex; gap: 24px; font-size: 9.5pt; color: #374151; margin-top: 3px; flex-wrap: wrap; }
            .detail-row span { color: #6b7280; margin-right: 4px; }
            .notes { background: #f9fafb; border-radius: 4px; padding: 4px 8px; font-size: 9pt; color: #4b5563; margin-top: 4px; }
            .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 8.5pt; color: #9ca3af; text-align: center; }
            @media print { body { padding: 0; } .header-bar { margin: 0 0 16px; } }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <span>YFIT AI — Health &amp; Fitness Tracker</span>
            <span>Confidential Medical Document</span>
          </div>
          ${reportEl.innerHTML}
          <div class="footer">
            Generated by YFIT AI — Please review this list with your healthcare provider
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 400)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const patientName =
    profile?.full_name ||
    (`${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`).trim() ||
    user.email

  const selectedProvider = providers.find(p => p.id === selectedProviderId)

  return (
    <div>
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Provider Report</h2>
          <p className="text-gray-600 mt-1">
            Generate a medication list to share with healthcare providers
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={pdfGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pdfGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Provider selector */}
      {providers.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Addressed To (optional)</label>
          <select
            value={selectedProviderId}
            onChange={(e) => setSelectedProviderId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">— Select a provider —</option>
            {providers.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}{p.specialty ? ` (${p.specialty})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── Printable / PDF Report ── */}
      <div
        ref={reportRef}
        className="bg-white border border-gray-300 rounded-lg p-8"
      >
        {/* Header */}
        <div className="mb-8 pb-6 border-b-2 border-gray-300">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Medication List</h1>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-600">Patient</p>
              <p className="font-medium text-gray-900">{patientName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date Generated</p>
              <p className="font-medium text-gray-900">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
            {selectedProvider && (
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Prepared for</p>
                <p className="font-medium text-gray-900">
                  {selectedProvider.name}{selectedProvider.specialty ? `, ${selectedProvider.specialty}` : ''}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Allergies */}
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
                    <span className="ml-2 text-sm font-normal">({allergy.severity})</span>
                  </p>
                  {allergy.reaction && (
                    <p className="text-sm text-red-700 mt-1">Reaction: {allergy.reaction}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medications */}
        {medications.length > 0 ? (
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
                    {med.route && (
                      <div className="flex flex-col">
                        <span className="text-gray-600">Route:</span>
                        <span className="font-medium">{med.route}</span>
                      </div>
                    )}
                    {med.start_date && (
                      <div className="flex flex-col">
                        <span className="text-gray-600">Started:</span>
                        <span className="font-medium">
                          {new Date(med.start_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  {med.prescriber_name && (
                    <p className="text-sm text-gray-600 mt-2">
                      Prescribed by: {med.prescriber_name}
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
        ) : (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Current Medications</h2>
            <p className="text-gray-500 italic">No current medications on file.</p>
          </div>
        )}

        {/* Supplements */}
        {supplements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Supplements &amp; Vitamins</h2>
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
                    {supp.start_date && (
                      <div className="flex flex-col">
                        <span className="text-gray-600">Started:</span>
                        <span className="font-medium">
                          {new Date(supp.start_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center text-sm text-gray-600">
          <p>This medication list was generated by YFIT AI - Health &amp; Fitness Tracker</p>
          <p className="mt-1">Please review this list with your healthcare provider</p>
        </div>
      </div>

      {/* Healthcare Providers Section */}
      <div className="mt-8">
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
                  Provider Name *
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                <input
                  type="text"
                  value={providerForm.specialty}
                  onChange={(e) => setProviderForm({...providerForm, specialty: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Cardiologist"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={providerForm.phone}
                  onChange={(e) => setProviderForm({...providerForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={providerForm.email}
                  onChange={(e) => setProviderForm({...providerForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="doctor@clinic.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
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
