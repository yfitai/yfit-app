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
// Fallback library used when scraped_articles table is empty or inaccessible
const FALLBACK_INSIGHTS = [
  { id: 'f1', title: 'Protein timing matters less than total daily intake', summary: 'Research shows that hitting your daily protein target (0.7–1g per lb of bodyweight) is far more important than when you eat it. Spreading protein across 3–5 meals optimizes muscle protein synthesis, but the total amount is the key driver of muscle growth and retention.', source_name: 'YFIT Health Library', category: 'nutrition', url: null },
  { id: 'f2', title: 'Sleep is your most powerful recovery tool', summary: 'During deep sleep, your body releases 70% of its daily growth hormone, repairs muscle tissue, and consolidates motor patterns learned during training. Consistently getting 7–9 hours improves strength gains, reduces injury risk, and lowers cortisol levels that otherwise promote fat storage.', source_name: 'YFIT Health Library', category: 'recovery', url: null },
  { id: 'f3', title: 'Progressive overload is the #1 driver of muscle growth', summary: 'Your muscles adapt to stress. To keep growing, you must consistently increase the challenge — more weight, more reps, less rest, or better form. Even adding 2.5 lbs per week to a lift compounds to 130 lbs of progress in a year.', source_name: 'YFIT Health Library', category: 'fitness', url: null },
  { id: 'f4', title: 'Hydration directly impacts workout performance', summary: 'A 2% drop in body water causes a measurable decline in strength, endurance, and cognitive function. Aim for half your bodyweight in ounces of water daily, and add 16–24oz for every hour of exercise. Urine color is your best real-time hydration gauge — pale yellow is ideal.', source_name: 'YFIT Health Library', category: 'wellness', url: null },
  { id: 'f5', title: 'Compound movements deliver the highest return on investment', summary: 'Squats, deadlifts, bench press, rows, and overhead press recruit multiple muscle groups simultaneously, trigger greater hormonal responses, and burn more calories than isolation exercises. Building your program around these movements and supplementing with isolation work is the most efficient path to strength and physique goals.', source_name: 'YFIT Health Library', category: 'fitness', url: null },
  { id: 'f6', title: 'Fiber is the most underrated fat loss tool', summary: 'Dietary fiber slows digestion, stabilizes blood sugar, feeds beneficial gut bacteria, and increases satiety without adding net calories. Aiming for 25–35g of fiber daily from vegetables, legumes, and whole grains can reduce total calorie intake by 10–15% without conscious restriction.', source_name: 'YFIT Health Library', category: 'nutrition', url: null },
  { id: 'f7', title: 'Zone 2 cardio builds your aerobic base without killing gains', summary: 'Low-intensity steady-state cardio (60–70% max heart rate, where you can hold a conversation) improves mitochondrial density, fat oxidation, and cardiovascular efficiency without the cortisol spike of high-intensity work. 2–3 sessions of 30–45 minutes per week complements strength training rather than competing with it.', source_name: 'YFIT Health Library', category: 'fitness', url: null },
  { id: 'f8', title: 'Creatine is the most evidence-backed supplement available', summary: 'With over 500 peer-reviewed studies, creatine monohydrate consistently improves strength, power output, and muscle volume. 3–5g daily is effective for most people — no loading phase required. It is safe for long-term use and beneficial for both athletic performance and cognitive function.', source_name: 'YFIT Health Library', category: 'nutrition', url: null },
  { id: 'f9', title: 'Deload weeks accelerate long-term progress', summary: 'Planned reductions in training volume (50–60% of normal) every 4–8 weeks allow the nervous system, connective tissue, and muscles to fully recover. Athletes who deload consistently outperform those who train through fatigue, reporting greater strength gains and fewer overuse injuries over 6–12 month periods.', source_name: 'YFIT Health Library', category: 'recovery', url: null },
  { id: 'f10', title: 'Stress management is a legitimate fitness variable', summary: 'Chronic psychological stress elevates cortisol, which promotes muscle breakdown, fat storage (especially visceral), disrupts sleep, and impairs recovery. Practices like meditation, walking in nature, and social connection measurably lower cortisol and improve body composition outcomes independent of diet and exercise.', source_name: 'YFIT Health Library', category: 'mental_health', url: null },
  { id: 'f11', title: 'Meal prep reduces decision fatigue and improves adherence', summary: 'The biggest predictor of dietary success is not willpower — it is environment design. People who prepare meals in advance make fewer impulsive food choices, consume fewer calories overall, and maintain their nutrition targets 40% more consistently than those who decide what to eat in the moment.', source_name: 'YFIT Health Library', category: 'nutrition', url: null },
  { id: 'f12', title: 'Mobility work prevents injury and improves performance', summary: 'Restricted range of motion forces compensatory movement patterns that accumulate into overuse injuries. 10–15 minutes of targeted mobility work daily — focusing on hips, thoracic spine, and shoulders — improves lifting mechanics, reduces joint pain, and allows greater muscle activation through full range of motion.', source_name: 'YFIT Health Library', category: 'recovery', url: null },
  { id: 'f13', title: 'Tracking food intake, even briefly, transforms awareness', summary: 'Studies show that people who track food intake for just 2–4 weeks gain lasting insight into their actual eating patterns. Most people underestimate calorie intake by 20–40%. Even imperfect tracking — logging 80% of meals — produces significantly better outcomes than not tracking at all.', source_name: 'YFIT Health Library', category: 'nutrition', url: null },
  { id: 'f14', title: 'Muscle memory makes returning to fitness faster than starting fresh', summary: 'Myonuclei — the cellular machinery for muscle growth — persist for years after detraining. This is why people who were previously fit regain strength and muscle mass 2–3x faster than true beginners. A 3-month break from training does not erase years of progress.', source_name: 'YFIT Health Library', category: 'fitness', url: null },
  { id: 'f15', title: 'Walking is one of the most effective fat loss tools', summary: 'Non-exercise activity thermogenesis (NEAT) — the calories burned through everyday movement — can vary by up to 2,000 calories per day between individuals. Increasing daily steps from 5,000 to 10,000 can create a 300–500 calorie daily deficit without any formal exercise, making walking one of the most sustainable fat loss strategies.', source_name: 'YFIT Health Library', category: 'wellness', url: null },
]

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
      // Try to get a fresh article added today first
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      let { data: todayData } = await supabase
        .from('scraped_articles')
        .select('id, title, summary, url, source_name, category, relevance_score')
        .gte('created_at', today.toISOString())
        .order('relevance_score', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (todayData) {
        setArticle(todayData)
        return
      }

      // No new article today — rotate through the library using today's date as a seed
      // This ensures a different article shows each day without needing a live scraper
      const { data: allArticles } = await supabase
        .from('scraped_articles')
        .select('id, title, summary, url, source_name, category, relevance_score')
        .order('relevance_score', { ascending: false })
        .limit(60) // fetch top 60 by relevance to rotate through

      // If DB query fails or returns empty, use the built-in fallback library
      const library = (allArticles && allArticles.length > 0) ? allArticles : FALLBACK_INSIGHTS

      // Get recently seen article IDs from localStorage (last 30 days)
      let seenIds = []
      try {
        const raw = localStorage.getItem('yfit_insight_seen_ids')
        seenIds = raw ? JSON.parse(raw) : []
        // Keep only last 30 entries
        if (seenIds.length > 30) seenIds = seenIds.slice(-30)
      } catch {}

      // Prefer articles not recently seen; fall back to full list if all seen
      const unseen = library.filter(a => !seenIds.includes(a.id))
      const pool = unseen.length > 0 ? unseen : library

      // Use day-of-year as a stable daily index (same article all day, different each day)
      const dayOfYear = Math.floor((Date.now() - new Date(today.getFullYear(), 0, 0)) / 86400000)
      const picked = pool[dayOfYear % pool.length]

      // Record this article as seen
      try {
        const updated = [...seenIds.filter(id => id !== picked.id), picked.id]
        localStorage.setItem('yfit_insight_seen_ids', JSON.stringify(updated))
      } catch {}

      setArticle(picked)
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
