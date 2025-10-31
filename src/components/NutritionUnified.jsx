import { useState } from 'react'
import { Calendar, Apple, BookOpen } from 'lucide-react'
import NutritionEnhanced from './NutritionEnhanced'
import MealPlanner from './MealPlanner'
import MealTemplates from './MealPlanner/MealTemplates'

export default function NutritionUnified({ user }) {
  const [activeTab, setActiveTab] = useState('daily') // daily, weekly, templates

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Nutrition & Meal Planning</h1>
            
            {/* Tab Navigation */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('daily')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'daily'
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Apple className="w-5 h-5" />
                Daily Tracker
              </button>
              
              <button
                onClick={() => setActiveTab('weekly')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'weekly'
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Calendar className="w-5 h-5" />
                Weekly Planner
              </button>
              
              <button
                onClick={() => setActiveTab('templates')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'templates'
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                Templates
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {activeTab === 'daily' && (
          <div>
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Log your meals throughout the day. Use templates from the Templates tab for quick entry, or switch to Weekly Planner to plan ahead!
              </p>
            </div>
            <NutritionEnhanced user={user} />
          </div>
        )}
        
        {activeTab === 'weekly' && (
          <div>
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>💡 Tip:</strong> Plan your meals for the week ahead. Create templates from your favorite meals, then generate a grocery list with one click!
              </p>
            </div>
            <MealPlanner user={user} />
          </div>
        )}
        
   
       {activeTab === 'templates' && (
  <div>
    <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
      <p className="text-sm text-purple-800">
        <strong>💡 Tip:</strong> Templates save time! Create templates from your favorite meals, then quickly add them to Daily Tracker or Weekly Planner.
      </p>
    </div>
    <MealTemplates 
      user={user}
      onSelectTemplate={(template) => {
        console.log('Selected template:', template)
        // TODO: Add template to today's meals
      }}
      onSaveTemplate={(templateData) => {
        console.log('Saved template:', templateData)
        // Reload templates
      }}
    />
  </div>
)}



