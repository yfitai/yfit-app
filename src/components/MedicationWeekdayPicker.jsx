import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { getWeeklyDoseCount, getWeekdayLabels } from '../lib/medicationSchedule'

export default function MedicationWeekdayPicker({ frequency, days = [], onChange }) {
  const { t, i18n } = useTranslation()
  const groupId = useId()
  const requiredDays = getWeeklyDoseCount(frequency)
  if (!requiredDays) return null

  const selected = Array.isArray(days) ? days : []
  const toggleDay = (day) => {
    if (requiredDays === 1) {
      onChange([day])
    } else if (selected.includes(day)) {
      onChange(selected.filter(value => value !== day))
    } else if (selected.length < requiredDays) {
      onChange([...selected, day].sort((a, b) => a - b))
    }
  }

  return (
    <fieldset className="md:col-span-2 rounded-lg border border-blue-200 bg-blue-50/60 p-4">
      <legend className="px-1 text-sm font-medium text-gray-800">
        {t('medications.dosingDays')} *
      </legend>
      <p className="mb-3 text-sm text-gray-600" id={`${groupId}-help`}>
        {t(requiredDays === 1 ? 'medications.chooseOneDay' : 'medications.chooseTwoDays')}
      </p>
      <div className="flex flex-wrap gap-2" aria-describedby={`${groupId}-help`}>
        {getWeekdayLabels(i18n.resolvedLanguage || i18n.language || 'en').map(({ value, label }) => {
          const checked = selected.includes(value)
          return (
            <label
              key={value}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                checked ? 'border-blue-500 bg-blue-100 text-blue-900' : 'border-gray-300 bg-white text-gray-700'
              }`}
            >
              <input
                type={requiredDays === 1 ? 'radio' : 'checkbox'}
                name={`${groupId}-weekday`}
                value={value}
                checked={checked}
                disabled={!checked && requiredDays === 2 && selected.length >= requiredDays}
                onChange={() => toggleDay(value)}
                className="h-4 w-4 accent-blue-600 disabled:opacity-40"
              />
              {label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
