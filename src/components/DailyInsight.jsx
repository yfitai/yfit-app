import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Lightbulb, ChevronDown, ChevronUp, X, ExternalLink, BookOpen } from 'lucide-react'

/**
 * DailyInsight — Persistent daily health headline strip
 * 
 * Fetches the highest-relevance unprocessed article from scraped_articles
 * that was added today (or falls back to the most recent article).
 * Shows a slim dismissible strip with expand-in-place "Read More".
 * 
 * Usage:
 *   <DailyInsight />                    — slim strip mode (for App.jsx global placement)
 *   <DailyInsight variant="card" />     — full card mode (for Dashboard)
 */
export default function DailyInsight({ variant = 'strip', className = '' }) {
  const [article, setArticle] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user dismissed today's insight
    const dismissedDate = localStorage.getItem('yfit_insight_dismissed_date')
    const today = new Date().toDateString()
    if (dismissedDate === today) {
      setDismissed(true)
      setLoading(false)
      return
    }
    fetchDailyInsight()
  }, [])

  const fetchDailyInsight = async () => {
    try {
      // Try to get today's top article first
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      let { data, error } = await supabase
        .from('scraped_articles')
        .select('id, title, summary, url, source_name, category, relevance_score')
        .gte('created_at', today.toISOString())
        .order('relevance_score', { ascending: false })
        .limit(1)
        .single()

      // If no article today, fall back to the most recent high-relevance article
      if (error || !data) {
        const fallback = await supabase
          .from('scraped_articles')
          .select('id, title, summary, url, source_name, category, relevance_score')
          .order('relevance_score', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!fallback.error && fallback.data) {
          setArticle(fallback.data)
        }
      } else {
        setArticle(data)
      }
    } catch (err) {
      console.error('DailyInsight fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('yfit_insight_dismissed_date', new Date().toDateString())
    setDismissed(true)
  }

  const getCategoryColor = (category) => {
    const colors = {
      nutrition: 'bg-green-100 text-green-700',
      fitness: 'bg-blue-100 text-blue-700',
      recovery: 'bg-purple-100 text-purple-700',
      mental_health: 'bg-pink-100 text-pink-700',
      wellness: 'bg-teal-100 text-teal-700',
    }
    return colors[category] || 'bg-gray-100 text-gray-600'
  }

  const getCategoryLabel = (category) => {
    const labels = {
      nutrition: 'Nutrition',
      fitness: 'Fitness',
      recovery: 'Recovery',
      mental_health: 'Mental Health',
      wellness: 'Wellness',
    }
    return labels[category] || 'Health'
  }

  // Don't render if dismissed, loading with no data, or no article found
  if (dismissed || loading || !article) return null

  // ── STRIP VARIANT (slim, persistent, below nav) ──────────────────────────
  if (variant === 'strip') {
    return (
      <div className={`bg-gradient-to-r from-green-50 via-blue-50 to-green-50 border-b border-green-200 ${className}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          {/* Collapsed strip */}
          <div className="flex items-center gap-2 py-2 min-h-[40px]">
            <Lightbulb className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-green-700 flex-shrink-0 hidden sm:inline">
              Daily Insight
            </span>
            {article.category && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${getCategoryColor(article.category)}`}>
                {getCategoryLabel(article.category)}
              </span>
            )}
            <p className="text-xs text-gray-700 flex-1 truncate font-medium">
              {article.title}
            </p>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-0.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                aria-label={expanded ? 'Collapse insight' : 'Read more'}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{expanded ? 'Less' : 'Read'}</span>
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors ml-1"
                aria-label="Dismiss for today"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Expanded content — inline, no page navigation */}
          {expanded && (
            <div className="pb-3 pt-1 border-t border-green-100">
              <p className="text-sm text-gray-700 leading-relaxed">
                {article.summary}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  Source: {article.source_name || 'YFIT Health Library'}
                </span>
                {article.url && !article.url.includes('yfitai.com/library') && (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Full Article <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── CARD VARIANT (for Dashboard page) ────────────────────────────────────
  return (
    <div className={`rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-blue-50 overflow-hidden ${className}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-green-700 uppercase tracking-wide">
                  Daily Insight
                </span>
                {article.category && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getCategoryColor(article.category)}`}>
                    {getCategoryLabel(article.category)}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-800 leading-snug">
                {article.title}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss for today"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Expand/collapse button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <BookOpen className="h-4 w-4" />
          {expanded ? 'Show less' : 'Read the research'}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {/* Expanded summary */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-green-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              {article.summary}
            </p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500">
                Source: {article.source_name || 'YFIT Health Library'}
              </span>
              {article.url && !article.url.includes('yfitai.com/library') && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Full Article <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
