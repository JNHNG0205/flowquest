'use client';

import { useMemo } from 'react';
import { QRCodeDisplay } from './QRCodeDisplay';
import type { SessionPlayer } from '@/types/database.types';

interface VirtualBoardProps {
  players: SessionPlayer[];
  currentPlayerId?: string;
}

interface BoardCell {
  position: number;
  row: number;
  col: number;
  players: SessionPlayer[];
}

interface SurroundingQR {
  type: 'question' | 'powerup';
  position: number;
  data: string;
}

export function VirtualBoard({ players, currentPlayerId }: VirtualBoardProps) {
  const BOARD_SIZE = 10;
  const TOTAL_POSITIONS = BOARD_SIZE * BOARD_SIZE;

  // Generate snake-like path positions
  const boardLayout = useMemo(() => {
    const cells: BoardCell[] = [];
    
    for (let i = 0; i < TOTAL_POSITIONS; i++) {
      const row = Math.floor(i / BOARD_SIZE);
      const isEvenRow = row % 2 === 0;
      const col = isEvenRow 
        ? i % BOARD_SIZE 
        : BOARD_SIZE - 1 - (i % BOARD_SIZE);
      
      const position = i + 1;
      const cellPlayers = players.filter(p => (p.position || 0) === position);
      
      cells.push({
        position,
        row,
        col,
        players: cellPlayers,
      });
    }
    
    return cells;
  }, [players, TOTAL_POSITIONS]);

  // Generate random QR codes surrounding the board
  const surroundingQRs = useMemo(() => {
    const qrs: SurroundingQR[] = [];
    const numQRs = 20; // Number of QR codes around the board
    
    // Generate random positions and types
    for (let i = 0; i < numQRs; i++) {
      const type = Math.random() > 0.5 ? 'question' : 'powerup';
      const position = TOTAL_POSITIONS + i + 1; // Positions beyond the board
      
      qrs.push({
        type,
        position,
        data: JSON.stringify({
          type,
          position,
          description: `${type === 'question' ? 'Question' : 'Powerup'} Tile ${position}`,
        }),
      });
    }
    
    return qrs;
  }, [TOTAL_POSITIONS]);

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
      
      <div className="relative">
        {/* Surrounding QR Codes - Top */}
        <div className="flex justify-center gap-1 mb-1 flex-wrap">
          {surroundingQRs.slice(0, 5).map((qr) => (
            <div
              key={qr.position}
              className="flex flex-col items-center"
              title={`${qr.type === 'question' ? 'Question' : 'Powerup'} Tile ${qr.position}`}
            >
              <div className="w-10 h-10 border border-gray-300 rounded overflow-hidden">
                <QRCodeDisplay data={qr.data} size={40} />
              </div>
              <span className="text-[10px] text-gray-600 mt-0.5">
                {qr.type === 'question' ? '❓' : '⚡'}
              </span>
            </div>
          ))}
        </div>

        {/* Main Board Grid */}
        <div className="flex gap-1">
          {/* Left QR Codes */}
          <div className="flex flex-col justify-center gap-1">
            {surroundingQRs.slice(5, 8).map((qr) => (
              <div
                key={qr.position}
                className="flex flex-col items-center"
                title={`${qr.type === 'question' ? 'Question' : 'Powerup'} Tile ${qr.position}`}
              >
                <div className="w-10 h-10 border border-gray-300 rounded overflow-hidden">
                  <QRCodeDisplay data={qr.data} size={40} />
                </div>
                <span className="text-[10px] text-gray-600 mt-0.5">
                  {qr.type === 'question' ? '❓' : '⚡'}
                </span>
              </div>
            ))}
          </div>

          {/* 10x10 Grid */}
          <div className="grid grid-cols-10 gap-0.5 flex-1 min-w-0">
            {boardLayout.map((cell) => (
              <div
                key={cell.position}
                className={`
                  aspect-square border rounded-sm
                  ${cell.players.length > 0 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 bg-gray-50'
                  }
                  flex flex-col items-center justify-center
                  text-xs font-semibold
                  relative
                  hover:bg-gray-100 transition-colors
                  min-w-0
                `}
                title={`Position ${cell.position}`}
              >
                {/* Position number */}
                <span className="text-gray-500 text-[7px] absolute top-0 left-0.5 leading-none">
                  {cell.position}
                </span>

                {/* Player markers */}
                {cell.players.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 justify-center items-center">
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
                          `}
                          title={`Player ${getPlayerNumber(player.room_player_id)}${isCurrentPlayer ? ' (You)' : ''}`}
                        >
                          {getPlayerNumber(player.room_player_id)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right QR Codes */}
          <div className="flex flex-col justify-center gap-1">
            {surroundingQRs.slice(8, 11).map((qr) => (
              <div
                key={qr.position}
                className="flex flex-col items-center"
                title={`${qr.type === 'question' ? 'Question' : 'Powerup'} Tile ${qr.position}`}
              >
                <div className="w-10 h-10 border border-gray-300 rounded overflow-hidden">
                  <QRCodeDisplay data={qr.data} size={40} />
                </div>
                <span className="text-[10px] text-gray-600 mt-0.5">
                  {qr.type === 'question' ? '❓' : '⚡'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Surrounding QR Codes - Bottom */}
        <div className="flex justify-center gap-1 mt-1 flex-wrap">
          {surroundingQRs.slice(11, 16).map((qr) => (
            <div
              key={qr.position}
              className="flex flex-col items-center"
              title={`${qr.type === 'question' ? 'Question' : 'Powerup'} Tile ${qr.position}`}
            >
              <div className="w-10 h-10 border border-gray-300 rounded overflow-hidden">
                <QRCodeDisplay data={qr.data} size={40} />
              </div>
              <span className="text-[10px] text-gray-600 mt-0.5">
                {qr.type === 'question' ? '❓' : '⚡'}
              </span>
            </div>
          ))}
        </div>
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
          <div className="flex items-center gap-1">
            <span>❓</span>
            <span>Q</span>
          </div>
          <div className="flex items-center gap-1">
            <span>⚡</span>
            <span>P</span>
          </div>
        </div>
      </div>
    </div>
  );
}

