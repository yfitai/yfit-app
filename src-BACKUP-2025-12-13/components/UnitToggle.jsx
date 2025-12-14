import { useUnitPreference } from '../contexts/UnitPreferenceContext'

export default function UnitToggle() {
  const { unitSystem, toggleUnitSystem, loading } = useUnitPreference()

  if (loading) {
    return null // Don't show toggle while loading
  }

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm px-3 py-2 border border-gray-200">
      <span className="text-sm font-medium text-gray-600">Units:</span>
      
      <button
        onClick={toggleUnitSystem}
        className="relative flex items-center gap-3 bg-gray-100 rounded-full p-1 transition-all duration-200 hover:bg-gray-150"
        aria-label={`Switch to ${unitSystem === 'metric' ? 'imperial' : 'metric'} units`}
      >
        {/* Metric Option */}
        <div className={`relative flex items-center justify-center px-3 py-1 rounded-full transition-all duration-200 ${
          unitSystem === 'metric' 
            ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md' 
            : 'text-gray-600'
        }`}>
          <span className="text-sm font-medium">Metric</span>
          {unitSystem === 'metric' && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
          )}
        </div>

        {/* Imperial Option */}
        <div className={`relative flex items-center justify-center px-3 py-1 rounded-full transition-all duration-200 ${
          unitSystem === 'imperial' 
            ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md' 
            : 'text-gray-600'
        }`}>
          <span className="text-sm font-medium">Imperial</span>
          {unitSystem === 'imperial' && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
          )}
        </div>
      </button>

      {/* Current Unit Display */}
      <span className="text-xs text-gray-500 ml-1">
        ({unitSystem === 'metric' ? 'kg, cm' : 'lbs, in'})
      </span>
    </div>
  )
}
