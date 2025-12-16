import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.jsx'
import { signIn, signUp, resendConfirmationEmail } from '../lib/supabase'
import { Mail, CheckCircle } from 'lucide-react'
import logo from '../assets/logo.png'

export default function Auth({ onAuthSuccess, onDemoMode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  
  // Signup state
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)
    
    const { data, error } = await signIn(loginEmail, loginPassword)
    
    if (error) {
      if (error.message?.includes('Email not confirmed')) {
        setError('Please confirm your email address before signing in. Check your inbox for the confirmation link.')
        setPendingEmail(loginEmail)
        setShowEmailConfirmation(true)
      } else {
        setError(error.message || 'Failed to sign in. Please check your credentials.')
      }
      setIsLoading(false)
      return
    }
    
    if (data.user) {
      onAuthSuccess(data.user)
    }
    
    setIsLoading(false)
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name')
      return
    }
    
    if (!signupEmail.trim() || !signupPassword.trim()) {
      setError('Please enter your email and password')
      return
    }
    
    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    setIsLoading(true)
    
    const { data, error, needsEmailConfirmation } = await signUp(signupEmail, signupPassword, firstName, lastName)
    
    if (error) {
      setError(error.message || 'Failed to create account. Please try again.')
      setIsLoading(false)
      return
    }
    
    // If email confirmation is required
    if (needsEmailConfirmation) {
      setPendingEmail(signupEmail)
      setShowEmailConfirmation(true)
      setSuccess('Account created! Please check your email to confirm your address.')
      setIsLoading(false)
      return
    }
    
    // If no confirmation needed, log them in directly
    if (data.user && data.session) {
      onAuthSuccess(data.user)
    }
    
    setIsLoading(false)
  }

  const handleResendConfirmation = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    const { error } = await resendConfirmationEmail(pendingEmail)
    
    if (error) {
      setError('Failed to resend confirmation email. Please try again.')
    } else {
      setSuccess('Confirmation email sent! Please check your inbox.')
    }
    
    setIsLoading(false)
  }

  // If showing email confirmation message
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logo} alt="YFIT AI" className="h-24 mx-auto mb-4" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              YFIT AI
            </h1>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-blue-100 p-3">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-center">Check Your Email</CardTitle>
              <CardDescription className="text-center">
                We've sent a confirmation link to
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center font-medium text-gray-900">{pendingEmail}</p>
              
              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Success</AlertTitle>
                  <AlertDescription className="text-green-700">
                    {success}
                  </AlertDescription>
                </Alert>
              )}
              
              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertTitle className="text-red-800">Error</AlertTitle>
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Next steps:</strong>
                </p>
                <ol className="text-sm text-gray-600 mt-2 space-y-1 list-decimal list-inside">
                  <li>Check your email inbox</li>
                  <li>Click the confirmation link</li>
                  <li>Return here to sign in</li>
                </ol>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleResendConfirmation}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Resend Confirmation Email'}
              </Button>
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => {
                  setShowEmailConfirmation(false)
                  setError('')
                  setSuccess('')
                }}
              >
                Back to Sign In
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
           <div className="text-center mb-8 animate-fade-in">
          <img src="/assets/yfit-logo.png" alt="YFIT AI" className="h-24 mx-auto mb-4" />
          <p className="text-gray-600 mt-2">Your Intelligent Health Companion</p>
        </div>


        {/* Auth Tabs */}
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back!</CardTitle>
                <CardDescription>
                  Sign in to continue your health journey
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertDescription className="text-red-700 text-sm">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert className="bg-green-50 border-green-200">
                      <AlertDescription className="text-green-700 text-sm">
                        {success}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value)
                        setError('')
                      }}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value)
                        setError('')
                      }}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>
                  Start your personalized health journey today
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertDescription className="text-red-700 text-sm">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert className="bg-green-50 border-green-200">
                      <AlertDescription className="text-green-700 text-sm">
                        {success}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name *</Label>
                      <Input
                        id="first-name"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => {
                        setFirstName(e.target.value)
                        setError('')
                      }}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name *</Label>
                      <Input
                        id="last-name"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => {
                        setLastName(e.target.value)
                        setError('')
                      }}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email *</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signupEmail}
                      onChange={(e) => {
                        setSignupEmail(e.target.value)
                        setError('')
                      }}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password *</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => {
                        setSignupPassword(e.target.value)
                        setError('')
                      }}
                      required
                      disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500">Minimum 6 characters</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
