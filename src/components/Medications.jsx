import { useState } from 'react'
import { Pill, AlertTriangle, FileText, Users, Activity } from 'lucide-react'
import MedicationList from './MedicationList'
import MedicationSearch from './MedicationSearch'
import InteractionChecker from './InteractionChecker'
import MedicationLog from './MedicationLog'
import ProviderReport from './ProviderReport'

export default function Medications({ user }) {
  const [activeTab, setActiveTab] = useState('my-medications')

  const tabs = [
    { id: 'my-medications', label: 'My Medications', icon: Pill },
    { id: 'add-medication', label: 'Add Medication', icon: Pill },
    { id: 'interactions', label: 'Safety Check', icon: AlertTriangle },
    { id: 'adherence', label: 'Adherence Log', icon: Activity },
    { id: 'providers', label: 'Provider Report', icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
            Medication Management
          </h1>
          <p className="text-gray-600">
            Track medications, check interactions, and manage your health safely
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800 font-medium">
                Important Medical Disclaimer
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                This tool is for informational purposes only and is not a substitute for professional medical advice, 
                diagnosis, or treatment. Always consult your healthcare provider before starting, stopping, or changing 
                any medication. In case of emergency, call 911 or your local emergency services.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 font-medium transition-all whitespace-nowrap flex-shrink-0 text-sm sm:text-base ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'my-medications' && <MedicationList user={user} />}
          {activeTab === 'add-medication' && <MedicationSearch user={user} />}
          {activeTab === 'interactions' && <InteractionChecker user={user} />}
          {activeTab === 'adherence' && <MedicationLog user={user} />}
          {activeTab === 'providers' && <ProviderReport user={user} />}
        </div>
      </div>
    </div>
  )
}
