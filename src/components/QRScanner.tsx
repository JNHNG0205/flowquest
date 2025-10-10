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
  const [permissionDenied, setPermissionDenied] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        // Better config for mobile (especially iOS)
        const config = {
          fps: 10,
          qrbox: 250,
          aspectRatio: 1.0,
          disableFlip: false,
          // iOS-specific settings
          videoConstraints: {
            facingMode: 'environment',
            focusMode: 'continuous' // Better for iOS
          }
        };

        // Try to get camera permission first (iOS-specific approach)
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } 
          });
          // Stop the test stream immediately
          stream.getTracks().forEach(track => track.stop());
        } catch (permError) {
          console.error('Permission error:', permError);
          setPermissionDenied(true);
          const errorMsg = 'Camera permission denied. Please allow camera access and reload.';
          setError(errorMsg);
          if (onError) onError(errorMsg);
          return;
        }

        // For iOS, we need to request camera access differently
        // Try to get available cameras first
        let cameraId: string | undefined;
        try {
          const devices = await Html5Qrcode.getCameras();
          console.log('Available cameras:', devices);
          
          // Find back camera (environment facing)
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment')
          );
          
          cameraId = backCamera?.id || devices[devices.length - 1]?.id;
          console.log('Selected camera:', backCamera?.label || 'Default camera');
        } catch (cameraError) {
          console.error('Error getting cameras:', cameraError);
        }

        // Start scanning - use camera ID for iOS, constraints for Android
        if (cameraId) {
          // iOS approach - use specific camera ID
          await scanner.start(
            cameraId,
            config,
            (decodedText) => {
              if (!hasScannedRef.current) {
                hasScannedRef.current = true;
                console.log('QR Code decoded:', decodedText);
                onScan(decodedText);
                
                scanner.stop().then(() => {
                  scanner.clear();
                }).catch(console.error);
              }
            },
            (errorMessage) => {
              // Ignore frequent "not found" errors
            }
          );
        } else {
          // Android approach - use constraints
          await scanner.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
              if (!hasScannedRef.current) {
                hasScannedRef.current = true;
                console.log('QR Code decoded:', decodedText);
                onScan(decodedText);
                
                scanner.stop().then(() => {
                  scanner.clear();
                }).catch(console.error);
              }
            },
            (errorMessage) => {
              // Ignore frequent "not found" errors
            }
          );
        }

        setIsScanning(true);
      } catch (err) {
        console.error('Failed to start scanner:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to start camera. Please check permissions.';
        setError(errorMsg);
        if (onError) onError(errorMsg);
      }
    };

    startScanner();

    // Cleanup on unmount
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
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
          <div className="mt-4 p-4 bg-red-100 border-2 border-red-300 text-red-800 rounded-lg text-sm">
            <p className="font-bold mb-2 text-base">❌ Camera Error</p>
            <p className="mb-3">{error}</p>
            
            {permissionDenied ? (
              <div className="bg-white p-3 rounded border border-red-200 space-y-2 text-xs">
                <p className="font-semibold text-red-900">📱 On Mobile:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Tap the 🔒 or (i) icon in your browser&apos;s address bar</li>
                  <li>Find &quot;Camera&quot; and set it to &quot;Allow&quot;</li>
                  <li>Refresh this page</li>
                </ol>
                <p className="font-semibold text-red-900 mt-3">💻 On Desktop:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Click the camera icon in the address bar</li>
                  <li>Select &quot;Always allow camera&quot;</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            ) : (
              <div className="bg-white p-3 rounded border border-red-200 text-xs space-y-1">
                <p className="font-semibold">Common fixes:</p>
                <p>• Close other apps using the camera</p>
                <p>• Use HTTPS (camera requires secure connection)</p>
                <p>• Try Chrome or Safari browser</p>
                <p>• Restart your browser</p>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {isScanning && !error && (
          <div className="mt-4 p-3 bg-green-50 border-2 border-green-200 rounded-lg space-y-2">
            <p className="text-sm text-green-900 text-center font-bold flex items-center justify-center gap-2">
              <span className="text-2xl">✓</span>
              Camera Active - Ready to Scan!
            </p>
            <div className="text-xs text-green-800 space-y-1 text-center">
              <p>📱 Position QR code in the red scanning box</p>
              <p>💡 Ensure good lighting and hold steady</p>
              <p>🎯 Keep QR code clear and in focus</p>
            </div>
          </div>
        )}

        {/* Debug Info */}
        {isScanning && !error && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            Scanning... Move QR code closer or further if not detected
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
