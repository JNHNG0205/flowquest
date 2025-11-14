'use client';

import type { RoomPlayer } from '@/types/database.types';

interface ScoreboardProps {
  players: RoomPlayer[];
  currentPlayerId?: string;
}

export function Scoreboard({ players, currentPlayerId }: ScoreboardProps) {
  // First, sort players by join order (room_player_id) to ensure consistent player numbers
  const playersByJoinOrder = [...players].sort((a, b) => 
    a.room_player_id.localeCompare(b.room_player_id)
  );
  
  // Create a map of player IDs to their join order (player numbers)
  // Player number is based on join order (room_player_id), not array position
  const playerNumbers = new Map(
    playersByJoinOrder.map((player, index) => [player.room_player_id, index + 1])
  );

  // Sort by score for display, but keep original player numbers
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Scoreboard</h2>
      <div className="space-y-3">
        {sortedPlayers.map((player, index) => {
          const playerNumber = playerNumbers.get(player.room_player_id) || index + 1;
          
          return (
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
                    Player {playerNumber}
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
          );
        })}
      </div>
    </div>
  );
}
