import { useState } from 'react'
import { Camera, CameraResultType } from '@capacitor/camera'
import { getFoodByBarcode } from '../lib/foodDatabase'
import { Capacitor } from '@capacitor/core'
import { Html5Qrcode } from 'html5-qrcode'

export default function BarcodeScanner({ onScanSuccess, onClose }) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [lookingUp, setLookingUp] = useState(false)
  const [isNative, setIsNative] = useState(Capacitor.isNativePlatform())

  const takePicture = async () => {
    try {
      setError(null)
      setScanning(true)

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        promptLabelHeader: 'Scan Barcode',
        promptLabelPhoto: 'Take Photo',
        promptLabelPicture: 'From Gallery'
      })

      // Decode barcode from image
      await decodeBarcode(image.dataUrl)
      
    } catch (err) {
      console.error('Error taking picture:', err)
      if (err.message !== 'User cancelled photos app') {
        setError('Unable to access camera. Please check permissions.')
      }
      setScanning(false)
    }
  }

  const decodeBarcode = async (imageDataUrl) => {
    try {
      setLookingUp(true)
      
      // Create temporary image element
      const img = document.createElement('img')
      img.src = imageDataUrl
      
      // Wait for image to load
      await new Promise((resolve) => {
        img.onload = resolve
      })

      // Use html5-qrcode to decode
      const html5QrCode = new Html5Qrcode('temp-scanner')
      const result = await html5QrCode.scanFile(img, false)
      
      if (result) {
        handleScanSuccess(result)
      } else {
        setError('No barcode found in image. Please try again.')
        setScanning(false)
        setLookingUp(false)
      }
    } catch (err) {
      console.error('Error decoding barcode:', err)
      setError('Could not read barcode. Please try again with better lighting.')
      setScanning(false)
      setLookingUp(false)
    }
  }

  const handleScanSuccess = async (barcode) => {
    console.log('Barcode detected:', barcode)

    try {
      // Lookup food by barcode
      const food = await getFoodByBarcode(barcode)

      if (food) {
        // Food found!
        onScanSuccess(food)
      } else {
        // Food not found
        setError(`Product not found for barcode: ${barcode}`)
        setLookingUp(false)
        setScanning(false)
      }
    } catch (err) {
      console.error('Error looking up barcode:', err)
      setError('Error looking up product. Please try again.')
      setLookingUp(false)
      setScanning(false)
    }
  }

  const handleClose = () => {
    onClose()
  }

  const handleTryAgain = () => {
    setError(null)
    setLookingUp(false)
    setScanning(false)
    takePicture()
  }

  // Auto-start when component mounts
  useState(() => {
    takePicture()
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      {/* Hidden element for barcode decoding */}
      <div id="temp-scanner" style={{ display: 'none' }}></div>
      
      <div className="w-full max-w-md mx-4">
        {/* Header */}
        <div className="bg-white rounded-t-lg p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              Scan Barcode
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Take a photo of the product barcode
          </p>
        </div>

        {/* Scanner Status */}
        <div className="bg-black p-8" style={{ minHeight: '300px' }}>
          {/* Scanning State */}
          {scanning && !lookingUp && !error && (
            <div className="text-center text-white">
              <div className="text-6xl mb-4">📸</div>
              <p className="text-lg font-medium">
                Taking photo...
              </p>
            </div>
          )}

          {/* Looking Up State */}
          {lookingUp && (
            <div className="text-center text-white">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-white mb-6"></div>
              <p className="text-lg font-medium">Decoding barcode...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center text-white">
              <div className="text-6xl mb-4">⚠️</div>
              <p className="text-lg font-medium mb-2">{error}</p>
            </div>
          )}

          {/* Initial State */}
          {!scanning && !lookingUp && !error && (
            <div className="text-center text-white">
              <div className="text-6xl mb-4">📷</div>
              <p className="text-lg font-medium mb-2">
                Ready to scan
              </p>
              <p className="text-sm text-gray-300">
                Click "Take Photo" to scan a barcode
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white rounded-b-lg p-4">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            {!scanning && !lookingUp && (
              <button
                onClick={takePicture}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                📸 Take Photo
              </button>
            )}
            {error && (
              <button
                onClick={handleTryAgain}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Try Again
              </button>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-4 text-sm text-gray-600">
            <p className="font-medium mb-2">Tips for best results:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Center the barcode in the photo</li>
              <li>Ensure good lighting</li>
              <li>Hold phone steady and keep barcode in focus</li>
              <li>Works with UPC, EAN, and other standard barcodes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
