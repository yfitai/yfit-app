import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { Camera } from '@capacitor/camera'
import { Html5Qrcode } from 'html5-qrcode'

export default function BarcodeScannerComponent({ onScanSuccess, onClose }) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [isNative, setIsNative] = useState(Capacitor.isNativePlatform())
  const [html5Scanner, setHtml5Scanner] = useState(null)

  useEffect(() => {
    // Auto-start scanning when component mounts
    startScan()

    // Cleanup on unmount
    return () => {
      stopScan()
    }
  }, [])

  const startScan = async () => {
    try {
      console.log('🔍 startScan called, isNative:', isNative)
      setError(null)
      setScanning(true)

      if (isNative) {
        // Native mobile scanning
        console.log('📱 startNativeScan called')
        await startNativeScan()
      } else {
        // Web browser scanning with html5-qrcode
        console.log('🌐 startWebScan called')
        await startWebScan()
      }
    } catch (err) {
      console.error('❌ Error starting scan:', err)
      handleScanError(err)
    }
  }

  const startNativeScan = async () => {
    try {
      // Get BarcodeScanner from Capacitor.Plugins (native plugin registry)
      const { CapacitorBarcodeScanner } = Capacitor.Plugins
      console.log('🔌 CapacitorBarcodeScanner found:', CapacitorBarcodeScanner ? 'YES' : 'NO')
      
      if (!CapacitorBarcodeScanner) {
        throw new Error('Barcode scanner plugin not available')
      }

      // Check and request camera permission first
      console.log('📸 Checking camera permissions...')
      const permission = await Camera.checkPermissions()
      console.log('📸 Camera permission status:', permission)

      if (permission.camera === 'denied') {
        // Request permission
        const requestResult = await Camera.requestPermissions({ permissions: ['camera'] })

        if (requestResult.camera !== 'granted') {
          throw new Error('Camera permission denied')
        }
      }

      // Start scanning with Capacitor Barcode Scanner
      console.log('📷 Permissions OK, starting barcode scan...')
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: 17, // Try all formats
        scanInstructions: 'Point camera at barcode',
        scanButton: false,
        scanText: 'Scanning...',
        cameraDirection: 1 // Back camera
      })

      console.log('📊 Scan result:', result)
      
      // CRITICAL DEBUG: Show result on screen
      alert(`SCAN RESULT:\nScanResult: ${result?.ScanResult || 'EMPTY'}\nFormat: ${result?.format || 'NONE'}\nFull: ${JSON.stringify(result)}`)
      
      if (result && result.ScanResult) {
        console.log('✅ Barcode detected:', result.ScanResult)
        handleScanSuccess(result.ScanResult)
      } else {
        console.log('❌ No barcode in result')
        setError('No barcode detected. Please try again.')
        setScanning(false)
      }
    } catch (err) {
      console.error('Native scan error:', err)
      throw err
    }
  }

  const startWebScan = async () => {
    try {
      const scanner = new Html5Qrcode('barcode-reader')
      setHtml5Scanner(scanner)

      await scanner.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          // Success callback
          handleScanSuccess(decodedText)
        },
        (errorMessage) => {
          // Error callback (fires continuously, ignore most errors)
          // Only log unique errors
        }
      )
    } catch (err) {
      console.error('Web scan error:', err)
      throw err
    }
  }

  const stopScan = async () => {
    try {
      if (isNative) {
        // Native scanner stops automatically after scan
        // No cleanup needed
      } else if (html5Scanner) {
        // Stop web scanner
        await html5Scanner.stop()
        await html5Scanner.clear()
      }
    } catch (err) {
      console.error('Error stopping scan:', err)
    }
  }

  const handleScanSuccess = async (barcode) => {
    console.log('🎯 handleScanSuccess called with barcode:', barcode)
    // Stop scanning
    setScanning(false)

    // Stop web scanner if needed
    if (!isNative && html5Scanner) {
      await stopScan()
    }

    // Pass barcode string to parent immediately
    // Parent will handle the food lookup
    console.log('📤 Calling onScanSuccess callback with barcode:', barcode)
    onScanSuccess(barcode)
  }

  const handleScanError = (err) => {
    if (err.message?.includes('permission')) {
      setError('Camera permission denied. Please enable camera access in settings.')
    } else if (err.message?.includes('cancel')) {
      setError('Scan cancelled.')
    } else if (err.message?.includes('not available')) {
      setError(err.message)
    } else {
      setError('Unable to access camera. Check permissions and try again.')
    }
    setScanning(false)
  }

  const handleClose = async () => {
    await stopScan()
    onClose()
  }

  const handleTryAgain = () => {
    setError(null)
    startScan()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      {/* Web Scanner Container */}
      {!isNative && (
        <div
          id="barcode-reader"
          className="w-full max-w-md"
          style={{ display: scanning ? 'block' : 'none' }}
        ></div>
      )}

      {/* Native Scanner Overlay */}
      {isNative && scanning && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-64 h-64 border-4 border-white rounded-lg relative">
            {/* Scanning animation corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
          </div>
          <p className="text-white text-lg font-medium mt-8">
            Point camera at barcode
          </p>
        </div>
      )}

      {/* Status Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full max-w-md mx-4 pointer-events-auto">
          {/* Error State */}
          {error && (
            <div className="bg-white rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">⚠️</div>
                <p className="text-lg font-medium text-gray-800">{error}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTryAgain}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      {!error && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-white text-gray-800 rounded-full hover:bg-gray-100 transition-colors font-medium shadow-lg"
          >
            Cancel Scan
          </button>
        </div>
      )}

      {/* Instructions */}
      {!error && (
        <div className="absolute top-8 left-0 right-0 flex justify-center">
          <div className="bg-black bg-opacity-75 text-white px-6 py-3 rounded-full max-w-md mx-4">
            <p className="text-sm text-center">
              {isNative
                ? 'Position barcode within the frame'
                : 'Allow camera access and point at barcode'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
