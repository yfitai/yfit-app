import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { FileText, Mail } from 'lucide-react'
import ContactSupportModal from './ContactSupportModal'

export default function Footer() {
  const { t } = useTranslation()
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  return (
    <>
      <footer className="bg-gray-900 text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <div className="mb-4">
                <img src="/assets/yfit-logo.png" alt="YFIT Logo" className="h-10" />
              </div>
              <p className="text-gray-400">
                {t('footer.tagline', 'Your personal AI-powered fitness companion. Track workouts, nutrition, and health goals with intelligent insights.')}
              </p>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('footer.legal', 'Legal')}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/legal" className="text-gray-400 hover:text-white transition-colors">
                    {t('footer.privacyPolicy', 'Privacy Policy')}
                  </Link>
                </li>
                <li>
                  <Link to="/legal" className="text-gray-400 hover:text-white transition-colors">
                    {t('footer.termsOfService', 'Terms of Service')}
                  </Link>
                </li>
                <li>
                  <Link to="/legal" className="text-gray-400 hover:text-white transition-colors">
                    {t('footer.cookiePolicy', 'Cookie Policy')}
                  </Link>
                </li>
                <li>
                  <Link to="/legal" className="text-gray-400 hover:text-white transition-colors">
                    {t('footer.hipaaNotice', 'HIPAA Notice')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                {t('footer.contact', 'Contact')}
              </h3>
              <p className="text-gray-400 mb-4">
                {t('footer.contactQuestion', 'Have questions or need support?')}
              </p>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Mail className="w-5 h-5" />
                {t('footer.contactSupport', 'Contact Support')}
              </button>
              <p className="text-sm text-gray-500 mt-3">
                {t('footer.aiResponse', 'Get AI-powered responses in minutes')}
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} YFIT AI. {t('footer.allRightsReserved', 'All rights reserved.')}</p>
          </div>
        </div>
      </footer>

      {/* Contact Support Modal */}
      <ContactSupportModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
    </>
  )
}
