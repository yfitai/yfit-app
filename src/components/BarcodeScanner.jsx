import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { getFoodByBarcode } from '../lib/foodDatabase'

export default function BarcodeScanner({ onScanSuccess, onClose }) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [lookingUp, setLookingUp] = useState(false)
  const scannerRef = useRef(null)
  const html5QrcodeRef = useRef(null)

  useEffect(() => {
    startScanner()

    return () => {
      stopScanner()
    }
  }, [])

  const startScanner = async () => {
    try {
      setError(null)
      setScanning(true)

      // Initialize scanner
      html5QrcodeRef.current = new Html5Qrcode('barcode-scanner')

      // Start scanning
      await html5QrcodeRef.current.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10, // Frames per second
          qrbox: { width: 250, height: 250 }, // Scanning box size
          aspectRatio: 1.0,
          supportedScanTypes: [
            Html5Qrcode.SCAN_TYPE_CAMERA // Only camera, not file
          ]
        },
        handleScanSuccess,
        onScanFailure
      )
    } catch (err) {
      console.error('Error starting scanner:', err)
      setError('Unable to access camera. Please check permissions.')
      setScanning(false)
    }
  }

  const stopScanner = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop()
        await html5QrcodeRef.current.clear()
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
  }

  const handleScanSuccess = async (decodedText, decodedResult) => {
    console.log('Barcode detected:', decodedText)

    // Stop scanning immediately
    await stopScanner()
    setScanning(false)
    setLookingUp(true)

    try {
      // Lookup food by barcode
      const food = await getFoodByBarcode(decodedText)

      if (food) {
        // Food found!
        onScanSuccess(food)
      } else {
        // Food not found
        setError(`Product not found for barcode: ${decodedText}`)
        setLookingUp(false)
        
        // Restart scanning after 2 seconds
        setTimeout(() => {
          setError(null)
          startScanner()
        }, 2000)
      }
    } catch (err) {
      console.error('Error looking up barcode:', err)
      setError('Error looking up product. Please try again.')
      setLookingUp(false)
      
      // Restart scanning after 2 seconds
      setTimeout(() => {
        setError(null)
        startScanner()
      }, 2000)
    }
  }

  const onScanFailure = (error) => {
    // This is called frequently when no barcode is detected
    // We don't need to do anything here
  }

  const handleClose = async () => {
    await stopScanner()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
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
            Point your camera at a product barcode
          </p>
        </div>

        {/* Scanner */}
        <div className="bg-black relative">
          <div
            id="barcode-scanner"
            ref={scannerRef}
            className="w-full"
            style={{ minHeight: '300px' }}
          />

          {/* Scanning Overlay */}
          {scanning && !lookingUp && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="inline-block p-4 bg-black bg-opacity-50 rounded-lg">
                  <div className="w-64 h-64 border-4 border-green-500 rounded-lg relative">
                    {/* Scanning animation corners */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400"></div>
                    
                    {/* Scanning line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-green-400 animate-pulse"></div>
                  </div>
                  <p className="text-white mt-4 font-medium">
                    Align barcode within frame
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Looking Up Overlay */}
          {lookingUp && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                <p className="text-white font-medium">Looking up product...</p>
              </div>
            </div>
          )}

          {/* Error Overlay */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
              <div className="text-center px-4">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <p className="text-white font-medium">{error}</p>
              </div>
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
            {error && (
              <button
                onClick={() => {
                  setError(null)
                  startScanner()
                }}
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
              <li>Hold phone steady and keep barcode in focus</li>
              <li>Ensure good lighting</li>
              <li>Try different angles if not scanning</li>
              <li>Works with UPC, EAN, and other standard barcodes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
