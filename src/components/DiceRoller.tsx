'use client';

import { useState } from 'react';

interface DiceRollerProps {
  onRoll: (value: number) => void;
  disabled?: boolean;
}

export function DiceRoller({ onRoll, disabled }: DiceRollerProps) {
  const [rolling, setRolling] = useState(false);
  const [value, setValue] = useState<number>(1);

  const rollDice = () => {
    if (disabled || rolling) return;

    setRolling(true);
    
    // Animate rolling
    let rolls = 0;
    const rollInterval = setInterval(() => {
      setValue(Math.floor(Math.random() * 6) + 1);
      rolls++;

      if (rolls >= 10) {
        clearInterval(rollInterval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setValue(finalValue);
        setRolling(false);
        onRoll(finalValue);
      }
    }, 100);
  };

  const diceFaces = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`relative w-24 h-24 bg-white rounded-xl shadow-lg border-4 border-gray-800 transition-transform ${
          rolling ? 'animate-spin' : ''
        }`}
      >
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-2">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`flex items-center justify-center ${
                diceFaces[value as keyof typeof diceFaces]?.includes(i)
                  ? 'visible'
                  : 'invisible'
              }`}
            >
              <div className="w-3 h-3 bg-red-600 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={rollDice}
        disabled={disabled || rolling}
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {rolling ? 'Rolling...' : 'Roll Dice'}
      </button>

      {value && !rolling && (
        <p className="text-lg font-semibold text-gray-900">
          You rolled: {value}
        </p>
      )}
    </div>
  );
}
