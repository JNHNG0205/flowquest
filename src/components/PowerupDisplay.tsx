'use client';

import { useState, useEffect } from 'react';
import type { PlayerPowerUp, PowerUp, PowerUpType } from '@/types/database.types';

interface PowerupDisplayProps {
  playerId: string;
  onUsePowerup?: (powerupId: string, powerupType: PowerUpType) => void;
  disabled?: boolean;
}

const powerupIcons: Record<PowerUpType, string> = {
  extra_time: '⏰',
  skip_question: '⏭️',
  double_points: '💎',
  hint: '💡',
  shield: '🛡️',
};

const powerupColors: Record<PowerUpType, string> = {
  extra_time: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  skip_question: 'bg-purple-100 border-purple-300 text-purple-800',
  double_points: 'bg-blue-100 border-blue-300 text-blue-800',
  hint: 'bg-green-100 border-green-300 text-green-800',
  shield: 'bg-red-100 border-red-300 text-red-800',
};

export function PowerupDisplay({ playerId, onUsePowerup, disabled = false }: PowerupDisplayProps) {
  const [powerups, setPowerups] = useState<(PlayerPowerUp & { powerup: PowerUp })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPowerups = async () => {
    try {
      const response = await fetch(`/api/powerups/player?playerId=${playerId}`);
      const data = await response.json();
      
      if (data.success) {
        setPowerups(data.data.powerups);
      }
    } catch (error) {
      console.error('Failed to fetch powerups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPowerups();
  }, [playerId]);

  const handleUsePowerup = async (powerupId: string, powerupType: PowerUpType) => {
    if (disabled) return;
    
    try {
      const response = await fetch('/api/powerups/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, powerupId }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh powerups list
        await fetchPowerups();
        
        // Notify parent component
        if (onUsePowerup) {
          onUsePowerup(powerupId, powerupType);
        }
      } else {
        alert(data.error || 'Failed to use powerup');
      }
    } catch (error) {
      console.error('Failed to use powerup:', error);
      alert('Failed to use powerup');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Powerups</h3>
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-bold text-gray-900 mb-3">
        Powerups ({powerups.length}/3)
      </h3>
      
      {powerups.length === 0 ? (
        <div className="text-gray-500 text-sm">
          No powerups yet. Scan tiles to collect them!
        </div>
      ) : (
        <div className="space-y-2">
          {powerups.map((playerPowerup) => {
            const powerup = playerPowerup.powerup;
            if (!powerup) return null;
            
            return (
              <div
                key={playerPowerup.player_powerup_id}
                className={`p-3 rounded-lg border-2 ${powerupColors[powerup.type]} transition-all ${
                  disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'
                }`}
                onClick={() => !disabled && handleUsePowerup(playerPowerup.player_powerup_id, powerup.type)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{powerupIcons[powerup.type]}</span>
                    <div>
                      <div className="font-semibold text-sm">{powerup.name}</div>
                      {powerup.description && (
                        <div className="text-xs opacity-75">{powerup.description}</div>
                      )}
                    </div>
                  </div>
                  {!disabled && (
                    <button
                      className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded hover:bg-opacity-75 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUsePowerup(playerPowerup.player_powerup_id, powerup.type);
                      }}
                    >
                      Use
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
