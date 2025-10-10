'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onError, onClose }: QRScannerProps) {
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    // Start scanning
    scanner
      .start(
        { facingMode: 'environment' }, // Use back camera
        config,
        (decodedText) => {
          // Success callback - only process once
          if (!hasScannedRef.current) {
            hasScannedRef.current = true;
            console.log('QR Code decoded:', decodedText);
            onScan(decodedText);
            
            // Stop scanner after successful scan
            scanner.stop().then(() => {
              scanner.clear();
            }).catch(console.error);
          }
        },
        (errorMessage) => {
          // Error callback - fires frequently, ignore most errors
          // Only log actual problems, not "No QR code found" messages
        }
      )
      .then(() => {
        setIsScanning(true);
      })
      .catch((err) => {
        console.error('Failed to start scanner:', err);
        const errorMsg = 'Camera access denied. Please allow camera permissions in your browser settings.';
        setError(errorMsg);
        if (onError) onError(errorMsg);
      });

    // Cleanup on unmount
    return () => {
      if (scanner.isScanning) {
        scanner.stop().then(() => {
          scanner.clear();
        }).catch(console.error);
      }
    };
  }, [onScan, onError]);

  const handleClose = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().then(() => {
        scannerRef.current?.clear();
      }).catch(console.error);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-4 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Scan QR Code</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 p-2"
            aria-label="Close scanner"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Camera View */}
        <div className="relative w-full bg-black rounded-lg overflow-hidden">
          <div id="qr-reader" className="w-full"></div>
          
          {!isScanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Starting camera...</p>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            <p className="font-semibold mb-1">❌ Camera Error</p>
            <p>{error}</p>
            <div className="mt-2 text-xs space-y-1">
              <p><strong>How to fix:</strong></p>
              <p>1. Go to browser Settings → Site Settings</p>
              <p>2. Find Camera permissions</p>
              <p>3. Allow camera access for this site</p>
              <p>4. Reload the page</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        {isScanning && !error && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-700 text-center font-medium">
              📱 Position the QR code within the scanning box
            </p>
            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>✓ Make sure the QR code is well-lit</p>
              <p>✓ Hold your device steady</p>
              <p>✓ Keep QR code within the red box</p>
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
