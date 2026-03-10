import { Component } from 'react'
import { supabase } from '../lib/supabase'

// Log errors to Supabase error_logs table
async function logErrorToSupabase(error, componentStack, userId = null) {
  try {
    await supabase.from('error_logs').insert({
      user_id: userId,
      error_message: error?.message || String(error),
      error_stack: error?.stack || null,
      component_stack: componentStack || null,
      page_url: window.location.href,
      user_agent: navigator.userAgent,
      app_version: import.meta.env.VITE_APP_VERSION || '1.0.0-beta',
      severity: 'critical',
    })
  } catch (logErr) {
    // Silently fail - don't throw from error boundary
    console.warn('Failed to log error to Supabase:', logErr)
  }
}

// Global unhandled error catcher (non-React errors)
export function setupGlobalErrorHandlers(userId = null) {
  window.onerror = (message, source, lineno, colno, error) => {
    logErrorToSupabase(
      error || { message: `${message} at ${source}:${lineno}:${colno}` },
      null,
      userId
    )
  }

  window.onunhandledrejection = (event) => {
    logErrorToSupabase(
      { message: `Unhandled Promise Rejection: ${event.reason}`, stack: event.reason?.stack },
      null,
      userId
    )
  }
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    logErrorToSupabase(error, errorInfo?.componentStack, this.props.userId)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    // Navigate to home
    window.location.href = '/'
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-500 text-sm mb-6">
              An unexpected error occurred. This has been automatically reported to our team. 
              We apologize for the inconvenience.
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left mb-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 overflow-auto max-h-32">
                <summary className="cursor-pointer font-medium mb-1">Error details (dev only)</summary>
                <pre className="whitespace-pre-wrap">{this.state.error.message}</pre>
                {this.state.errorInfo && (
                  <pre className="whitespace-pre-wrap mt-2 text-gray-400">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Go to Home
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 py-2 px-4 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
