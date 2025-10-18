import { useState } from 'react'
import { Calendar, Apple, BookOpen } from 'lucide-react'
import NutritionEnhanced from './NutritionEnhanced'
import MealPlanner from './MealPlanner'
//import MealTemplates from './MealPlanner/MealTemplates'

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
            <TemplatesView user={user} />
          </div>
        )}
      </div>
    </div>
  )
}

// Dedicated Templates View
function TemplatesView({ user }) {
  const [templates, setTemplates] = useState([])
  const [filter, setFilter] = useState('all') // all, breakfast, lunch, dinner, snack, favorites

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Meal Templates</h2>
        <button className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-shadow">
          Create New Template
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'favorites', 'breakfast', 'lunch', 'dinner', 'snack'].map(filterType => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
              filter === filterType
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filterType}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* This will be populated with actual templates */}
        <TemplateCard
          name="Healthy Breakfast"
          calories={450}
          protein={35}
          carbs={45}
          fat={12}
          items={4}
          usedCount={12}
          type="breakfast"
        />
        <TemplateCard
          name="Protein Lunch"
          calories={620}
          protein={55}
          carbs={50}
          fat={18}
          items={5}
          usedCount={8}
          type="lunch"
        />
        <TemplateCard
          name="Light Dinner"
          calories={380}
          protein={30}
          carbs={35}
          fat={10}
          items={3}
          usedCount={15}
          type="dinner"
        />
      </div>

      {/* Empty State */}
      {templates.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Templates Yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first meal template to save time on meal planning and logging!
          </p>
          <button className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-shadow">
            Create Your First Template
          </button>
        </div>
      )}
    </div>
  )
}

// Template Card Component
function TemplateCard({ name, calories, protein, carbs, fat, items, usedCount, type }) {
  const typeColors = {
    breakfast: 'bg-yellow-100 text-yellow-800',
    lunch: 'bg-blue-100 text-blue-800',
    dinner: 'bg-purple-100 text-purple-800',
    snack: 'bg-green-100 text-green-800'
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-lg">{name}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${typeColors[type]}`}>
          {type}
        </span>
      </div>

      <div className="mb-3">
        <div className="text-2xl font-bold text-gray-900">{calories} cal</div>
        <div className="text-sm text-gray-600 mt-1">
          P: {protein}g • C: {carbs}g • F: {fat}g
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <span>{items} items</span>
        <span>Used {usedCount} times</span>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
          Add to Daily
        </button>
        <button className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium">
          Add to Planner
        </button>
      </div>
    </div>
  )
}
