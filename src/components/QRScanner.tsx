'use client';

import { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onError, onClose }: QRScannerProps) {
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const qrScanner = new Html5Qrcode('qr-reader');
    setScanner(qrScanner);

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    };

    qrScanner
      .start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          console.log('QR Code decoded:', decodedText);
          onScan(decodedText);
          qrScanner.stop();
        },
        (errorMessage) => {
          // Ignore frequent scanning errors
        }
      )
      .catch((err) => {
        console.error('QR Scanner error:', err);
        const errorMsg = 'Failed to start camera. Please check permissions.';
        setError(errorMsg);
        if (onError) onError(errorMsg);
      });

    return () => {
      if (qrScanner.isScanning) {
        qrScanner.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Scan QR Code</h2>
          <button
            onClick={() => {
              if (scanner?.isScanning) {
                scanner.stop().catch(console.error);
              }
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700"
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

        <div id="qr-reader" className="w-full"></div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <p className="mt-4 text-sm text-gray-600 text-center">
          Position the QR code within the frame
        </p>
      </div>
    </div>
  );
}
