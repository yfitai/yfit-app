import { useLocation } from 'react-router-dom'
import CookieConsent from './CookieConsent'
import { publicPage } from '../lib/publicAnalytics'

/** Mounted only for a real public route, never an authenticated root redirect or guest shell. */
export default function PublicAnalyticsBoundary({ active }) {
  const location = useLocation()
  if (!active || !publicPage(window.location)) return null
  return <CookieConsent visitKey={`${location.key}:${location.pathname}:${location.search}`} />
}
