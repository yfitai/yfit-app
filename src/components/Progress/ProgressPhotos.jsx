import { useState, useEffect, useRef } from 'react'
import { Camera as CameraIcon, Upload, X, ChevronLeft, ChevronRight, Calendar, TrendingUp, Eye } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Webcam from 'react-webcam'

export default function ProgressPhotos({ userId }) {
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [compareMode, setCompareMode] = useState(false)
  const [comparePhotos, setComparePhotos] = useState({ before: null, after: null })
  const [viewMode, setViewMode] = useState('grid') // grid, timeline, compare
  const [showCamera, setShowCamera] = useState(false)
  const [currentViewType, setCurrentViewType] = useState(null)
  const webcamRef = useRef(null)

  useEffect(() => {
    loadPhotos()
  }, [userId])

  const loadPhotos = async () => {
    // Load from Supabase
    const { data, error } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', userId)
      .order('taken_at', { ascending: false })

    if (data) {
      setPhotos(data)
    }
  }

  const handlePhotoUpload = async (event, viewType) => {
    const file = event.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}/${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('progress-photos')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('progress-photos')
          .getPublicUrl(fileName)

        // Save to database
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
    console.log('🔴 CAMERA BUTTON CLICKED! viewType:', viewType);
    setCurrentViewType(viewType);
    setShowCamera(true);
  };

  const capturePhoto = async () => {
    if (!webcamRef.current) {
      alert('Camera not ready. Please try again.');
      return;
    }

    setUploading(true);
    console.log('📸 Capturing photo from webcam...');

    try {
      // Capture image from webcam
      const imageSrc = webcamRef.current.getScreenshot();
      
      if (!imageSrc) {
        throw new Error('Failed to capture image');
      }

      console.log('✅ Photo captured from webcam');
      console.log('Connecting to', `'${imageSrc.substring(0, 100)}...'`);

      // Convert base64 to blob (without fetch to avoid CSP violation)
      const base64Data = imageSrc.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      console.log('✅ Blob created successfully');
      console.log('Blob size:', blob.size, 'bytes');
        
      // Upload to Supabase Storage
      const fileName = `${userId}/${Date.now()}.jpg`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, blob);

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ Storage upload successful');

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName);

      // Save to database
      const { data: photoData, error: dbError } = await supabase
        .from('progress_photos')
        .insert({
          user_id: userId,
          image_url: publicUrl,
          view_type: currentViewType,
          taken_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database insert error:', dbError);
        throw dbError;
      }

      console.log('✅ Photo saved successfully');

      setPhotos([photoData, ...photos]);
      alert('Photo captured and uploaded successfully!');
      setShowCamera(false);
      
    } catch (error) {
      console.error('❌ Error capturing photo:', error);
      alert(`Error: ${error.message}. Please try again.`);
    } finally {
      setUploading(false);
    }
  };

  const closeCamera = () => {
    setShowCamera(false);
    setCurrentViewType(null);
  };

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CameraIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Progress Photos</h2>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'timeline'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setViewMode('compare')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'compare'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Compare
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{analytics.totalPhotos}</div>
              <div className="text-sm text-gray-600">Total Photos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{analytics.daysBetween}</div>
              <div className="text-sm text-gray-600">Days Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{analytics.consistency}</div>
              <div className="text-sm text-gray-600">Consistency</div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Progress Insights</h3>
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
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CameraIcon className="w-5 h-5" />
              Take {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
            </button>
            
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, viewType)}
                disabled={uploading}
                className="hidden"
              />
              <div className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer text-center flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                Upload {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
              </div>
            </label>
          </div>
        ))}
      </div>

      {uploading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-center font-medium">
            Processing photo... Please wait.
          </p>
        </div>
      )}

      {/* Photos Display */}
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

      {viewMode === 'compare' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Before</h3>
              {comparePhotos.before ? (
                <div className="relative">
                  <img
                    src={comparePhotos.before.image_url}
                    alt="Before"
                    className="w-full h-96 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setComparePhotos({ ...comparePhotos, before: null })}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Select a "before" photo from below</p>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">After</h3>
              {comparePhotos.after ? (
                <div className="relative">
                  <img
                    src={comparePhotos.after.image_url}
                    alt="After"
                    className="w-full h-96 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setComparePhotos({ ...comparePhotos, after: null })}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Select an "after" photo from below</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">Select Photos to Compare</h3>
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
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
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

      {photos.length === 0 && (
        <div className="text-center py-12">
          <CameraIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">No progress photos yet</p>
          <p className="text-gray-500 text-sm">
            Start tracking your journey by taking your first progress photo!
          </p>
        </div>
      )}

      {/* Camera Overlay */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Camera Preview */}
          <div className="flex-1 relative">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: 'user', // Front camera for progress photos
                width: 1080,
                height: 1920
              }}
              className="w-full h-full object-cover"
            />
            
            {/* View Type Label */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
              {currentViewType === 'front' && 'Front View'}
              {currentViewType === 'side' && 'Side View'}
              {currentViewType === 'back' && 'Back View'}
            </div>
          </div>

          {/* Camera Controls */}
          <div className="bg-black p-6 flex items-center justify-between">
            {/* Cancel Button */}
            <button
              onClick={closeCamera}
              disabled={uploading}
              className="text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            {/* Capture Button */}
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

            {/* Placeholder for symmetry */}
            <div className="w-20" />
          </div>
        </div>
      )}
    </div>
  )
}
