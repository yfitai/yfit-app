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
      
      // Dynamically import the scanBarcode function from official Capacitor plugin
      let scanBarcode
      try {
        const module = await import('@capacitor/barcode-scanner')
        scanBarcode = module.scanBarcode
        console.log('scanBarcode function imported:', typeof scanBarcode)
      } catch (importErr) {
        console.error('Failed to import scanBarcode:', importErr)
        throw new Error('Barcode scanner plugin not available')
      }

      if (!scanBarcode || typeof scanBarcode !== 'function') {
        console.error('scanBarcode is not a function')
        throw new Error('Barcode scanner plugin not available')
      }

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
      // Using official API: scanBarcode(options)
      const result = await scanBarcode({
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
      console.log('Looking up food for barcode:', barcode)
      setLookingUp(true)
      
      const foodData = await getFoodByBarcode(barcode)
      console.log('Food data:', foodData)
      
      if (foodData) {
        onScanSuccess(foodData)
        onClose()
      } else {
        throw new Error('Food not found in database')
      }
    } catch (err) {
      console.error('Food lookup error:', err)
      setError('Could not find food information for this barcode')
    } finally {
      setLookingUp(false)
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
          <div className="bg-red-500 text-white px-6 py-3 rounded-lg max-w-sm text-center">
            {error}
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
