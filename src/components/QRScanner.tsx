'use client';

import { useState } from 'react';
import { QrReader } from 'react-qr-reader';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onError, onClose }: QRScannerProps) {
  const [error, setError] = useState<string>('');
  const [hasScanned, setHasScanned] = useState(false);

  const handleScan = (result: any) => {
    if (result && !hasScanned) {
      setHasScanned(true);
      const text = result?.text || result;
      console.log('QR Code decoded:', text);
      onScan(text);
    }
  };

  const handleError = (error: any) => {
    console.error('QR Scanner error:', error);
    const errorMsg = error?.message || 'Camera access denied or not available';
    setError(errorMsg);
    if (onError) onError(errorMsg);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-4 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Scan QR Code</h2>
          <button
            onClick={onClose}
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
        <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden">
          <QrReader
            onResult={handleScan}
            constraints={{
              facingMode: 'environment',
            }}
            containerStyle={{
              width: '100%',
              height: '100%',
            }}
            videoContainerStyle={{
              width: '100%',
              height: '100%',
              paddingTop: '0',
            }}
            videoStyle={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          
          {/* Scanning Frame Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-2 border-white/30" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-blue-500 rounded-lg" />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            <p className="font-semibold mb-1">Camera Error</p>
            <p>{error}</p>
            <p className="mt-2 text-xs">
              Please allow camera access in your browser settings and reload the page.
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-700 text-center font-medium">
            📱 Position the QR code within the blue frame
          </p>
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>• Make sure the QR code is well-lit</p>
            <p>• Hold your device steady</p>
            <p>• Keep QR code within the frame</p>
          </div>
        </div>

        {/* Manual Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
