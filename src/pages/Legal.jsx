import { useState } from 'react'
import { FileText, Shield, Cookie, Heart, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'

export default function Legal() {
  const [activeTab, setActiveTab] = useState('privacy')

  const tabs = [
    { id: 'faq', label: 'Help & FAQ', icon: HelpCircle },
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
            {activeTab === 'faq' && <FAQHelp />}
            {activeTab === 'privacy' && <PrivacyPolicy />}
            {activeTab === 'terms' && <TermsOfService />}
            {activeTab === 'cookies' && <CookiePolicy />}
            {activeTab === 'hipaa' && <HIPAANotice />}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p>Last updated: December 31, 2025</p>
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

function FAQHelp() {
  const [openItem, setOpenItem] = useState(null)

  const toggle = (id) => setOpenItem(openItem === id ? null : id)

  const sections = [
    {
      title: '🔑 Logging In & Creating an Account',
      items: [
        {
          id: 'how-to-login',
          q: 'How do I log in to YFIT AI?',
          a: 'YFIT AI is a web app — you log in directly from your browser. Open yfitai.com on your phone or computer and tap "Sign In" or "Get Started". You can sign up with your email address. No app store download is needed.'
        },
        {
          id: 'no-play-store',
          q: 'Is YFIT AI on the Google Play Store or Apple App Store?',
          a: 'YFIT AI is currently a Progressive Web App (PWA). This means you access it through your web browser at yfitai.com — not through the Play Store or App Store. The good news is you can still add it to your home screen so it looks and feels just like a regular app. See the "Add to Home Screen" section below for step-by-step instructions.'
        },
        {
          id: 'forgot-password',
          q: 'I forgot my password. How do I reset it?',
          a: 'On the login screen, tap "Forgot Password" and enter your email address. You will receive a password reset link within a few minutes. Check your spam folder if you do not see it. If you still have trouble, email us at support@yfitai.com.'
        },
        {
          id: 'account-email',
          q: 'What email should I use to sign up?',
          a: 'Use any email address you check regularly. Your login email is how we send you important updates, password resets, and your subscription receipts. You can update your email later in your account settings.'
        },
        {
          id: 'multiple-devices',
          q: 'Can I use YFIT AI on multiple devices?',
          a: 'Yes! Because YFIT AI is web-based, you can log in from any device — phone, tablet, or computer — using the same email and password. Your data syncs automatically across all devices.'
        },
        {
          id: 'stay-logged-in',
          q: 'Why does the app log me out?',
          a: 'For security, your session may expire after a period of inactivity. To stay logged in longer, make sure you are using the installed version on your home screen (see below). Clearing your browser cache or cookies will also log you out.'
        },
      ]
    },
    {
      title: '📱 Adding YFIT AI to Your Home Screen',
      items: [
        {
          id: 'why-add-home',
          q: 'Why should I add YFIT AI to my home screen?',
          a: 'Adding YFIT AI to your home screen gives you a full-screen app experience — no browser address bar, faster loading, and a tap-to-open icon just like any other app. It is the recommended way to use YFIT AI on your phone.'
        },
        {
          id: 'android-install',
          q: 'How do I add YFIT AI to my Android home screen?',
          a: (
            <ol className="list-decimal ml-5 space-y-1 text-gray-700">
              <li>Open <strong>Chrome</strong> on your Android phone.</li>
              <li>Go to <strong>yfitai.com</strong> and log in.</li>
              <li>Tap the <strong>three-dot menu</strong> (⋮) in the top-right corner.</li>
              <li>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.</li>
              <li>Tap <strong>"Add"</strong> to confirm.</li>
              <li>The YFIT AI icon will appear on your home screen — tap it to open the app anytime!</li>
            </ol>
          )
        },
        {
          id: 'iphone-install',
          q: 'How do I add YFIT AI to my iPhone home screen?',
          a: (
            <ol className="list-decimal ml-5 space-y-1 text-gray-700">
              <li>Open <strong>Safari</strong> on your iPhone (must be Safari, not Chrome).</li>
              <li>Go to <strong>yfitai.com</strong> and log in.</li>
              <li>Tap the <strong>Share button</strong> at the bottom of the screen (the box with an arrow pointing up).</li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
              <li>Tap <strong>"Add"</strong> in the top-right corner.</li>
              <li>The YFIT AI icon will appear on your home screen — tap it to open the app anytime!</li>
            </ol>
          )
        },
        {
          id: 'desktop-install',
          q: 'Can I install YFIT AI on my computer?',
          a: (
            <div className="text-gray-700">
              <p className="mb-2">Yes! On a desktop computer using Chrome or Edge:</p>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Go to <strong>yfitai.com</strong> in Chrome or Edge.</li>
                <li>Look for the <strong>install icon</strong> (a computer with a down arrow) in the address bar on the right side.</li>
                <li>Click it and select <strong>"Install"</strong>.</li>
                <li>YFIT AI will open in its own window and appear in your taskbar or apps list.</li>
              </ol>
            </div>
          )
        },
        {
          id: 'icon-not-showing',
          q: 'I added it to my home screen but the icon looks like a blank page. What do I do?',
          a: 'This can happen if the page was not fully loaded when you added it. Remove the icon from your home screen, then open yfitai.com again in your browser, wait for it to fully load, and follow the install steps again. Make sure you are using Safari on iPhone or Chrome on Android.'
        },
      ]
    },
    {
      title: '💳 Subscriptions & Billing',
      items: [
        {
          id: 'free-plan',
          q: 'Is there a free version of YFIT AI?',
          a: 'Yes! YFIT AI has a free Starter plan that includes basic workout tracking, manual meal logging, and 3 saved routines. You can upgrade to Pro at any time to unlock AI coaching, nutrition scanning, advanced analytics, and more.'
        },
        {
          id: 'cancel-sub',
          q: 'How do I cancel my subscription?',
          a: 'You can cancel your subscription at any time from your account settings inside the app. Go to Settings → Subscription → Cancel Plan. Your access will continue until the end of your current billing period.'
        },
        {
          id: 'refund',
          q: 'Can I get a refund?',
          a: 'If you are not satisfied, contact us at support@yfitai.com within 7 days of your purchase and we will review your request. We want you to be happy with YFIT AI.'
        },
      ]
    },
    {
      title: '🛠️ Technical Help',
      items: [
        {
          id: 'not-loading',
          q: 'The app is not loading or looks broken. What should I do?',
          a: 'Try these steps in order: (1) Pull down to refresh the page. (2) Close and reopen the app. (3) Clear your browser cache (Settings → Clear Browsing Data in Chrome). (4) Try opening yfitai.com in a different browser. If the problem continues, email us at support@yfitai.com with a description of what you see.'
        },
        {
          id: 'data-not-saving',
          q: 'My data is not saving. What is happening?',
          a: 'Make sure you have a working internet connection when logging meals or workouts. YFIT AI saves your data to the cloud in real time. If you are offline, some changes may not save until you reconnect. If data is consistently not saving, please contact support.'
        },
        {
          id: 'contact-support',
          q: 'How do I contact support?',
          a: (
            <p>Email us at <a href="mailto:support@yfitai.com" className="text-blue-600 underline">support@yfitai.com</a>. We typically respond within 24 hours. For faster help, describe your issue clearly and include what device and browser you are using.</p>
          )
        },
      ]
    },
  ]

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Help & Frequently Asked Questions</h2>
      <p className="text-gray-500 mb-8">Find quick answers to the most common questions about YFIT AI.</p>

      {sections.map((section) => (
        <div key={section.title} className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">{section.title}</h3>
          <div className="space-y-2">
            {section.items.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggle(item.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-800 pr-4">{item.q}</span>
                  {openItem === item.id
                    ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                </button>
                {openItem === item.id && (
                  <div className="px-5 pb-5 pt-1 bg-gray-50 text-gray-700 text-sm leading-relaxed">
                    {typeof item.a === 'string' ? <p>{item.a}</p> : item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-8 p-5 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-sm text-blue-800">
          <strong>Still need help?</strong> Email us at{' '}
          <a href="mailto:support@yfitai.com" className="underline font-medium">support@yfitai.com</a>
          {' '}and we will get back to you within 24 hours.
        </p>
      </div>
    </div>
  )
}

function PrivacyPolicy() {
  return (
    <div className="prose max-w-none">
      <h2>Privacy Policy</h2>
      <p className="text-gray-600">Last Updated: December 31, 2025</p>

      <h3>1. Introduction</h3>
      <p>
        YFIT AI ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (collectively, the "Service").
      </p>

      <h3>2. Information We Collect</h3>
      <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
      <ul>
        <li><strong>Personal Data:</strong> Name, email address, phone number, age, height, weight, gender, and fitness goals.</li>
        <li><strong>Health Data:</strong> Body measurements, workout history, nutrition logs, medication information, and progress photos.</li>
        <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers, and mobile network information.</li>
        <li><strong>Usage Data:</strong> Pages visited, time spent on pages, links clicked, and other interactions with our Service.</li>
      </ul>

      <h3>3. Age Restrictions</h3>
      <p>
        YFIT AI is not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that we have collected personal information from a child under 18, we will take steps to delete such information and terminate the child's account.
      </p>

      <h3>4. Use of Your Information</h3>
      <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
      <ul>
        <li>Provide, operate, and maintain our Service</li>
        <li>Improve, personalize, and expand our Service</li>
        <li>Understand and analyze how you use our Service</li>
        <li>Develop new products, services, features, and functionality</li>
        <li>Communicate with you, including for customer service and support</li>
        <li>Process your transactions and send related information</li>
        <li>Generate personalized fitness recommendations and AI coaching</li>
        <li>Create provider reports for your healthcare professionals</li>
      </ul>

      <h3>5. Disclosure of Your Information</h3>
      <p>We may share information we have collected about you in certain situations:</p>
      <ul>
        <li><strong>By Law or to Protect Rights:</strong> If required by law or if we believe in good faith that disclosure is necessary to protect your rights, our rights, or the rights of others.</li>
        <li><strong>Third-Party Service Providers:</strong> We may share your information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</li>
        <li><strong>Business Transfers:</strong> If YFIT AI is involved in a merger, acquisition, or asset sale, your information may be transferred as part of that transaction.</li>
      </ul>

      <h3>6. Security of Your Information</h3>
      <p>
        We use administrative, technical, and physical security measures to protect your personal information. However, no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
      </p>

      <h3>7. Data Retention</h3>
      <p>
        We will retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time.
      </p>

      <h3>8. Your Rights and Data Deletion</h3>
      <p>
        You have the right to request deletion of your account and all associated personal data. To request account and data deletion, please contact us. We will process your request within 30 days.
      </p>
      <p>Upon deletion, we will remove the following data:</p>
      <ul>
        <li>Personal identification information</li>
        <li>Health and fitness data</li>
        <li>Workout history and nutrition logs</li>
        <li>Progress photos and measurements</li>
        <li>Medication tracking information</li>
        <li>Account preferences and settings</li>
      </ul>

      <h3>9. Contact Us</h3>
      <p>
        If you have questions or comments about this Privacy Policy, please contact us at:{' '}
        <a href="mailto:support@yfitai.com">support@yfitai.com</a>
      </p>

      <h3>10. Changes to This Privacy Policy</h3>
      <p>
        We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date above.
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
