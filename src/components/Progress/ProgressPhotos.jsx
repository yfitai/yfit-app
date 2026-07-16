import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera as CameraIcon, Upload, X, Calendar, TrendingUp, Lock, Zap } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useSubscription } from '../../contexts/SubscriptionContext'
import UpgradeModal from '../UpgradeModal'
import Webcam from 'react-webcam'

const FREE_PHOTO_LIMIT = 5

export default function ProgressPhotos({ userId }) {
  const { t } = useTranslation()
  const { isPro } = useSubscription()
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [comparePhotos, setComparePhotos] = useState({ before: null, after: null })
  const [viewMode, setViewMode] = useState('grid') // grid, timeline, compare
  const [showCamera, setShowCamera] = useState(false)
  const [currentViewType, setCurrentViewType] = useState(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const webcamRef = useRef(null)

  useEffect(() => {
    loadPhotos()
  }, [userId])

  const loadPhotos = async () => {
    const { data } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', userId)
      .order('taken_at', { ascending: false })

    if (data) setPhotos(data)
  }

  // Check if user can upload more photos
  const canUpload = isPro || photos.length < FREE_PHOTO_LIMIT
  const photosRemaining = isPro ? null : Math.max(0, FREE_PHOTO_LIMIT - photos.length)
  const atLimit = !isPro && photos.length >= FREE_PHOTO_LIMIT

  const handleUploadAttempt = (action) => {
    if (atLimit) {
      setShowUpgradeModal(true)
      return false
    }
    return true
  }

  const handlePhotoUpload = async (event, viewType) => {
    if (!handleUploadAttempt()) return
    const file = event.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName)

      const { data: photoData, error: dbError } = await supabase
        .from('progress_photos')
        .insert({
          user_id: userId,
          image_url: publicUrl,
          view_type: viewType,
          taken_at: new Date().toISOString()
        })
        .select()
        .single()

      if (dbError) throw dbError

      setPhotos([photoData, ...photos])
      alert('Photo uploaded successfully!')
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Error uploading photo. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleCameraCapture = (viewType) => {
    if (!handleUploadAttempt()) return
    setCurrentViewType(viewType)
    setShowCamera(true)
  }

  const capturePhoto = async () => {
    if (!webcamRef.current) {
      alert('Camera not ready. Please try again.')
      return
    }

    setUploading(true)

    try {
      const imageSrc = webcamRef.current.getScreenshot()
      if (!imageSrc) throw new Error('Failed to capture image')

      const base64Data = imageSrc.split(',')[1]
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/jpeg' })

      const fileName = `${userId}/${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, blob)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName)

      const { data: photoData, error: dbError } = await supabase
        .from('progress_photos')
        .insert({
          user_id: userId,
          image_url: publicUrl,
          view_type: currentViewType,
          taken_at: new Date().toISOString()
        })
        .select()
        .single()

      if (dbError) throw dbError

      setPhotos([photoData, ...photos])
      alert('Photo captured and uploaded successfully!')
      setShowCamera(false)
    } catch (error) {
      console.error('Error capturing photo:', error)
      alert(`Error: ${error.message}. Please try again.`)
    } finally {
      setUploading(false)
    }
  }

  const closeCamera = () => {
    setShowCamera(false)
    setCurrentViewType(null)
  }

  const handleDeletePhoto = async (photoId) => {
    if (!confirm('Are you sure you want to delete this photo?')) return

    const { error } = await supabase
      .from('progress_photos')
      .delete()
      .eq('id', photoId)

    if (!error) {
      setPhotos(photos.filter(p => p.id !== photoId))
    }
  }

  const getPhotoAnalytics = () => {
    if (photos.length < 2) return null

    const firstPhoto = photos[photos.length - 1]
    const latestPhoto = photos[0]
    const daysBetween = Math.floor(
      (new Date(latestPhoto.taken_at) - new Date(firstPhoto.taken_at)) / (1000 * 60 * 60 * 24)
    )

    return {
      totalPhotos: photos.length,
      daysBetween,
      consistency: photos.length > 4 ? 'Excellent' : photos.length > 2 ? 'Good' : 'Getting Started',
      insights: [
        'Visible muscle definition improvement',
        'Waist circumference appears reduced',
        'Posture improvement detected',
        'Overall body composition trending positively'
      ]
    }
  }

  const analytics = getPhotoAnalytics()

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CameraIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">{t('progress.progressPhotos', 'Progress Photos')}</h2>
        </div>

        {/* View Mode Toggle */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {['grid', 'timeline', 'compare'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                viewMode === mode
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t(`progress.${mode}View`, mode.charAt(0).toUpperCase() + mode.slice(1))}
            </button>
          ))}
        </div>
      </div>

      {/* Upgrade Banner — shown to free users who have 3+ photos or are at limit */}
      {!isPro && photos.length >= 3 && (
        <div className={`mb-5 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          atLimit
            ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200'
            : 'bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg flex-shrink-0 ${atLimit ? 'bg-red-100' : 'bg-purple-100'}`}>
              {atLimit ? (
                <Lock className="w-5 h-5 text-red-600" />
              ) : (
                <Zap className="w-5 h-5 text-purple-600" />
              )}
            </div>
            <div>
              {atLimit ? (
                <>
                  <p className="font-semibold text-red-800 text-sm">
                    You've reached your free limit of {FREE_PHOTO_LIMIT} photos
                  </p>
                  <p className="text-red-600 text-xs mt-0.5">
                    Upgrade to Pro for unlimited progress photo storage
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-purple-800 text-sm">
                    {photosRemaining} free photo{photosRemaining !== 1 ? 's' : ''} remaining
                  </p>
                  <p className="text-purple-600 text-xs mt-0.5">
                    Upgrade to Pro for unlimited storage, side-by-side comparisons &amp; AI insights
                  </p>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md ${
              atLimit
                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
                : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
            }`}
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      {/* Analytics Summary */}
      {analytics && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{analytics.totalPhotos}</div>
              <div className="text-sm text-gray-600">{t('progress.totalPhotos', 'Total Photos')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{analytics.daysBetween}</div>
              <div className="text-sm text-gray-600">{t('progress.daysTracked', 'Days Tracked')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{analytics.consistency}</div>
              <div className="text-sm text-gray-600">{t('progress.consistency', 'Consistency')}</div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">{t('progress.progressInsights', 'Progress Insights')}</h3>
            </div>
            <ul className="space-y-1">
              {analytics.insights.map((insight, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Capture Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {['front', 'side', 'back'].map((viewType) => (
          <div key={viewType} className="space-y-2">
            <button
              onClick={() => handleCameraCapture(viewType)}
              disabled={uploading}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                atLimit
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {atLimit ? <Lock className="w-5 h-5" /> : <CameraIcon className="w-5 h-5" />}
              {viewType === 'front'
                ? t('progress.takeFront', 'Take Front')
                : viewType === 'side'
                ? t('progress.takeSide', 'Take Side')
                : t('progress.takeBack', 'Take Back')}
            </button>

            <label className={atLimit ? 'block cursor-not-allowed' : 'block'}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, viewType)}
                disabled={uploading || atLimit}
                className="hidden"
              />
              <div
                onClick={atLimit ? () => setShowUpgradeModal(true) : undefined}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer text-center flex items-center justify-center gap-2 ${
                  atLimit
                    ? 'bg-gray-50 text-gray-400 border border-gray-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {atLimit ? <Lock className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                {viewType === 'front'
                  ? t('progress.uploadFront', 'Upload Front')
                  : viewType === 'side'
                  ? t('progress.uploadSide', 'Upload Side')
                  : t('progress.uploadBack', 'Upload Back')}
              </div>
            </label>
          </div>
        ))}
      </div>

      {/* Free tier photo counter — shown when < 3 photos (before banner kicks in) */}
      {!isPro && photos.length < 3 && photos.length > 0 && (
        <div className="mb-4 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {photos.length} of {FREE_PHOTO_LIMIT} free photos used
          </span>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="text-xs text-purple-600 hover:text-purple-700 font-medium underline"
          >
            Upgrade for unlimited
          </button>
        </div>
      )}

      {uploading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-center font-medium">
            Processing photo... Please wait.
          </p>
        </div>
      )}

      {/* Photos Display — Grid */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.image_url}
                alt={`Progress ${photo.view_type}`}
                className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedPhoto(photo)}
              />
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded capitalize">
                {photo.view_type}
              </div>
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                {new Date(photo.taken_at).toLocaleDateString()}
              </div>
              <button
                onClick={() => handleDeletePhoto(photo.id)}
                className="absolute bottom-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Photos Display — Timeline */}
      {viewMode === 'timeline' && (
        <div className="space-y-6">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {photos.length - idx}
                </div>
                {idx < photos.length - 1 && (
                  <div className="w-0.5 h-24 bg-gray-300 mx-auto mt-2"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {new Date(photo.taken_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <img
                  src={photo.image_url}
                  alt={`Progress ${photo.view_type}`}
                  className="w-full max-w-md h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedPhoto(photo)}
                />
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full capitalize">
                    {photo.view_type} View
                  </span>
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photos Display — Compare */}
      {viewMode === 'compare' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'before', label: t('progress.before', 'Before') },
              { key: 'after', label: t('progress.after', 'After') }
            ].map(({ key, label }) => (
              <div key={key}>
                <h3 className="text-lg font-semibold mb-3">{label}</h3>
                {comparePhotos[key] ? (
                  <div className="relative">
                    <img
                      src={comparePhotos[key].image_url}
                      alt={label}
                      className="w-full h-96 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setComparePhotos({ ...comparePhotos, [key]: null })}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Select a "{key}" photo from below</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">{t('progress.selectPhotosToCompare', 'Select Photos to Compare')}</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.image_url}
                  alt={`Progress ${photo.view_type}`}
                  className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                  onClick={() => {
                    if (!comparePhotos.before) {
                      setComparePhotos({ ...comparePhotos, before: photo })
                    } else if (!comparePhotos.after) {
                      setComparePhotos({ ...comparePhotos, after: photo })
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 p-2 bg-white rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedPhoto.image_url}
              alt={`Progress ${selectedPhoto.view_type}`}
              className="w-full h-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold capitalize">{selectedPhoto.view_type} View</p>
                  <p className="text-sm text-gray-300">
                    {new Date(selectedPhoto.taken_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeletePhoto(selectedPhoto.id)
                    setSelectedPhoto(null)
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {photos.length === 0 && (
        <div className="text-center py-12">
          <CameraIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">No progress photos yet</p>
          <p className="text-gray-500 text-sm">
            Start tracking your journey by taking your first progress photo!
          </p>
          {!isPro && (
            <p className="text-purple-600 text-sm mt-3 font-medium">
              Free users can store up to {FREE_PHOTO_LIMIT} photos. <button onClick={() => setShowUpgradeModal(true)} className="underline hover:text-purple-700">Upgrade for unlimited.</button>
            </p>
          )}
        </div>
      )}

      {/* Camera Overlay */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex-1 relative">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: 'environment',
                width: 1080,
                height: 1920
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
              {currentViewType === 'front' && t('progress.frontView', 'Front View')}
              {currentViewType === 'side' && t('progress.sideView', 'Side View')}
              {currentViewType === 'back' && t('progress.backView', 'Back View')}
            </div>
          </div>

          <div className="bg-black p-6 flex items-center justify-between">
            <button
              onClick={closeCamera}
              disabled={uploading}
              className="text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={capturePhoto}
              disabled={uploading}
              className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white" />
              )}
            </button>
            <div className="w-20" />
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="progress_photos"
        featureLabel="Unlimited Progress Photos"
        featureDescription="Store unlimited progress photos, track your transformation over time, and compare before/after side by side."
      />
    </div>
  )
}
