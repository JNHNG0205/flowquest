'use client';

import { useState, useEffect } from 'react';
import type { Question, PowerUpType } from '@/types/database.types';

interface QuizQuestionProps {
  question: Question;
  timeLimit: number;
  onSubmit: (answer: string, timeTaken: number) => void;
  disabled?: boolean;
  activePowerups?: {
    extraTime?: boolean;
    skipQuestion?: boolean;
    doublePoints?: boolean;
    hint?: boolean;
    shield?: boolean;
  };
  onClearPowerup?: (powerupType: PowerUpType) => void;
}

export function QuizQuestion({ question, timeLimit, onSubmit, disabled, activePowerups, onClearPowerup }: QuizQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [submitted, setSubmitted] = useState(false);
  const [startTime] = useState(Date.now());
  const [showHint, setShowHint] = useState(false);
  const [currentTimeLimit, setCurrentTimeLimit] = useState(timeLimit);

  // Ensure options is an array
  const options = Array.isArray(question.options) 
    ? question.options 
    : typeof question.options === 'string' 
    ? JSON.parse(question.options) 
    : [];

  // Handle extra time powerup
  useEffect(() => {
    if (activePowerups?.extraTime && !submitted) {
      const extraTime = 10;
      setCurrentTimeLimit(prev => prev + extraTime);
      setTimeLeft(prev => prev + extraTime);
    }
  }, [activePowerups?.extraTime, submitted]);

  useEffect(() => {
    if (submitted || disabled) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(''); // Auto-submit on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submitted, disabled]);

  const handleSubmit = (answer: string) => {
    if (submitted || disabled) return;
    setSubmitted(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    
    // Clear powerup effects after use
    if (activePowerups?.extraTime && onClearPowerup) {
      onClearPowerup('extra_time');
    }
    if (activePowerups?.doublePoints && onClearPowerup) {
      onClearPowerup('double_points');
    }
    if (activePowerups?.shield && onClearPowerup) {
      onClearPowerup('shield');
    }
    if (activePowerups?.hint && onClearPowerup) {
      onClearPowerup('hint');
    }
    
    onSubmit(answer, timeTaken);
  };

  const progressPercentage = (timeLeft / currentTimeLimit) * 100;
  const isUrgent = timeLeft <= 10;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
      {/* Timer */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Time Remaining</span>
          <span
            className={`text-2xl font-bold ${
              isUrgent ? 'text-red-600 animate-pulse' : 'text-blue-600'
            }`}
          >
            {timeLeft}s
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              isUrgent ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Active Powerups */}
      {activePowerups && Object.values(activePowerups).some(Boolean) && (
        <div className="mb-4 p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
          <div className="flex items-center justify-center gap-3">
            <span className="text-sm font-semibold text-purple-800">Active Powerups:</span>
            {activePowerups.extraTime && (
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                ⏰ +10s
              </span>
            )}
            {activePowerups.doublePoints && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                💎 2x Points
              </span>
            )}
            {activePowerups.shield && (
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                🛡️ Shield
              </span>
            )}
            {activePowerups.hint && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                💡 Hint
              </span>
            )}
          </div>
        </div>
      )}

      {/* Difficulty Badge */}
      <div className="mb-4">
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            question.difficulty === 'easy'
              ? 'bg-green-100 text-green-800'
              : question.difficulty === 'medium'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {(question.difficulty || 'medium').toUpperCase()}
        </span>
      </div>

      {/* Question */}
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4 text-gray-900">
          {question.question_text}
        </h3>
        
        {/* Hint Button */}
        {activePowerups?.hint && !showHint && (
          <button
            onClick={() => setShowHint(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            💡 Use Hint
          </button>
        )}
        
        {/* Hint Display */}
        {showHint && question.explanation && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-green-600 text-lg">💡</span>
              <div>
                <h4 className="font-semibold text-green-800 mb-1">Hint:</h4>
                <p className="text-green-700 text-sm">{question.explanation}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {options.map((option: string, index: number) => (
          <button
            key={index}
            onClick={() => {
              if (!submitted && !disabled) {
                setSelectedAnswer(option);
              }
            }}
            disabled={submitted || disabled}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selectedAnswer === option
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white hover:border-blue-300'
            } ${
              submitted || disabled
                ? 'cursor-not-allowed opacity-60'
                : 'cursor-pointer'
            }`}
          >
            <span className="font-medium text-gray-900">{option}</span>
          </button>
        ))}
      </div>

      {/* Submit Button */}
      <button
        onClick={() => handleSubmit(selectedAnswer)}
        disabled={!selectedAnswer || submitted || disabled}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {submitted ? 'Submitted' : 'Submit Answer'}
      </button>
    </div>
  );
}
