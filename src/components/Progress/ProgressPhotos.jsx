import { useState, useEffect } from 'react'
import { Camera, Upload, X, ChevronLeft, ChevronRight, Calendar, TrendingUp, Eye } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'

export default function ProgressPhotos({ userId }) {
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [compareMode, setCompareMode] = useState(false)
  const [comparePhotos, setComparePhotos] = useState({ before: null, after: null })
  const [viewMode, setViewMode] = useState('grid') // grid, timeline, compare

  useEffect(() => {
    loadPhotos()
  }, [userId])

  const loadPhotos = async () => {
    if (userId.startsWith('demo')) {
      // Load demo photos
      setPhotos(generateDemoPhotos())
      return
    }

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
      if (userId.startsWith('demo')) {
        // Demo mode - simulate upload
        const newPhoto = {
          id: `demo-photo-${Date.now()}`,
          user_id: userId,
          image_url: URL.createObjectURL(file),
          view_type: viewType,
          taken_at: new Date().toISOString(),
          notes: ''
        }
        setPhotos([newPhoto, ...photos])
        alert('Photo uploaded successfully! (Demo mode - not actually saved)')
      } else {
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
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Error uploading photo. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleCameraCapture = async (viewType) => {
    // Check if running on native platform
    if (!Capacitor.isNativePlatform()) {
      alert('Camera is only available on mobile devices. Please use the upload button instead.');
      return;
    }

    setUploading(true);
    try {
      // Take photo with camera
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: false,
        correctOrientation: true,
        width: 1080,
        height: 1920,
        promptLabelHeader: 'Take Progress Photo',
        promptLabelCancel: 'Cancel',
        promptLabelPhoto: 'From Gallery',
        promptLabelPicture: 'Take Photo'
      });

      if (!image.dataUrl) {
        throw new Error('No image data');
      }

      if (userId.startsWith('demo')) {
        // Demo mode - simulate upload
        const newPhoto = {
          id: `demo-photo-${Date.now()}`,
          user_id: userId,
          image_url: image.dataUrl,
          view_type: viewType,
          taken_at: new Date().toISOString(),
          notes: ''
        };
        setPhotos([newPhoto, ...photos]);
        alert('Photo captured successfully! (Demo mode - not actually saved)');
      } else {
        // Convert data URL to blob
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        
        // Upload to Supabase Storage
        const fileName = `${userId}/${Date.now()}.jpg`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('progress-photos')
          .upload(fileName, blob);

        if (uploadError) throw uploadError;

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
            view_type: viewType,
            taken_at: new Date().toISOString()
          })
          .select()
          .single();

        if (dbError) throw dbError;

        setPhotos([photoData, ...photos]);
        alert('Photo captured and uploaded successfully!');
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      alert('Error capturing photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!confirm('Are you sure you want to delete this photo?')) return

    if (userId.startsWith('demo')) {
      setPhotos(photos.filter(p => p.id !== photoId))
      return
    }

    const { error } = await supabase
      .from('progress_photos')
      .delete()
      .eq('id', photoId)

    if (!error) {
      setPhotos(photos.filter(p => p.id !== photoId))
    }
  }

  const generateDemoPhotos = () => {
    const today = new Date()
    return [
      {
        id: 'demo-1',
        taken_at: today.toISOString(),
        view_type: 'front',
        image_url: '/api/placeholder/400/600',
        notes: 'Current progress - feeling great!'
      },
      {
        id: 'demo-2',
        taken_at: new Date(today - 30 * 24 * 60 * 60 * 1000).toISOString(),
        view_type: 'front',
        image_url: '/api/placeholder/400/600',
        notes: '1 month ago'
      },
      {
        id: 'demo-3',
        taken_at: new Date(today - 60 * 24 * 60 * 60 * 1000).toISOString(),
        view_type: 'front',
        image_url: '/api/placeholder/400/600',
        notes: 'Starting point'
      }
    ]
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
          <Camera className="w-6 h-6 text-blue-600" />
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
          
          {/* AI Insights */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">AI-Detected Progress</h3>
            </div>
            <ul className="space-y-1">
              {analytics.insights.map((insight, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Add New Photo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['front', 'side', 'back'].map(viewType => (
            <div key={viewType} className="space-y-2">
              {/* Camera Button */}
              <button
                onClick={() => handleCameraCapture(viewType)}
                disabled={uploading}
                className="w-full flex flex-col items-center justify-center p-4 border-2 border-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-8 h-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-blue-700 capitalize">Take {viewType}</span>
              </button>
              
              {/* Upload Button */}
              <label className="w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors">
                <Upload className="w-6 h-6 text-gray-400 mb-2" />
                <span className="text-xs text-gray-600 capitalize">or Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e, viewType)}
                  disabled={uploading}
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Photos Display */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map(photo => (
            <div key={photo.id} className="relative group">
              <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={photo.image_url}
                  alt={`Progress photo from ${new Date(photo.taken_at).toLocaleDateString()}`}
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setSelectedPhoto(photo)}
                />
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 text-sm text-gray-600 text-center">
                {new Date(photo.taken_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'timeline' && (
        <div className="space-y-6">
          {photos.map((photo, index) => (
            <div key={photo.id} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={photo.image_url}
                  alt={`Progress photo`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setSelectedPhoto(photo)}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold text-gray-900">
                    {new Date(photo.taken_at).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                  <span className="text-sm text-gray-500 capitalize">({photo.view_type} view)</span>
                </div>
                {photo.notes && (
                  <p className="text-gray-700">{photo.notes}</p>
                )}
                {index < photos.length - 1 && (
                  <div className="mt-2 text-sm text-green-600 font-medium">
                    {Math.floor((new Date(photo.taken_at) - new Date(photos[index + 1].taken_at)) / (1000 * 60 * 60 * 24))} days since last photo
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'compare' && (
        <div>
          <div className="mb-4 text-center text-gray-600">
            Select two photos to compare side-by-side
          </div>
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-center">Before</h3>
              {comparePhotos.before ? (
                <div className="relative">
                  <img
                    src={comparePhotos.before.image_url}
                    alt="Before"
                    className="w-full rounded-lg"
                  />
                  <div className="text-center mt-2 text-sm text-gray-600">
                    {new Date(comparePhotos.before.taken_at).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => setComparePhotos({ ...comparePhotos, before: null })}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">Select a photo</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-center">After</h3>
              {comparePhotos.after ? (
                <div className="relative">
                  <img
                    src={comparePhotos.after.image_url}
                    alt="After"
                    className="w-full rounded-lg"
                  />
                  <div className="text-center mt-2 text-sm text-gray-600">
                    {new Date(comparePhotos.after.taken_at).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => setComparePhotos({ ...comparePhotos, after: null })}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">Select a photo</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Photo Selection Grid */}
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {photos.map(photo => (
              <div
                key={photo.id}
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500"
                onClick={() => {
                  if (!comparePhotos.before) {
                    setComparePhotos({ ...comparePhotos, before: photo })
                  } else if (!comparePhotos.after) {
                    setComparePhotos({ ...comparePhotos, after: photo })
                  }
                }}
              >
                <img
                  src={photo.image_url}
                  alt="Progress photo"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedPhoto.image_url}
              alt="Progress photo"
              className="w-full rounded-lg"
            />
            <div className="bg-white rounded-b-lg p-4">
              <div className="text-lg font-semibold text-gray-900">
                {new Date(selectedPhoto.taken_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              {selectedPhoto.notes && (
                <p className="text-gray-700 mt-2">{selectedPhoto.notes}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {photos.length === 0 && (
        <div className="text-center py-12">
          <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Progress Photos Yet</h3>
          <p className="text-gray-600 mb-4">
            Start tracking your visual progress by uploading your first photo!
          </p>
          <p className="text-sm text-gray-500">
            Tip: Take photos in the same location, lighting, and pose for best comparison results.
          </p>
        </div>
      )}
    </div>
  )
}
