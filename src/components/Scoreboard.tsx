'use client';

import type { RoomPlayer } from '@/types/database.types';

interface ScoreboardProps {
  players: RoomPlayer[];
  currentPlayerId?: string;
}

export function Scoreboard({ players, currentPlayerId }: ScoreboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Scoreboard</h2>
      <div className="space-y-3">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.room_player_id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              player.room_player_id === currentPlayerId
                ? 'bg-blue-100 border-2 border-blue-500'
                : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0
                    ? 'bg-yellow-400 text-yellow-900'
                    : index === 1
                    ? 'bg-gray-400 text-gray-900'
                    : index === 2
                    ? 'bg-orange-400 text-orange-900'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {index + 1}
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  Player {index + 1}
                  {player.room_player_id === currentPlayerId && (
                    <span className="ml-2 text-xs text-blue-600">(You)</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Position: {player.position || 0}
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {player.score}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
