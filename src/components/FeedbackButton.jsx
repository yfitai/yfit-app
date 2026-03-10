import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { MessageSquarePlus, X, Bug, Lightbulb, Heart, MessageCircle, Send, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'

const FEEDBACK_TYPES = [
  { value: 'bug', label: 'Bug Report', icon: <Bug className="w-4 h-4" />, color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'feature_request', label: 'Feature Request', icon: <Lightbulb className="w-4 h-4" />, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { value: 'general', label: 'General Feedback', icon: <MessageCircle className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'praise', label: 'Praise / Love It!', icon: <Heart className="w-4 h-4" />, color: 'text-pink-600 bg-pink-50 border-pink-200' },
]

const CATEGORIES = [
  'Nutrition', 'Fitness', 'Medications', 'Daily Tracker', 'Predictions', 'AI Coach', 'Account', 'Other'
]

export default function FeedbackButton({ user }) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [feedbackType, setFeedbackType] = useState('bug')
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      setError('Please fill in the title and description.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await supabase.from('user_feedback').insert({
        user_id: user?.id || null,
        type: feedbackType,
        category: category || 'Other',
        title: title.trim(),
        description: description.trim(),
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        app_version: import.meta.env.VITE_APP_VERSION || '1.0.0-beta',
      })
      setSubmitted(true)
      // Auto-close after 3 seconds
      setTimeout(() => {
        setOpen(false)
        setSubmitted(false)
        setTitle('')
        setDescription('')
        setCategory('')
        setFeedbackType('bug')
      }, 3000)
    } catch (err) {
      setError('Failed to submit feedback. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-gradient-to-br from-blue-600 to-green-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center"
        title="Send Feedback"
        aria-label="Open feedback form"
      >
        <MessageSquarePlus className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Modal */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-green-600 p-4 flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold text-sm">Send Feedback</h3>
              <p className="text-blue-100 text-xs">Help us improve YFIT</p>
            </div>
            <button 
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {submitted ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-800 mb-1">Thank you!</h4>
              <p className="text-sm text-gray-500">Your feedback has been received. We read every submission.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Type selector */}
              <div className="grid grid-cols-2 gap-2">
                {FEEDBACK_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setFeedbackType(t.value)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all ${
                      feedbackType === t.value ? t.color + ' border-2' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Category */}
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select area...</option>
                  {CATEGORIES.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <Label className="text-xs">Title *</Label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={feedbackType === 'bug' ? 'e.g. Scanner crashes on iPhone' : 'Brief summary...'}
                  className="text-sm"
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label className="text-xs">Description *</Label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={feedbackType === 'bug' 
                    ? 'Steps to reproduce: 1. Go to... 2. Tap... 3. See error' 
                    : 'Tell us more...'}
                  rows={3}
                  maxLength={1000}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-400 text-right">{description.length}/1000</p>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-sm"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Submit Feedback
                  </span>
                )}
              </Button>
            </form>
          )}
        </div>
      )}
    </>
  )
}
