import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { Camera } from '@capacitor/camera'
import { Html5Qrcode } from 'html5-qrcode'
import { getFoodByBarcode } from '../lib/foodDatabase'

export default function BarcodeScannerComponent({ onScanSuccess, onClose }) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [lookingUp, setLookingUp] = useState(false)
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
      console.log('startScan called, isNative:', isNative)
      setError(null)
      setScanning(true)

      if (isNative) {
        // Native mobile scanning
        await startNativeScan()
      } else {
        // Web browser scanning with html5-qrcode
        await startWebScan()
      }
    } catch (err) {
      console.error('Error starting scan:', err)
      handleScanError(err)
    }
  }

  const startNativeScan = async () => {
    try {
      console.log('startNativeScan called')
      
      // Access the plugin through Capacitor.Plugins (works with native builds)
      const { CapacitorBarcodeScanner } = Capacitor.Plugins
      
      if (!CapacitorBarcodeScanner) {
        console.error('CapacitorBarcodeScanner plugin not available')
        throw new Error('Barcode scanner plugin not available')
      }
      
      console.log('CapacitorBarcodeScanner available:', CapacitorBarcodeScanner)

      // Check and request camera permission first
      console.log('Checking camera permissions...')
      const permission = await Camera.checkPermissions()
      console.log('Camera permission status:', permission)

      if (permission.camera === 'denied') {
        console.log('Camera permission denied, requesting...')
        // Request permission
        const requestResult = await Camera.requestPermissions({ permissions: ['camera'] })
        console.log('Permission request result:', requestResult)

        if (requestResult.camera !== 'granted') {
          throw new Error('Camera permission denied')
        }
      }

      console.log('Permissions OK, starting barcode scan...')

      // Start scanning with Capacitor Barcode Scanner
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: 17, // ALL formats
        scanInstructions: 'Point camera at barcode',
        scanButton: false,
        scanText: 'Scanning...',
        cameraDirection: 1 // Back camera
      })

      console.log('Scan result:', result)

      if (result && result.ScanResult) {
        const barcode = result.ScanResult
        console.log('Barcode scanned:', barcode)
        await lookupFood(barcode)
      } else {
        throw new Error('No barcode detected')
      }
    } catch (err) {
      console.error('Native scan error:', err)
      throw err
    }
  }

  const startWebScan = async () => {
    try {
      console.log('startWebScan called')
      
      // Create scanner instance if not exists
      if (!html5Scanner) {
        const scanner = new Html5Qrcode('barcode-scanner-region')
        setHtml5Scanner(scanner)
        
        // Start scanning
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          async (decodedText) => {
            console.log('Web barcode scanned:', decodedText)
            await lookupFood(decodedText)
            scanner.stop()
          },
          (errorMessage) => {
            // Ignore scan errors (happens frequently during scanning)
          }
        )
      }
    } catch (err) {
      console.error('Web scan error:', err)
      throw err
    }
  }

  const stopScan = () => {
    console.log('stopScan called')
    setScanning(false)
    
    if (html5Scanner) {
      html5Scanner.stop().catch(err => console.error('Error stopping scanner:', err))
    }
  }

  const lookupFood = async (barcode) => {
    try {
      console.log('🔍 Looking up food for barcode:', barcode)
      setLookingUp(true)
      setScanning(false) // Stop scanning while looking up
      
      const foodData = await getFoodByBarcode(barcode)
      console.log('📦 Food data received:', foodData)
      
      if (foodData) {
        console.log('✅ Food found! Calling onScanSuccess')
        onScanSuccess(foodData)
        // Let parent component handle closing and showing serving selector
      } else {
        console.warn('❌ Food not found for barcode:', barcode)
        throw new Error(`Food not found for barcode: ${barcode}. Try scanning again or search manually.`)
      }
    } catch (err) {
      console.error('❌ Food lookup error:', err)
      setError(err.message || 'Could not find food information for this barcode')
      setLookingUp(false)
      // Keep scanner open to show error - user can close manually or try again
    } finally {
      if (!error) {
        setLookingUp(false)
      }
    }
  }

  const handleScanError = (err) => {
    console.error('Scan error:', err)
    setScanning(false)
    setError(err.message || 'Failed to scan barcode')
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Scanner region for web */}
      {!isNative && (
        <div id="barcode-scanner-region" className="flex-1" />
      )}
      
      {/* Status overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {scanning && !lookingUp && (
          <div className="bg-black/50 text-white px-6 py-3 rounded-lg">
            {isNative ? 'Point camera at barcode' : 'Scanning...'}
          </div>
        )}
        
        {lookingUp && (
          <div className="bg-black/50 text-white px-6 py-3 rounded-lg">
            Looking up food information...
          </div>
        )}
        
        {error && (
          <div className="bg-red-500 text-white px-6 py-3 rounded-lg max-w-sm text-center pointer-events-auto">
            <p className="mb-3">{error}</p>
            <button
              onClick={() => {
                setError(null)
                startScan()
              }}
              className="bg-white text-red-500 px-4 py-2 rounded-lg font-medium hover:bg-gray-100"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
      
      {/* Close button */}
      <button
        onClick={() => {
          stopScan()
          onClose()
        }}
        className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-3 pointer-events-auto"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
