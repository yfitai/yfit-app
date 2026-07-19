/**
 * GuestAICoachPage.jsx
 * Interactive demo AI coach page for guest/demo mode.
 * Shows a pre-loaded conversation and lets visitors type questions (fires sign-up modal).
 * No Supabase calls — all data from demoData.js.
 */

import { useState, useRef, useEffect } from 'react'
import { demoAICoach } from '../data/demoData'
import { setGuestTrigger } from '../lib/guestSession'

function ChatBubble({ message }) {
  const isUser = message.role === 'user'
  const time = new Date(message.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${
        isUser ? 'bg-blue-600 text-white' : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white'
      }`}>
        {isUser ? 'A' : '🤖'}
      </div>

      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
        }`}>
          {message.content}
        </div>
        <span className="text-[10px] text-gray-400 px-1">{time}</span>
      </div>
    </div>
  )
}

export default function GuestAICoachPage({ onSignUp }) {
  const [inputValue, setInputValue] = useState('')
  const [showTypingHint, setShowTypingHint] = useState(false)
  const messagesEndRef = useRef(null)

  const { recentMessages, suggestedQuestions } = demoAICoach

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleSend = () => {
    setGuestTrigger('ai_coach', 'Chat with your AI coach')
    onSignUp('ai_coach')
  }

  const handleSuggestedQuestion = (q) => {
    setInputValue(q)
    setGuestTrigger('ai_coach', 'Ask your AI coach a question')
    onSignUp('ai_coach')
  }

  const handleInputFocus = () => {
    setShowTypingHint(true)
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[calc(100vh-180px)] min-h-[500px]">

      {/* Header */}
      <div className="px-4 pt-6 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xl">
            🤖
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">AI Coach</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xs text-gray-500">Online · Personalised for Alex</p>
            </div>
          </div>
        </div>
      </div>

      {/* Capabilities strip */}
      <div className="px-4 pb-3 flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {['💊 Medication-aware', '🏋️ Workout advice', '🥗 Nutrition help', '😴 Sleep & recovery', '📊 Data insights'].map(tag => (
            <span key={tag} className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
        {/* Welcome message */}
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <p className="text-sm font-bold text-violet-800 mb-1">👋 Hi Alex! I'm your YFIT AI Coach.</p>
          <p className="text-xs text-violet-700 leading-relaxed">
            I know your goals, your workout plan, your nutrition targets, and your medications. Ask me anything about fitness, nutrition, recovery, or how your prescriptions affect your training.
          </p>
        </div>

        {/* Demo conversation */}
        {recentMessages.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}

        {/* Typing indicator hint */}
        {showTypingHint && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-sm">
              🤖
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      <div className="px-4 pb-2 flex-shrink-0">
        <p className="text-xs text-gray-500 font-semibold mb-2">Suggested questions:</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSuggestedQuestion(q)}
              className="flex-shrink-0 text-xs px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 transition-all text-left max-w-[200px]"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-6 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onFocus={handleInputFocus}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask your AI coach anything..."
              className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
            />
          </div>
          <button
            onClick={handleSend}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center hover:opacity-90 transition-all shadow flex-shrink-0"
          >
            <svg className="w-5 h-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {/* Sign-up nudge */}
        <div className="mt-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold">Get your personalised AI coach</p>
            <p className="text-[10px] opacity-80">Medication-aware · Goal-focused · Available 24/7</p>
          </div>
          <button
            onClick={handleSend}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-white text-violet-700 text-xs font-bold hover:bg-violet-50 transition-all"
          >
            Start free →
          </button>
        </div>
      </div>
    </div>
  )
}
