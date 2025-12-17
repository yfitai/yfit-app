import { useState } from 'react'
import { FileText, Shield, Cookie, Heart } from 'lucide-react'

export default function Legal() {
  const [activeTab, setActiveTab] = useState('privacy')
   console.log('Current activeTab:', activeTab)


  const tabs = [
    { id: 'privacy', label: 'Privacy Policy', icon: Shield },
    { id: 'terms', label: 'Terms of Service', icon: FileText },
    { id: 'cookies', label: 'Cookie Policy', icon: Cookie },
    { id: 'hipaa', label: 'HIPAA Notice', icon: Heart },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Legal Information</h1>
          <p className="text-gray-600">Your privacy and security are our top priorities</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-8">
            {activeTab === 'privacy' && <PrivacyPolicy />}
            {activeTab === 'terms' && <TermsOfService />}
            {activeTab === 'cookies' && <CookiePolicy />}
            {activeTab === 'hipaa' && <HIPAANotice />}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p>Last updated: December 16, 2025</p>
          <p className="mt-2">
            Questions? Contact us at{' '}
            <a href="mailto:support@yfitai.com" className="text-blue-600 hover:underline">
              support@yfitai.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

function PrivacyPolicy() {
  return (
    <div className="prose max-w-none">
      <h2>Privacy Policy</h2>
      <p className="text-gray-600">Effective Date: December 16, 2025</p>

      <h3>1. Introduction</h3>
      <p>
        Welcome to YFIT AI ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our fitness and health tracking application.
      </p>

      <h3>2. Information We Collect</h3>
      <p>We collect the following types of information:</p>
      <ul>
        <li><strong>Personal Information:</strong> Name, email address, date of birth, gender</li>
        <li><strong>Health Data:</strong> Weight, height, fitness goals, workout logs, nutrition tracking, medication schedules</li>
        <li><strong>Usage Data:</strong> App interactions, features used, session duration</li>
        <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers</li>
        <li><strong>Wearable Data:</strong> Data from connected fitness devices (with your permission)</li>
      </ul>

      <h3>3. How We Use Your Information</h3>
      <p>We use your information to:</p>
      <ul>
        <li>Provide personalized fitness and nutrition recommendations</li>
        <li>Generate AI-powered predictions and insights</li>
        <li>Track your progress toward health and fitness goals</li>
        <li>Send you notifications and reminders</li>
        <li>Improve our services and develop new features</li>
        <li>Communicate with you about updates and support</li>
      </ul>

      <h3>4. Data Sharing and Disclosure</h3>
      <p>We do not sell your personal information. We may share your data with:</p>
      <ul>
        <li><strong>Service Providers:</strong> Third-party vendors who help us operate our app (e.g., cloud hosting, analytics)</li>
        <li><strong>AI Services:</strong> OpenAI for generating personalized insights (data is anonymized)</li>
        <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
      </ul>

      <h3>5. Data Security</h3>
      <p>
        We implement industry-standard security measures to protect your data, including encryption, secure servers, and access controls. However, no method of transmission over the internet is 100% secure.
      </p>

      <h3>6. Your Rights</h3>
      <p>You have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Correct inaccurate data</li>
        <li>Request deletion of your data</li>
        <li>Export your data</li>
        <li>Opt-out of marketing communications</li>
      </ul>

      <h3>7. Children's Privacy</h3>
      <p>
        Our app is not intended for children under 18. We do not knowingly collect data from children under 18.
      </p>

      <h3>8. Changes to This Policy</h3>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
      </p>

      <h3>9. Contact Us</h3>
      <p>
        If you have questions about this Privacy Policy, please contact us at{' '}
        <a href="mailto:support@yfitai.com">support@yfitai.com</a>
      </p>
    </div>
  )
}

function TermsOfService() {
  return (
    <div className="prose max-w-none">
      <h2>Terms of Service</h2>
      <p className="text-gray-600">Effective Date: December 16, 2025</p>

      <h3>1. Acceptance of Terms</h3>
      <p>
        By accessing or using YFIT AI, you agree to be bound by these Terms of Service. If you do not agree, please do not use our app.
      </p>

      <h3>2. Description of Service</h3>
      <p>
        YFIT AI is a fitness and health tracking application that provides personalized workout plans, nutrition tracking, medication reminders, and AI-powered insights.
      </p>

      <h3>3. User Accounts</h3>
      <p>
        You must create an account to use our app. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
      </p>

      <h3>4. Acceptable Use</h3>
      <p>You agree not to:</p>
      <ul>
        <li>Use the app for any illegal purpose</li>
        <li>Attempt to gain unauthorized access to our systems</li>
        <li>Interfere with the proper functioning of the app</li>
        <li>Share your account with others</li>
      </ul>

      <h3>5. Health Disclaimer</h3>
      <p>
        <strong>Important:</strong> YFIT AI is not a substitute for professional medical advice. Always consult with a qualified healthcare provider before starting any fitness or nutrition program.
      </p>

      <h3>6. Subscription and Payment</h3>
      <p>
        YFIT AI offers both free and paid subscription plans. Paid subscriptions are billed monthly or annually. You may cancel your subscription at any time.
      </p>

      <h3>7. Intellectual Property</h3>
      <p>
        All content, features, and functionality of YFIT AI are owned by us and are protected by copyright, trademark, and other intellectual property laws.
      </p>

      <h3>8. Limitation of Liability</h3>
      <p>
        To the fullest extent permitted by law, YFIT AI shall not be liable for any indirect, incidental, or consequential damages arising from your use of the app.
      </p>

      <h3>9. Termination</h3>
      <p>
        We reserve the right to terminate or suspend your account at any time for violation of these Terms.
      </p>

      <h3>10. Changes to Terms</h3>
      <p>
        We may modify these Terms at any time. Continued use of the app after changes constitutes acceptance of the new Terms.
      </p>

      <h3>11. Contact Us</h3>
      <p>
        For questions about these Terms, contact us at{' '}
        <a href="mailto:support@yfitai.com">support@yfitai.com</a>
      </p>
    </div>
  )
}

function CookiePolicy() {
  return (
    <div className="prose max-w-none">
      <h2>Cookie Policy</h2>
      <p className="text-gray-600">Effective Date: December 16, 2025</p>

      <h3>1. What Are Cookies?</h3>
      <p>
        Cookies are small text files stored on your device when you visit a website or use an app. They help us provide a better user experience.
      </p>

      <h3>2. Types of Cookies We Use</h3>
      <ul>
        <li>
          <strong>Essential Cookies:</strong> Required for the app to function (e.g., authentication, session management)
        </li>
        <li>
          <strong>Analytics Cookies:</strong> Help us understand how users interact with our app (e.g., Google Analytics)
        </li>
        <li>
          <strong>Preference Cookies:</strong> Remember your settings and preferences
        </li>
      </ul>

      <h3>3. Third-Party Cookies</h3>
      <p>We use the following third-party services that may set cookies:</p>
      <ul>
        <li><strong>Supabase:</strong> Database and authentication</li>
        <li><strong>Vercel:</strong> Hosting and analytics</li>
        <li><strong>OpenAI:</strong> AI-powered insights</li>
      </ul>

      <h3>4. Managing Cookies</h3>
      <p>
        You can control cookies through your browser settings. Note that disabling cookies may affect the functionality of our app.
      </p>

      <h3>5. Updates to This Policy</h3>
      <p>
        We may update this Cookie Policy from time to time. Please review it periodically.
      </p>

      <h3>6. Contact Us</h3>
      <p>
        Questions about our use of cookies? Contact us at{' '}
        <a href="mailto:support@yfitai.com">support@yfitai.com</a>
      </p>
    </div>
  )
}

function HIPAANotice() {
  return (
    <div className="prose max-w-none">
      <h2>HIPAA Compliance Notice</h2>
      <p className="text-gray-600">Effective Date: December 16, 2025</p>

      <h3>1. HIPAA Applicability</h3>
      <p>
        YFIT AI is a personal health and fitness tracking application. We are <strong>not</strong> a covered entity under HIPAA (Health Insurance Portability and Accountability Act) as we do not provide healthcare services, health insurance, or healthcare clearinghouse functions.
      </p>

      <h3>2. Protected Health Information (PHI)</h3>
      <p>
        While we collect health-related data (weight, fitness goals, medication schedules), this data is <strong>not</strong> considered PHI under HIPAA because:
      </p>
      <ul>
        <li>We are not a healthcare provider</li>
        <li>Data is collected directly from you, not from healthcare providers</li>
        <li>We do not transmit data to healthcare providers for treatment purposes</li>
      </ul>

      <h3>3. Data Protection Standards</h3>
      <p>
        Although we are not HIPAA-covered, we implement security measures comparable to HIPAA standards:
      </p>
      <ul>
        <li>Encryption of data in transit and at rest</li>
        <li>Access controls and authentication</li>
        <li>Regular security audits</li>
        <li>Secure data storage with Supabase</li>
      </ul>

      <h3>4. Healthcare Provider Integration</h3>
      <p>
        If you choose to share your YFIT AI data with your healthcare provider, you are responsible for ensuring compliance with any applicable regulations.
      </p>

      <h3>5. Your Rights</h3>
      <p>
        You have the right to access, correct, and delete your health data at any time through the app settings.
      </p>

      <h3>6. Data Breach Notification</h3>
      <p>
        In the event of a data breach, we will notify affected users within 72 hours and take immediate steps to secure the data.
      </p>

      <h3>7. Contact Us</h3>
      <p>
        For questions about data security and privacy, contact us at{' '}
        <a href="mailto:support@yfitai.com">support@yfitai.com</a>
      </p>
    </div>
  )
}
