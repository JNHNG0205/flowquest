'use client';

import { useMemo } from 'react';
import type { SessionPlayer } from '@/types/database.types';

interface VirtualBoardProps {
  players: SessionPlayer[];
  currentPlayerId?: string;
}

interface BoardCell {
  position: number | null; // null for empty center cells
  row: number;
  col: number;
  players: SessionPlayer[];
  isEmpty: boolean;
  tileType?: 'question' | 'powerup'; // Type of tile for this position
}

export function VirtualBoard({ players, currentPlayerId }: VirtualBoardProps) {
  const BOARD_SIZE = 10;
  // Calculate perimeter positions: top (10) + right (8) + bottom (10) + left (8) = 36
  const PERIMETER_POSITIONS = (BOARD_SIZE * 2) + ((BOARD_SIZE - 2) * 2);

  // Pre-generate tile types for each position (stable across renders)
  const tileTypes = useMemo(() => {
    const types: ('question' | 'powerup')[] = [];
    for (let i = 0; i < PERIMETER_POSITIONS; i++) {
      types.push(Math.random() > 0.5 ? 'question' : 'powerup');
    }
    return types;
  }, [PERIMETER_POSITIONS]);

  // Generate Monopoly-style perimeter path (positions around the border)
  const boardLayout = useMemo(() => {
    const cells: BoardCell[] = [];
    
    // Create a 10x10 grid
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const isTopRow = row === 0;
        const isBottomRow = row === BOARD_SIZE - 1;
        const isLeftCol = col === 0;
        const isRightCol = col === BOARD_SIZE - 1;
        const isOnPerimeter = isTopRow || isBottomRow || isLeftCol || isRightCol;
        
        if (isOnPerimeter) {
          // This cell is on the perimeter - assign a position
          let position: number;
          
          if (isTopRow) {
            // Top row: left to right (positions 1-10)
            position = col + 1;
          } else if (isRightCol && !isTopRow && !isBottomRow) {
            // Right column: top to bottom (positions 11-18, excluding corners)
            // row 1-8, so position = 10 + row
            position = BOARD_SIZE + row;
          } else if (isBottomRow) {
            // Bottom row: right to left (positions 19-28)
            // col 9-0, so position = 10 + 8 + (10 - col) = 18 + (10 - col)
            position = BOARD_SIZE + (BOARD_SIZE - 2) + (BOARD_SIZE - col);
          } else if (isLeftCol && !isTopRow && !isBottomRow) {
            // Left column: bottom to top (positions 29-36, excluding corners)
            // row 8→29, row 7→30, ..., row 1→36
            // position = 28 + (9 - row) = 37 - row
            position = (BOARD_SIZE * 2) + (BOARD_SIZE - 2) + (BOARD_SIZE - 1 - row);
          } else {
            // Should not happen, but fallback
            position = 0;
          }
          
          const cellPlayers = players.filter(p => (p.position || 0) === position);
          
          // Get tile type for this position
          const tileType = tileTypes[position - 1] || (Math.random() > 0.5 ? 'question' : 'powerup');
          
          cells.push({
            position,
            row,
            col,
            players: cellPlayers,
            isEmpty: false,
            tileType,
          });
        } else {
          // This cell is in the center - empty
          cells.push({
            position: null,
            row,
            col,
            players: [],
            isEmpty: true,
          });
        }
      }
    }
    
    return cells;
  }, [players, PERIMETER_POSITIONS, tileTypes]);

  // Get player color based on their index
  const getPlayerColor = (playerIndex: number) => {
    const colors = [
      'bg-yellow-400 border-yellow-600',
      'bg-gray-400 border-gray-600',
      'bg-orange-400 border-orange-600',
      'bg-blue-400 border-blue-600',
      'bg-green-400 border-green-600',
      'bg-purple-400 border-purple-600',
    ];
    return colors[playerIndex % colors.length];
  };

  // Get player number (1-based index)
  const getPlayerNumber = (playerId: string) => {
    const index = players.findIndex(p => p.room_player_id === playerId);
    return index + 1;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-3 overflow-auto max-h-[600px]">
      <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">
        Virtual Board
      </h3>
      
      {/* 10x10 Grid */}
      <div className="grid grid-cols-10 gap-0.5">
        {boardLayout.map((cell) => (
          <div
            key={`${cell.row}-${cell.col}`}
            className={`
              aspect-square border rounded-sm
              ${cell.isEmpty 
                ? 'border-transparent bg-transparent' 
                : cell.players.length > 0 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 bg-gray-50'
              }
              flex flex-col items-center justify-center
              text-xs font-semibold
              relative
              ${!cell.isEmpty ? 'hover:bg-gray-100 transition-colors p-0.5' : ''}
              min-w-0
            `}
            title={cell.isEmpty ? 'Empty' : `Position ${cell.position}`}
          >
            {!cell.isEmpty && (
              <>
                {/* Position number */}
                <span className="text-gray-700 text-sm font-bold">
                  {cell.position}
                </span>

                {/* Player markers */}
                {cell.players.length > 0 && (
                  <div className="absolute top-1 right-1 flex flex-wrap gap-0.5 justify-end items-start z-20">
                    {cell.players.map((player) => {
                      const playerIndex = players.findIndex(
                        p => p.room_player_id === player.room_player_id
                      );
                      const isCurrentPlayer = player.room_player_id === currentPlayerId;
                      
                      return (
                        <div
                          key={player.room_player_id}
                          className={`
                            ${getPlayerColor(playerIndex)}
                            w-3 h-3 rounded-full border
                            flex items-center justify-center
                            ${isCurrentPlayer ? 'ring-1 ring-blue-600' : ''}
                            text-[7px] font-bold leading-none
                            shadow-sm
                          `}
                          title={`Player ${getPlayerNumber(player.room_player_id)}${isCurrentPlayer ? ' (You)' : ''}`}
                        >
                          {getPlayerNumber(player.room_player_id)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex flex-wrap gap-2 justify-center text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-600"></div>
            <span>P1</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-400 border border-gray-600"></div>
            <span>P2</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-400 border border-orange-600"></div>
            <span>P3</span>
          </div>
        </div>
      </div>
    </div>
  );
}

