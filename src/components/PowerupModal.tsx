'use client';

import { useEffect, useState } from 'react';

interface PowerupModalProps {
  isOpen: boolean;
  onClose: () => void;
  powerup: {
    name: string;
    description: string | null;
    type: string;
  } | null;
  message: string;
}

export function PowerupModal({ isOpen, onClose, powerup, message }: PowerupModalProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true);
      // Auto close after 3 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowAnimation(false);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getPowerupIcon = (type: string) => {
    switch (type) {
      case 'extra_time': return '⏰';
      case 'skip_question': return '⏭️';
      case 'double_points': return '💎';
      case 'hint': return '💡';
      case 'shield': return '🛡️';
      default: return '✨';
    }
  };

  const getPowerupColor = (type: string) => {
    switch (type) {
      case 'extra_time': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'skip_question': return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'double_points': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'hint': return 'bg-green-100 border-green-300 text-green-800';
      case 'shield': return 'bg-red-100 border-red-300 text-red-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div 
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-500 ${
          showAnimation ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-2xl text-center">
          <div className="text-6xl mb-2 animate-bounce">
            🎉
          </div>
          <h2 className="text-2xl font-bold">Powerup Found!</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {powerup && (
            <div className={`p-4 rounded-xl border-2 mb-4 ${getPowerupColor(powerup.type)}`}>
              <div className="flex items-center justify-center mb-3">
                <span className="text-4xl mr-3">{getPowerupIcon(powerup.type)}</span>
                <div>
                  <h3 className="text-xl font-bold">{powerup.name}</h3>
                  {powerup.description && (
                    <p className="text-sm opacity-75 mt-1">{powerup.description}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <p className="text-gray-700 text-lg mb-4">{message}</p>
            <div className="text-sm text-gray-500">
              <p>✨ You can hold up to 3 powerups at once</p>
              <p>🎯 Use them strategically during your turn!</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl">
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Awesome! 🚀
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            This modal will close automatically in a few seconds
          </p>
        </div>
      </div>
    </div>
  );
}
