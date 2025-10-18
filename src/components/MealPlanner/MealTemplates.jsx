import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Star, Plus } from 'lucide-react'
import CreateTemplateModal from './CreateTemplateModal'

export default function MealTemplates({ user, onSelectTemplate, onSaveTemplate }) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, breakfast, lunch, dinner, snack, favorites
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadTemplates()
    
    // Listen for template updates
    const handleTemplatesUpdated = () => {
      console.log('[MealTemplates] Reloading templates after update')
      loadTemplates()
    }
    
    window.addEventListener('yfit-templates-updated', handleTemplatesUpdated)
    
    return () => {
      window.removeEventListener('yfit-templates-updated', handleTemplatesUpdated)
    }
  }, [user])

  async function loadTemplates() {
    if (!user) return

    setLoading(true)
    try {
      // Demo mode - use localStorage
      if (user.id === 'demo-user-id') {
        console.log('[MealTemplates] Loading from localStorage')
        const demoTemplates = JSON.parse(localStorage.getItem('yfit_demo_meal_templates') || '[]')
        console.log('[MealTemplates] Loaded templates:', demoTemplates)
        setTemplates(demoTemplates)
        setLoading(false)
        return
      }

      // Real user - use Supabase
      const { data, error } = await supabase
        .from('meal_templates')
        .select(`
          *,
          meal_template_items (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    if (filter === 'all') return true
    if (filter === 'favorites') return template.is_favorite
    return template.meal_type === filter
  })

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Meal Templates</h3>
        
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {['all', 'favorites', 'breakfast', 'lunch', 'dinner', 'snack'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                filter === filterOption
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption === 'favorites' && <Star className="w-3 h-3 inline mr-1" />}
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Templates List */}
      <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No templates yet</p>
            <p className="text-sm">Save your favorite meals to reuse them quickly!</p>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className="w-full p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="font-medium text-gray-900">{template.template_name}</div>
                {template.is_favorite && (
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                )}
              </div>
              
              {template.description && (
                <div className="text-sm text-gray-600 mb-2">{template.description}</div>
              )}
              
              <div className="flex gap-3 text-sm text-gray-600">
                <span>{template.total_calories} cal</span>
                <span>P: {template.total_protein}g</span>
                <span>C: {template.total_carbs}g</span>
                <span>F: {template.total_fat}g</span>
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                {(template.meal_template_items?.length || template.meals?.length || 0)} items • Used {template.use_count || 0} times
              </div>
            </button>
          ))
        )}
      </div>

      {/* Create Template Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <CreateTemplateModal
          onSave={(templateData) => {
            onSaveTemplate(templateData)
            setShowCreateModal(false)
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  )
}
