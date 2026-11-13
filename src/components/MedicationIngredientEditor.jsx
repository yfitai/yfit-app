import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { MAX_MEDICATION_INGREDIENTS, isMedicationCatalogId, searchMedicationCatalog } from '../lib/medicationIngredients'

function IngredientRow({ row, index, onChange, onRemove }) {
  const { t } = useTranslation()
  const id = useId()
  const request = useRef(0)
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    request.current += 1
    setResults([])
    setSearching(false)
    setStatus('')
    return () => { request.current += 1 }
  }, [row.name, row.dosage, row.medication_id])

  const changeName = (name) => {
    request.current += 1 // Invalidate immediately, before the next render/effect.
    setResults([])
    setSearching(false)
    setStatus('')
    onChange({ ...row, name, medication_id: null })
  }

  const changeStrength = (dosage) => {
    request.current += 1
    setResults([])
    setSearching(false)
    setStatus('')
    onChange({ ...row, dosage })
  }

  const lookup = async () => {
    const version = ++request.current
    setSearching(true)
    setResults([])
    setStatus('')
    try {
      const matches = await searchMedicationCatalog(supabase, row.name)
      if (version !== request.current) return
      setResults(matches)
      if (!matches.length) setStatus('unmatched')
    } catch {
      if (version === request.current) setStatus('error')
    } finally {
      if (version === request.current) setSearching(false)
    }
  }

  return (
    <fieldset className="border border-gray-200 rounded-lg p-3 space-y-3">
      <legend className="px-1 text-sm font-medium text-gray-700">
        {t('medications.ingredient', 'Ingredient')} {index + 1}
      </legend>
      <div>
        <label htmlFor={`${id}-name`} className="block text-sm font-medium text-gray-700">
          {t('medications.ingredientName', 'Ingredient name')} *
        </label>
        <input id={`${id}-name`} type="text" required value={row.name || ''}
          onChange={(event) => changeName(event.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2" />
      </div>
      <div>
        <label htmlFor={`${id}-strength`} className="block text-sm font-medium text-gray-700">
          {t('medications.ingredientStrength', 'Exact label strength')} *
        </label>
        <input id={`${id}-strength`} type="text" required value={row.dosage || ''}
          onChange={(event) => changeStrength(event.target.value)}
          placeholder={t('medications.ingredientStrengthPlaceholder', 'Copy the strength exactly from the label')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2" />
      </div>
      <button type="button" onClick={lookup} disabled={searching || (row.name || '').trim().length < 2}
        className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg disabled:opacity-50">
        {searching ? t('medications.catalogSearching', 'Searching catalog…') : t('medications.lookupIngredient', 'Look up ingredient in catalog')}
      </button>
      {results.length > 0 && (
        <div>
          <label htmlFor={`${id}-match`} className="block text-sm font-medium text-gray-700">
            {t('medications.chooseCatalogIngredient', 'Select the matching catalog ingredient yourself')}
          </label>
          <select id={`${id}-match`} value="" className="w-full border rounded-lg px-3 py-2"
            onChange={(event) => {
              const match = results.find((candidate) => candidate.id === event.target.value)
              if (match) {
                request.current += 1
                setResults([])
                onChange({ ...row, name: match.name, medication_id: match.id })
              }
            }}>
            <option value="">{t('medications.selectCatalogMatch', 'Select a catalog match (not automatic)')}</option>
            {results.map((match) => <option key={match.id} value={match.id}>{match.name}{match.generic_name ? ` — ${match.generic_name}` : ''}</option>)}
          </select>
        </div>
      )}
      <div aria-live="polite" className="text-sm">
        {status === 'error' && <p className="text-amber-800">{t('medications.catalogLookupFailed', 'Catalog lookup failed. This ingredient remains unverified; no safety conclusion is available.')}</p>}
        {status === 'unmatched' && <p className="text-amber-800">{t('medications.catalogNoMatch', 'No catalog match found. You may keep the literal name and strength, but this ingredient cannot be checked.')}</p>}
        {isMedicationCatalogId(row.medication_id)
          ? <p className="text-blue-700">{t('medications.catalogIngredientSelected', 'Catalog record selected. Coverage is still limited and not dose-specific.')}</p>
          : <p className="text-amber-800">{t('medications.ingredientUnmatched', 'Manual or unmatched ingredient: not checked until you select a catalog record. Do not assume it is safe.')}</p>}
      </div>
      <button type="button" onClick={onRemove} className="px-3 py-2 border rounded-lg text-red-700">
        {t('medications.removeIngredient', 'Remove ingredient')} {index + 1}
      </button>
    </fieldset>
  )
}

/** Controlled draft rows; persistence callers must normalize/validate before save. */
export default function MedicationIngredientEditor({ value, onChange }) {
  const { t } = useTranslation()
  const rows = Array.isArray(value) ? value : []
  const emit = (next) => onChange(next.length ? next : null)
  return (
    <section className="space-y-3" aria-label={t('medications.combinationIngredients', 'Optional combination ingredients')}>
      <h4 className="font-medium text-gray-800">{t('medications.combinationIngredients', 'Optional combination ingredients')}</h4>
      <p className="text-sm text-gray-600">
        {t('medications.combinationIngredientsHelp', 'For a compound or combination, enter each ingredient name and exact label strength separately (maximum 20). These stay grouped under one medication and one schedule; strengths are not added together. Old dosage text is not parsed.')}
      </p>
      {rows.slice(0, MAX_MEDICATION_INGREDIENTS).map((row, index) => (
        <IngredientRow key={index} row={row || {}} index={index}
          onChange={(next) => emit(rows.map((current, position) => position === index ? next : current))}
          onRemove={() => emit(rows.filter((_, position) => position !== index))} />
      ))}
      {rows.length >= MAX_MEDICATION_INGREDIENTS && <p className="text-amber-800 text-sm">{t('medications.ingredientLimit', 'Maximum 20 ingredients. Additional ingredients cannot be checked here.')}</p>}
      <button type="button" disabled={rows.length >= MAX_MEDICATION_INGREDIENTS}
        onClick={() => emit([...rows, { name: '', dosage: '', medication_id: null }])}
        className="px-3 py-2 border border-blue-200 bg-blue-50 rounded-lg disabled:opacity-50">
        {t('medications.addIngredient', 'Add ingredient')}
      </button>
    </section>
  )
}
