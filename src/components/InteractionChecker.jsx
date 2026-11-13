import { useState, useEffect, useCallback, useRef, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { AlertTriangle, Shield } from 'lucide-react'
import MedicationIngredientEditor from './MedicationIngredientEditor'
import { checkMedicationInteractions, getMedicationIngredientLines, normalizeMedicationIngredients, searchMedicationCatalog, isMedicationCatalogId } from '../lib/medicationIngredients'

const blankProposal = () => ({ custom_name: '', dosage: '', medication_id: null, combination_ingredients: null })
const severityColors = (severity) => {
  if (['critical', 'contraindicated', 'major'].includes(severity)) return 'bg-red-50 border-red-400 text-red-800'
  if (['warning', 'moderate'].includes(severity)) return 'bg-amber-50 border-amber-400 text-amber-800'
  if (['info', 'minor'].includes(severity)) return 'bg-blue-50 border-blue-400 text-blue-800'
  return 'bg-gray-50 border-gray-400 text-gray-800'
}

function CheckResults({ result, busy, error, title }) {
  const { t } = useTranslation()
  return (
    <section className="mb-6 space-y-3" aria-label={title} aria-live="polite" aria-busy={busy}>
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      {busy && <p className="text-gray-600">{t('medications.checkingCatalog', 'Checking current catalog pairs…')}</p>}
      {error && <p role="alert" className="border border-amber-300 bg-amber-50 text-amber-900 rounded-lg p-4">{error}</p>}
      {!busy && !error && result && <>
        <p className="border border-amber-200 bg-amber-50 text-amber-900 rounded-lg p-4 text-sm">
          {t('medications.catalogCoverageLimited', 'Catalog coverage is limited. This checks only selected, verified catalog IDs and recorded pair interactions, not exact doses, allergies, conditions, or all possible interactions. An empty result is not clinical clearance. Ask a pharmacist or prescriber to review before changing treatment.')}
        </p>
        {result.interactions.length === 0 && <p className="border border-gray-200 bg-gray-50 rounded-lg p-4 text-gray-700">
          {t('medications.noCatalogInteractions', 'No recorded catalog pair interactions returned for the resolved items. This does not establish safety; unmatched items and catalog gaps remain unchecked.')}
        </p>}
        {result.unresolved.length > 0 && <div className="border border-amber-300 bg-amber-50 text-amber-900 rounded-lg p-4">
          <h4 className="font-semibold">{t('medications.unresolvedIngredients', 'Unmatched or incomplete medication/ingredient records — not fully checked')}</h4>
          <p className="text-sm mt-1">{t('medications.unresolvedCheckWarning', 'Names are never guessed from text. Missing strengths, invalid or missing catalog IDs, unparsed details, and ingredients beyond the limit require manual review. Do not assume these are safe.')}</p>
          <ul className="list-disc ml-5 mt-2">{result.unresolved.map((item, index) => <li key={index}>{item.name} — {item.parent_name}</li>)}</ul>
        </div>}
        {result.duplicates.length > 0 && <div className="border border-amber-300 bg-amber-50 text-amber-900 rounded-lg p-4">
          <h4 className="font-semibold">{t('medications.duplicateIngredientWarning', 'Repeated ingredient or medication — verify with your pharmacist')}</h4>
          <p className="text-sm mt-1">{t('medications.duplicateIngredientHelp', 'Exact catalog IDs or identical entered names repeat. This is a duplicate warning, not a dose calculation or proof of equivalent therapy.')}</p>
          <ul className="list-disc ml-5 mt-2">{result.duplicates.map((item, index) => <li key={index}>
            {item.name} — {item.parent_name}{item.within_parent ? ` (${t('medications.withinSameMedication', 'repeated within this medication')})` : ` / ${item.other_parent_name}`}
          </li>)}</ul>
        </div>}
        {result.interactions.map((interaction, index) => <div key={index} className={`border-l-4 rounded-r-lg p-4 ${severityColors(interaction.severity)}`}>
          <h4 className="font-semibold">{interaction.drug_a_name} / {interaction.drug_b_name}</h4>
          <p className="text-sm font-medium mt-1">{t('medications.catalogSeverity', 'Catalog severity')}: {interaction.severity || t('medications.severityUnspecified', 'Unspecified')}</p>
          <p className="text-sm mt-2">{interaction.description || t('medications.interactionDescriptionUnavailable', 'Catalog description unavailable. Seek professional review.')}</p>
          {interaction.management && <p className="text-sm mt-2"><strong>{t('medications.management', 'Management')}:</strong> {interaction.management}</p>}
          <p className="text-xs mt-2">{t('medications.parentMedications', 'Parent medications')}: {[...new Set([...interaction.drug_a_subjects, ...interaction.drug_b_subjects].map((subject) => subject.parent_name))].join(' / ')}</p>
        </div>)}
      </>}
    </section>
  )
}

export default function InteractionChecker({ user }) {
  const { t } = useTranslation()
  const userId = user?.id
  const formId = useId()
  const [medications, setMedications] = useState([])
  const [supplements, setSupplements] = useState([])
  const [safetyAlerts, setSafetyAlerts] = useState([])
  const [alertError, setAlertError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentResult, setCurrentResult] = useState(null)
  const [checkError, setCheckError] = useState(false)
  const [proposal, setProposal] = useState(blankProposal)
  const [proposedResult, setProposedResult] = useState(null)
  const [proposedError, setProposedError] = useState('')
  const [comparing, setComparing] = useState(false)
  const [parentMatches, setParentMatches] = useState([])
  const [lookupStatus, setLookupStatus] = useState('')
  const dataRun = useRef(0)
  const compareRun = useRef(0)
  const lookupRun = useRef(0)

  const fetchActive = useCallback(async () => {
    if (!userId) throw new Error('No signed-in user.')
    const { data, error } = await supabase.from('user_medications').select('*, medication:medications(*)').eq('user_id', userId).eq('is_active', true)
    if (error) throw error
    if (!Array.isArray(data)) throw new Error('Invalid medication response.')
    return data
  }, [userId])

  const fetchAlerts = useCallback(async () => {
    if (!userId) throw new Error('No signed-in user.')
    const { data, error } = await supabase.from('safety_alerts').select('*').eq('user_id', userId).eq('is_acknowledged', false).order('severity', { ascending: false }).order('created_at', { ascending: false })
    if (error) throw error
    if (!Array.isArray(data)) throw new Error('Invalid alert response.')
    return data
  }, [userId])

  const loadData = useCallback(async () => {
    const version = ++dataRun.current
    compareRun.current += 1
    setComparing(false)
    setProposedResult(null)
    setLoading(true)
    setCurrentResult(null)
    setCheckError(false)
    const [active, alerts] = await Promise.allSettled([fetchActive(), fetchAlerts()])
    if (version !== dataRun.current) return
    setAlertError(alerts.status !== 'fulfilled')
    if (alerts.status === 'fulfilled') setSafetyAlerts(alerts.value)
    if (active.status !== 'fulfilled') {
      setCheckError(true)
      setLoading(false)
      return
    }
    setMedications(active.value.filter((item) => !item.is_supplement))
    setSupplements(active.value.filter((item) => item.is_supplement))
    try {
      const result = await checkMedicationInteractions(supabase, active.value)
      if (version === dataRun.current) setCurrentResult(result)
    } catch {
      if (version === dataRun.current) setCheckError(true)
    } finally {
      if (version === dataRun.current) setLoading(false)
    }
  }, [fetchActive, fetchAlerts])

  useEffect(() => {
    setMedications([])
    setSupplements([])
    setSafetyAlerts([])
    setProposal(blankProposal())
    setProposedError('')
    setParentMatches([])
    setLookupStatus('')
    loadData()
    return () => { dataRun.current += 1; compareRun.current += 1; lookupRun.current += 1 }
  }, [loadData])

  const updateProposal = (next) => {
    compareRun.current += 1
    setComparing(false)
    setProposedResult(null)
    setProposedError('')
    setProposal(next)
  }

  const changeParentName = (name) => {
    lookupRun.current += 1
    setParentMatches([])
    setLookupStatus('')
    updateProposal({ ...proposal, custom_name: name, medication_id: null })
  }

  const lookupParent = async () => {
    const version = ++lookupRun.current
    setParentMatches([])
    setLookupStatus('searching')
    try {
      const matches = await searchMedicationCatalog(supabase, proposal.custom_name)
      if (version !== lookupRun.current) return
      setParentMatches(matches)
      setLookupStatus(matches.length ? '' : 'unmatched')
    } catch {
      if (version === lookupRun.current) setLookupStatus('error')
    }
  }

  const compareProposal = async (event) => {
    event.preventDefault()
    let ingredients
    try {
      ingredients = normalizeMedicationIngredients(proposal.combination_ingredients)
      if (!proposal.custom_name.trim() || !proposal.dosage.trim()) throw new Error('Incomplete parent')
    } catch {
      setProposedError(t('medications.proposalIncomplete', 'Enter the parent medication name and dose, and a name plus exact label strength for every ingredient (maximum 20). Any selected catalog ID must be valid.'))
      return
    }
    const version = ++compareRun.current
    // Invalidate a stale current check while a fresh medication list is read.
    const currentVersion = ++dataRun.current
    setComparing(true)
    setLoading(true)
    setCurrentResult(null)
    setProposedResult(null)
    setCheckError(false)
    setProposedError('')
    try {
      const active = await fetchActive()
      if (currentVersion !== dataRun.current) return
      setMedications(active.filter((item) => !item.is_supplement))
      setSupplements(active.filter((item) => item.is_supplement))
      const draft = { ...proposal, id: '__proposed__', custom_name: proposal.custom_name.trim(), dosage: proposal.dosage.trim(), combination_ingredients: ingredients }
      const [current, comparison] = await Promise.all([checkMedicationInteractions(supabase, active), checkMedicationInteractions(supabase, active, draft)])
      if (currentVersion === dataRun.current) setCurrentResult(current)
      if (version === compareRun.current && currentVersion === dataRun.current) setProposedResult(comparison)
    } catch {
      if (currentVersion === dataRun.current) setCheckError(true)
      if (version === compareRun.current) setProposedError(t('medications.proposedCheckFailed', 'The comparison could not be completed. A medication or catalog query failed; do not assume the proposed medication is safe. Retry or ask a pharmacist.'))
    } finally {
      if (version === compareRun.current) setComparing(false)
      if (currentVersion === dataRun.current) setLoading(false)
    }
  }

  const acknowledgeAlert = async (alertId) => {
    const version = dataRun.current
    try {
      // Retained legacy acknowledgement only. Dynamic checks never write alerts.
      const { error } = await supabase.from('safety_alerts').update({ is_acknowledged: true, acknowledged_at: new Date().toISOString() }).eq('id', alertId).eq('user_id', userId)
      if (error) throw error
      const alerts = await fetchAlerts()
      if (version === dataRun.current) { setSafetyAlerts(alerts); setAlertError(false) }
    } catch {
      if (version === dataRun.current) setAlertError(true)
    }
  }

  const alertTypeLabel = (type) => {
    const labels = {
      interaction: t('medications.alertInteraction', 'Drug Interaction'), allergy: t('medications.alertAllergy', 'Allergy Alert'),
      duplicate: t('medications.alertDuplicate', 'Duplicate Therapy'), dosage: t('medications.alertDosage', 'Dosage Warning'),
      age: t('medications.alertAge', 'Age-Related Concern'), condition: t('medications.alertCondition', 'Medical Condition Alert')
    }
    return labels[type] || t('medications.alertOther', 'Safety Alert')
  }

  const renderList = (items, heading) => items.length > 0 && <section className="mb-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-3">{heading}</h3>
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{heading}</caption>
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="p-3">{t('medications.medicationName', 'Medication name')}</th>
            <th scope="col" className="p-3">{t('medications.dosage', 'Dosage')}</th>
            <th scope="col" className="p-3">{t('medications.frequency', 'Frequency')}</th>
            <th scope="col" className="p-3">{t('medications.ingredientCheckStatus', 'Ingredient check status')}</th>
          </tr>
        </thead>
        <tbody>{items.map(item => {
          const conflicts = (currentResult?.interactions || []).filter(row =>
            [...row.drug_a_subjects, ...row.drug_b_subjects].some(subject => subject.parent_id === item.id))
          const unresolved = (currentResult?.unresolved || []).filter(row => row.parent_id === item.id)
          const duplicates = (currentResult?.duplicates || []).filter(row => row.parent_id === item.id || row.other_parent_id === item.id)
          return (
            <tr key={item.id} className="border-t border-gray-200 align-top">
              <th scope="row" className="p-3 font-normal">
                <span className="font-semibold text-gray-800">{item.medication?.name || item.custom_name || t('medications.unnamedMedication', 'Unnamed medication')}</span>
                {getMedicationIngredientLines(item).length > 0 && <ul className="list-disc ml-5 mt-2 text-gray-700">
                  {getMedicationIngredientLines(item).map((line, index) => <li key={index}>{line}</li>)}
                </ul>}
              </th>
              <td className="p-3 text-gray-700">{item.dosage}</td>
              <td className="p-3 text-gray-700">{item.frequency}</td>
              <td className="p-3">
                {loading || checkError || !currentResult ? (
                  <p className="text-amber-800">{t('medications.checkNotVerified', 'Check not yet verified.')}</p>
                ) : (
                  <div className="space-y-1">
                    {conflicts.length > 0 && <p className="font-medium text-red-800">{t('medications.catalogConflictsFound', 'Catalog conflicts found')}: {conflicts.length}</p>}
                    {unresolved.length > 0 && <p className="text-amber-800">{t('medications.unmatchedIngredient', 'Unmatched ingredients')}: {unresolved.length}</p>}
                    {duplicates.length > 0 && <p className="text-amber-800">{t('medications.duplicateIngredients', 'Potential duplicate ingredients')}: {duplicates.length}</p>}
                    {!conflicts.length && !unresolved.length && !duplicates.length && <p className="text-gray-600">{t('medications.noListedConflictsLimited', 'No listed conflicts returned; coverage is limited.')}</p>}
                  </div>
                )}
              </td>
            </tr>
          )
        })}</tbody>
      </table>
    </div>
  </section>

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t('medications.safetyCheck', 'Medication safety check')}</h2>
        <p className="text-gray-600 mt-1">{t('medications.safetyCheckDesc', 'Review interactions and safety alerts for your medications')}</p>
        <button type="button" disabled={loading || comparing} onClick={loadData} className="mt-3 px-4 py-2 border border-blue-200 bg-blue-50 rounded-lg disabled:opacity-50">
          {t('medications.refreshInteractionCheck', 'Reload current medications and recheck')}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[{ count: medications.length, label: t('medications.activeMedications', 'Active medications') }, { count: supplements.length, label: t('medications.activeSupplements', 'Active supplements') }, { count: safetyAlerts.length, label: t('medications.activeSafetyAlerts', 'Active safety alerts') }].map((summary, index) => <div key={index} className="border border-gray-200 bg-gray-50 rounded-lg p-4 flex gap-3 items-center">
          <Shield className="w-6 h-6 text-gray-500" aria-hidden="true" /><div><p className="text-2xl font-bold text-gray-800">{summary.count}</p><p className="text-sm text-gray-600">{summary.label}</p></div>
        </div>)}
      </div>
      <CheckResults title={t('medications.currentCatalogCheck', 'Current medications and supplements: fresh catalog check')}
        result={currentResult} busy={loading} error={checkError ? t('medications.currentCheckFailed', 'The current check could not be completed. A medication or catalog query failed, or no user is signed in. No safety conclusion is available. Retry or ask a pharmacist.') : ''} />

      <section className="mb-8 space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">{t('medications.savedSafetyAlerts', 'Previously recorded safety alerts')}</h3>
        <p className="text-sm text-gray-600">{t('medications.savedAlertsHelp', 'Saved alerts are retained separately. Acknowledging one does not remove a current catalog interaction or establish safety.')}</p>
        {alertError && <p role="alert" className="text-amber-900 bg-amber-50 border border-amber-300 rounded-lg p-3">{t('medications.savedAlertsFailed', 'Saved alerts could not be loaded or acknowledged. Previously displayed alerts may be stale; do not assume there are none.')}</p>}
        {safetyAlerts.map((alert) => <div key={alert.id} className={`border-l-4 rounded-r-lg p-5 ${severityColors(alert.severity)}`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex gap-3 flex-1"><AlertTriangle className="w-6 h-6 flex-shrink-0" aria-hidden="true" /><div>
              <p className="text-sm font-medium">{String(alert.severity || '').toUpperCase()} • {alertTypeLabel(alert.alert_type)}</p>
              <h4 className="font-semibold mt-2">{alert.title}</h4><p className="text-sm mt-2">{alert.description}</p>
              {alert.recommendation && <p className="text-sm bg-white rounded-lg p-3 mt-3"><strong>{t('medications.recommendation', 'Recommendation')}:</strong> {alert.recommendation}</p>}
              {alert.metadata?.evidence_level && <p className="text-xs mt-2">{t('medications.evidenceLevel', 'Evidence Level')}: {String(alert.metadata.evidence_level).replace(/_/g, ' ').toUpperCase()}</p>}
            </div></div>
            <button type="button" onClick={() => acknowledgeAlert(alert.id)} className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium">{t('medications.acknowledge', 'Acknowledge')}</button>
          </div>
        </div>)}
        {!loading && !alertError && safetyAlerts.length === 0 && <p className="text-sm text-gray-600">{t('medications.noSavedSafetyAlerts', 'No unacknowledged saved alerts returned. This is not a safety determination.')}</p>}
      </section>

      <form onSubmit={compareProposal} className="border border-gray-200 rounded-lg p-5 mb-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">{t('medications.compareProposedMedication', 'Compare a proposed medication (not saved)')}</h3>
        <p className="text-sm text-gray-600">{t('medications.proposedMedicationHelp', 'Compare against a freshly loaded list of current medications and supplements, including pairs within the proposed combination. This does not add a medication, schedule doses, or approve treatment. A compound parent name is only a grouping label unless you select its catalog record.')}</p>
        <div>
          <label htmlFor={`${formId}-name`} className="block text-sm font-medium text-gray-700">{t('medications.proposedParentName', 'Proposed parent medication name')} *</label>
          <input id={`${formId}-name`} type="text" required value={proposal.custom_name} onChange={(event) => changeParentName(event.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label htmlFor={`${formId}-dose`} className="block text-sm font-medium text-gray-700">{t('medications.proposedParentDose', 'Parent dose as written on the label')} *</label>
          <input id={`${formId}-dose`} type="text" required value={proposal.dosage} onChange={(event) => updateProposal({ ...proposal, dosage: event.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <button type="button" onClick={lookupParent} disabled={proposal.custom_name.trim().length < 2 || lookupStatus === 'searching'} className="px-3 py-2 border border-blue-200 bg-blue-50 rounded-lg disabled:opacity-50">
          {lookupStatus === 'searching' ? t('medications.catalogSearching', 'Searching catalog…') : t('medications.lookupParentMedication', 'Look up parent medication in catalog')}
        </button>
        {parentMatches.length > 0 && <div>
          <label htmlFor={`${formId}-match`} className="block text-sm font-medium text-gray-700">{t('medications.chooseParentCatalog', 'Select the matching parent catalog record yourself')}</label>
          <select id={`${formId}-match`} value="" className="w-full border rounded-lg px-3 py-2" onChange={(event) => {
            const match = parentMatches.find((candidate) => candidate.id === event.target.value)
            if (match) { lookupRun.current += 1; setParentMatches([]); updateProposal({ ...proposal, custom_name: match.name, medication_id: match.id }) }
          }}>
            <option value="">{t('medications.selectCatalogMatch', 'Select a catalog match (not automatic)')}</option>
            {parentMatches.map((match) => <option key={match.id} value={match.id}>{match.name}{match.generic_name ? ` — ${match.generic_name}` : ''}</option>)}
          </select>
        </div>}
        <div aria-live="polite" className="text-sm text-amber-800">
          {lookupStatus === 'error' && <p>{t('medications.catalogLookupFailed', 'Catalog lookup failed. This ingredient remains unverified; no safety conclusion is available.')}</p>}
          {lookupStatus === 'unmatched' && <p>{t('medications.parentCatalogNoMatch', 'No parent catalog match found. Literal text is allowed, but a single unmatched medication cannot be checked. For a compound, resolve every explicit ingredient separately.')}</p>}
          {!isMedicationCatalogId(proposal.medication_id) && <p>{t('medications.parentCatalogUnmatched', 'No parent catalog ID selected. Text is not automatically matched; only separately resolved ingredient IDs can participate in a combination check.')}</p>}
          {isMedicationCatalogId(proposal.medication_id) && <p className="text-blue-700">{t('medications.parentCatalogSelected', 'Parent catalog record selected; catalog coverage remains limited.')}</p>}
        </div>
        <MedicationIngredientEditor value={proposal.combination_ingredients} onChange={(ingredients) => updateProposal({ ...proposal, combination_ingredients: ingredients })} />
        <button type="submit" disabled={loading || comparing || !userId} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{t('medications.runProposedComparison', 'Compare without saving')}</button>
      </form>
      {(comparing || proposedResult || proposedError) && <CheckResults title={t('medications.proposedComparisonResult', 'Current list plus proposed medication: comparison result')} result={proposedResult} busy={comparing} error={proposedError} />}

      {renderList(medications, t('medications.currentMedications', 'Current medications'))}
      {renderList(supplements, t('medications.supplementsVitamins', 'Supplements and vitamins'))}
      {!loading && !checkError && medications.length === 0 && supplements.length === 0 && <p className="text-gray-600 mb-6">{t('medications.noMedsToCheck', 'No medications to check')}</p>}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-600"><strong>{t('medications.disclaimer', 'Disclaimer')}:</strong> {t('medications.disclaimerText', 'This interaction checker is for informational purposes only. It does not replace professional medical advice. Always consult your healthcare provider before making changes to your medications. If you experience any adverse effects, seek immediate medical attention.')}</p>
      </div>
    </div>
  )
}
