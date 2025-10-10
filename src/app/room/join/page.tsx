'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QRScanner } from '@/components/QRScanner';

function JoinRoomContent() {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const joinRoom = async (code?: string) => {
    const codeToJoin = code || roomCode;
    
    if (!codeToJoin || codeToJoin.length !== 6) {
      setError('Please enter a valid 6-digit room code');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: codeToJoin }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join room');
      }

      // Navigate to waiting room (room/create shows waiting room for all players)
      // We'll create a generic waiting room that works for both host and joiners
      router.push(`/room/${data.data.session.room_id}`);
    } catch (err) {
      console.error('Join room error:', err);
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  // Check if room code is in URL
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setRoomCode(code);
      joinRoom(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleQRScan = (data: string) => {
    console.log('QR Scanned:', data);
    setShowScanner(false);

    // Extract room code from URL
    try {
      const url = new URL(data);
      const code = url.searchParams.get('code');
      if (code) {
        setRoomCode(code);
        joinRoom(code);
      } else {
        setError('Invalid QR code');
      }
    } catch {
      // If not a URL, assume it's just the room code
      if (data.length === 6) {
        setRoomCode(data);
        joinRoom(data);
      } else {
        setError('Invalid QR code');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Join Room</h1>
          <p className="text-white/80">Enter a room code or scan QR</p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          {/* Room Code Input */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setRoomCode(value);
                if (error) setError('');
              }}
              placeholder="000000"
              className="w-full px-4 py-3 text-2xl text-center font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none tracking-widest"
              maxLength={6}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Join Button */}
          <button
            onClick={() => joinRoom()}
            disabled={loading || roomCode.length !== 6}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mb-4"
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300" />
            <span className="px-4 text-gray-500 text-sm">OR</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          {/* Scan QR Button */}
          <button
            onClick={() => setShowScanner(true)}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
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
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
            Scan QR Code
          </button>
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="w-full mt-4 text-white hover:text-white/80 underline"
        >
          Back to Home
        </button>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onError={setError}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}

export default function JoinRoomPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <JoinRoomContent />
    </Suspense>
  );
}
