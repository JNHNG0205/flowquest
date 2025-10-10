'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { useGameRealtime } from '@/hooks/useGameRealtime';
import type { GameSession, SessionPlayer } from '@/types/database.types';

export default function CreateRoomPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<GameSession | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<SessionPlayer | null>(null);
  const [hasCreated, setHasCreated] = useState(false);
  const router = useRouter();

  const { session: realtimeSession, players } = useGameRealtime(session?.room_id || null);

  // Memoized room URL to prevent unnecessary recalculations
  const roomUrl = useMemo(() => {
    if (!session || typeof window === 'undefined') return '';
    return `${window.location.origin}/room/join?code=${session.room_code}`;
  }, [session]);

  // Memoized player count for optimization
  const playerCount = useMemo(() => players.length, [players.length]);

  // Memoized check if minimum players met
  const canStartGame = useMemo(() => playerCount >= 2, [playerCount]);

  // Update session when realtime updates
  useEffect(() => {
    if (realtimeSession) {
      setSession(realtimeSession);
      if (realtimeSession.status === 'in_progress') {
        router.push(`/game/${realtimeSession.room_id}`);
      }
    }
  }, [realtimeSession, router]);

  const createRoom = useCallback(async () => {
    // Prevent multiple room creation
    if (hasCreated || session) return;
    
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/rooms/create', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      setSession(data.data.session);
      setCurrentPlayer(data.data.player);
      setHasCreated(true);
    } catch (err) {
      console.error('Create room error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  }, [hasCreated, session]);

  const startGame = useCallback(async () => {
    if (!session) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/rooms/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.room_id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start game');
      }

      // Will be redirected by realtime listener
    } catch (err) {
      console.error('Start game error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start game');
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Only create room once on mount
  useEffect(() => {
    if (!hasCreated && !session) {
      createRoom();
    }
  }, [createRoom, hasCreated, session]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-700">Creating room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Room Created!</h1>
          <p className="text-white/80">Share this code or QR with your friends</p>
        </div>

        {/* Room Code */}
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-2">Room Code</p>
            <div className="text-6xl font-bold text-blue-600 tracking-wider">
              {session.room_code}
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <QRCodeDisplay data={roomUrl} size={256} />
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(session.room_code);
              alert('Room code copied to clipboard!');
            }}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Copy Room Code
          </button>
        </div>

        {/* Players List */}
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Players ({playerCount})
          </h2>
          <div className="space-y-3">
            {players.map((player, index) => (
              <div
                key={player.room_player_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Player {index + 1}
                    </div>
                    {player.room_player_id === currentPlayer?.room_player_id && (
                      <div className="text-xs text-blue-600">You (Host)</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Start Game Button */}
        <button
          onClick={startGame}
          disabled={loading || !canStartGame}
          className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Starting...' : !canStartGame ? 'Waiting for players...' : 'Start Game'}
        </button>

        {!canStartGame && (
          <p className="text-white text-center mt-4 text-sm">
            Need at least 2 players to start
          </p>
        )}
      </div>
    </div>
  );
}
