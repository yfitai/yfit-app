// Stub file for @capacitor/barcode-scanner on web builds
// This prevents build errors when the package isn't available
export const BarcodeScanner = {
  scanBarcode: async () => {
    throw new Error('Barcode scanner not available on web')
  }
}
