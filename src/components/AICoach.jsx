import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Send, ThumbsUp, ThumbsDown, Loader2, Sparkles, RefreshCw } from 'lucide-react'

export default function AICoach({ userId }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)

  // Load or create conversation on mount
  useEffect(() => {
    loadOrCreateConversation()
  }, [userId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const loadOrCreateConversation = async () => {
    try {
      // Try to load the most recent active conversation
      const { data: existingConversation, error: fetchError } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false })
        .limit(1)
        .single()

      if (existingConversation) {
        setConversationId(existingConversation.id)
        await loadMessages(existingConversation.id)
      } else {
        // Create a new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('ai_conversations')
          .insert([{
            user_id: userId,
            title: 'New Conversation',
            status: 'active'
          }])
          .select()
          .single()

        if (createError) throw createError
        setConversationId(newConversation.id)
        
        // Add welcome message
        const welcomeMessage = {
          role: 'assistant',
          content: "Hi there! I'm your YFIT AI Coach. I'm here to help you with your fitness and nutrition questions. How can I assist you today?"
        }
        setMessages([welcomeMessage])
      }
    } catch (err) {
      console.error('Error loading conversation:', err)
      setError('Failed to load conversation. Please try again.')
    }
  }

  const loadMessages = async (convId) => {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (err) {
      console.error('Error loading messages:', err)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = {
      role: 'user',
      content: inputMessage.trim()
    }

    // Add user message to UI immediately
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setError(null)

    try {
      // Save user message to database
      await supabase
        .from('ai_messages')
        .insert([{
          conversation_id: conversationId,
          role: 'user',
          content: userMessage.content
        }])

      // Call OpenAI via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: {
          conversation_id: conversationId,
          message: userMessage.content,
          conversation_history: messages.slice(-10) // Last 10 messages for context
        }
      })

      if (error) throw error

      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        suggested_faq_articles: data.suggested_faqs || []
      }

      // Add assistant response to UI
      setMessages(prev => [...prev, assistantMessage])

      // Save assistant message to database
      await supabase
        .from('ai_messages')
        .insert([{
          conversation_id: conversationId,
          role: 'assistant',
          content: assistantMessage.content,
          tokens_used: data.tokens_used,
          model: data.model,
          suggested_faq_articles: assistantMessage.suggested_faq_articles
        }])

      // Update conversation title if this is the first user message
      if (messages.length <= 1) {
        await supabase
          .from('ai_conversations')
          .update({ title: userMessage.content.substring(0, 50) })
          .eq('id', conversationId)
      }

    } catch (err) {
      console.error('Error sending message:', err)
      setError('Failed to get a response. Please try again.')
      // Remove the user message if the request failed
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  const handleFeedback = async (messageIndex, feedback) => {
    try {
      const message = messages[messageIndex]
      
      // Update feedback in database
      await supabase
        .from('ai_messages')
        .update({ user_feedback: feedback })
        .eq('conversation_id', conversationId)
        .eq('content', message.content)
        .eq('role', 'assistant')

      // Update UI
      const updatedMessages = [...messages]
      updatedMessages[messageIndex].user_feedback = feedback
      setMessages(updatedMessages)
    } catch (err) {
      console.error('Error saving feedback:', err)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const startNewConversation = async () => {
    try {
      // Create a new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('ai_conversations')
        .insert([{
          user_id: userId,
          title: 'New Conversation',
          status: 'active'
        }])
        .select()
        .single()

      if (createError) throw createError

      // Clear messages and set new conversation ID
      setMessages([])
      setConversationId(newConversation.id)
      setError(null)
    } catch (err) {
      console.error('Error starting new conversation:', err)
      setError('Failed to start new conversation. Please try again.')
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI Coach
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Ask me anything about fitness, nutrition, or using YFIT
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={startNewConversation}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            New Conversation
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Feedback buttons for assistant messages */}
                  {message.role === 'assistant' && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-6 px-2 ${
                          message.user_feedback === 'thumbs_up' ? 'text-green-500' : ''
                        }`}
                        onClick={() => handleFeedback(index, 'thumbs_up')}
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-6 px-2 ${
                          message.user_feedback === 'thumbs_down' ? 'text-red-500' : ''
                        }`}
                        onClick={() => handleFeedback(index, 'thumbs_down')}
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t bg-white dark:bg-gray-900">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            The AI Coach provides general information and is not a substitute for professional medical advice.
          </p>
        </div>
      </div>
    </div>
  )
}

