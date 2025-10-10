'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { useGameRealtime } from '@/hooks/useGameRealtime';
import type { GameSession, SessionPlayer } from '@/types/database.types';

export default function WaitingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<GameSession | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<SessionPlayer | null>(null);

  const { session: realtimeSession, players } = useGameRealtime(roomId);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, [supabase.auth]);

  // Find current player
  useEffect(() => {
    if (currentUser && players.length > 0) {
      const player = players.find((p) => p.user_id === currentUser.id);
      setCurrentPlayer(player || null);
    }
  }, [currentUser, players]);

  // Fetch initial session data
  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_id', roomId)
        .single();
      
      if (data) setSession(data);
    };
    fetchSession();
  }, [roomId, supabase]);

  // Update session when realtime updates
  useEffect(() => {
    if (realtimeSession) {
      setSession(realtimeSession);
      
      // Redirect to game when host starts
      if (realtimeSession.status === 'in_progress') {
        router.push(`/game/${realtimeSession.room_id}`);
      }
      
      // Redirect to home if room becomes inactive (all players left)
      if (!realtimeSession.is_active) {
        router.push('/');
      }
    }
  }, [realtimeSession, router]);

  // Memoized values
  const roomUrl = useMemo(() => {
    if (!session || typeof window === 'undefined') return '';
    return `${window.location.origin}/room/join?code=${session.room_code}`;
  }, [session]);

  const playerCount = useMemo(() => players.length, [players.length]);
  const canStartGame = useMemo(() => playerCount >= 2, [playerCount]);
  const isHost = useMemo(() => 
    currentUser && session ? currentUser.id === session.host_id : false, 
    [currentUser, session]
  );

  const startGame = async () => {
    if (!session || !canStartGame) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/rooms/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.room_id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start game');
      }

      // Redirect immediately after successful API call
      router.push(`/game/${session.room_id}`);
    } catch (err) {
      console.error('Start game error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  const leaveRoom = async () => {
    if (!session) return;

    try {
      setLoading(true);

      const response = await fetch('/api/rooms/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: session.room_id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to leave room');
      }

      // Redirect to home after leaving
      router.push('/');
    } catch (err) {
      console.error('Leave room error:', err);
      setError(err instanceof Error ? err.message : 'Failed to leave room');
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading room...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {isHost ? 'Your Game Room' : 'Waiting Room'}
          </h1>
          <p className="text-white/80">
            {isHost 
              ? 'Share the code or QR to invite players' 
              : 'Waiting for host to start the game...'}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Room Info Card */}
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Room Code</h2>
            
            {/* Large Room Code Display */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-6 mb-6">
              <div className="text-center">
                <div className="text-white/80 text-sm mb-2">Share this code</div>
                <div className="text-6xl font-bold text-white tracking-widest">
                  {session.room_code}
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeDisplay data={roomUrl} size={200} />
              </div>
            </div>

            {/* Copy Link Button */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(roomUrl);
                alert('Link copied to clipboard!');
              }}
              className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors mb-2"
            >
              📋 Copy Invite Link
            </button>

            {/* Room Status */}
            <div className="text-center text-sm text-gray-600 mt-4">
              Status: <span className="font-semibold">{session.status === 'waiting' ? 'Waiting for players' : 'In Progress'}</span>
            </div>
          </div>

          {/* Players Card */}
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Players ({playerCount})
            </h2>

            {/* Player List */}
            <div className="space-y-3 mb-6">
              {players.map((player, index) => (
                <div
                  key={player.room_player_id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    player.room_player_id === currentPlayer?.room_player_id
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        Player {index + 1}
                        {player.room_player_id === currentPlayer?.room_player_id && (
                          <span className="ml-2 text-xs text-blue-600">(You)</span>
                        )}
                        {player.user_id === session.host_id && (
                          <span className="ml-2 text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full">
                            Host
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">Ready to play</div>
                    </div>
                  </div>
                  <div className="text-green-500 text-xl">✓</div>
                </div>
              ))}
            </div>

            {/* Minimum Players Notice */}
            {playerCount < 2 && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div>
                    <div className="font-semibold text-yellow-900 mb-1">
                      Need more players
                    </div>
                    <div className="text-sm text-yellow-800">
                      At least 2 players are required to start the game.
                      Currently: {playerCount}/2
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 mb-6">
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            )}

            {/* Start Game Button (Host Only) */}
            {isHost ? (
              <button
                onClick={startGame}
                disabled={loading || !canStartGame}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Starting...' : canStartGame ? '🎮 Start Game' : 'Waiting for Players...'}
              </button>
            ) : (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center">
                <div className="text-4xl mb-3 animate-pulse">⏳</div>
                <div className="font-semibold text-blue-900 mb-1">
                  Waiting for host
                </div>
                <div className="text-sm text-blue-700">
                  The host will start the game when ready
                </div>
              </div>
            )}

            {/* Leave Room Button */}
            <button
              onClick={leaveRoom}
              disabled={loading}
              className="w-full mt-4 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Leaving...' : 'Leave Room'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
