import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ThumbsUp, 
  ThumbsDown,
  BookOpen,
  Sparkles
} from 'lucide-react'

export default function FAQBrowser({ userId, onAskAICoach }) {
  const [categories, setCategories] = useState([])
  const [articles, setArticles] = useState([])
  const [filteredArticles, setFilteredArticles] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedArticle, setExpandedArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
    loadArticles()
  }, [])

  useEffect(() => {
    filterArticles()
  }, [searchQuery, selectedCategory, articles])

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('faq_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      if (error) throw error
      console.log('Loaded categories:', data)
      setCategories(data || [])
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  const loadArticles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('faq_articles')
        .select('*')
        .eq('is_published', true)
        .order('display_order')

      if (error) throw error
      console.log('Loaded articles:', data)
      setArticles(data || [])
      setFilteredArticles(data || [])
    } catch (err) {
      console.error('Error loading articles:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterArticles = () => {
    let filtered = articles

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(article => article.category_id === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(article =>
        article.question.toLowerCase().includes(query) ||
        article.answer.toLowerCase().includes(query) ||
        (article.keywords && article.keywords.some(keyword => 
          keyword.toLowerCase().includes(query)
        ))
      )
    }

    setFilteredArticles(filtered)
  }

  const toggleArticle = async (articleId) => {
    if (expandedArticle === articleId) {
      setExpandedArticle(null)
    } else {
      setExpandedArticle(articleId)
      
      // Track view
      await supabase
        .from('faq_article_views')
        .insert([{
          article_id: articleId,
          user_id: userId,
          viewed_at: new Date().toISOString()
        }])

      // Track interaction
      await supabase
        .from('help_interactions')
        .insert([{
          user_id: userId,
          interaction_type: 'faq_view',
          source: 'web',
          result_type: 'faq_article',
          result_id: articleId
        }])
    }
  }

  const handleFeedback = async (articleId, isHelpful) => {
    try {
      // Update article feedback counts
      const article = articles.find(a => a.id === articleId)
      if (!article) return

      const updateData = isHelpful
        ? { helpful_count: article.helpful_count + 1 }
        : { not_helpful_count: article.not_helpful_count + 1 }

      await supabase
        .from('faq_articles')
        .update(updateData)
        .eq('id', articleId)

      // Record feedback
      await supabase
        .from('faq_article_views')
        .insert([{
          article_id: articleId,
          user_id: userId,
          was_helpful: isHelpful,
          viewed_at: new Date().toISOString()
        }])

      // Update local state
      setArticles(prev => prev.map(a =>
        a.id === articleId
          ? { ...a, ...updateData }
          : a
      ))
    } catch (err) {
      console.error('Error recording feedback:', err)
    }
  }

  const getCategoryIcon = (icon) => {
    // Return the emoji or a default icon
    return icon || '📚'
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Search Bar */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="p-4 border-b">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap"
            >
              <span className="mr-1">{getCategoryIcon(category.icon)}</span>
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Articles List */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Loading FAQ articles...
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedCategory
                ? 'No articles found matching your search.'
                : 'No FAQ articles available.'}
            </p>
            <Button
              onClick={() => onAskAICoach && onAskAICoach()}
              variant="outline"
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Ask AI Coach Instead
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredArticles.map(article => {
              const category = categories.find(c => c.id === article.category_id)
              const isExpanded = expandedArticle === article.id

              return (
                <Card key={article.id} className="overflow-hidden">
                  <button
                    onClick={() => toggleArticle(article.id)}
                    className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {category && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                              {getCategoryIcon(category.icon)} {category.name}
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {article.question}
                        </h3>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t">
                      <div className="pt-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {article.answer}
                      </div>
                      
                      {/* Feedback buttons */}
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                        <span className="text-sm text-gray-500">Was this helpful?</span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeedback(article.id, true)}
                            className="gap-1"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            <span className="text-xs">{article.helpful_count || 0}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeedback(article.id, false)}
                            className="gap-1"
                          >
                            <ThumbsDown className="h-4 w-4" />
                            <span className="text-xs">{article.not_helpful_count || 0}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50 dark:bg-gray-900">
        <p className="text-xs text-gray-500 text-center mb-2">
          Can't find what you're looking for?
        </p>
        <Button
          onClick={() => onAskAICoach && onAskAICoach()}
          variant="outline"
          className="w-full gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Ask AI Coach
        </Button>
      </div>
    </div>
  )
}

