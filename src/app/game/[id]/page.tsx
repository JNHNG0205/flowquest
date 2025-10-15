'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useGameRealtime, useQuizRealtime } from '@/hooks/useGameRealtime';
import { Scoreboard } from '@/components/Scoreboard';
import { DiceRoller } from '@/components/DiceRoller';
import { QuizQuestion } from '@/components/QuizQuestion';
import { QRScanner } from '@/components/QRScanner';
import type { SessionPlayer, Question} from '@/types/database.types';

interface CurrentQuestion extends Question {
  room_question_id?: string;
  time_limit: number;
}

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<SessionPlayer | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [lastResult, setLastResult] = useState<{ 
    correct?: boolean;
    is_correct?: boolean; 
    pointsEarned?: number;
    points_earned?: number; 
    correctAnswer?: string;
    correct_answer?: string;
    explanation?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [waitingForOthers, setWaitingForOthers] = useState(false);

  const { session, players } = useGameRealtime(sessionId);
  const { currentQuestion: realtimeQuestion } = useQuizRealtime(sessionId);

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

  // Update question from realtime
  useEffect(() => {
    if (realtimeQuestion) {
      setCurrentQuestion(realtimeQuestion as CurrentQuestion);
      setShowResults(false);
      setDiceValue(null);
      setHasAnswered(false); // Reset for new question
      setWaitingForOthers(false);
    }
  }, [realtimeQuestion]);

  const isMyTurn = () => {
    if (!session || !currentPlayer || !players.length) return false;
    const activePlayer = players[session.current_player_index || 0];
    return activePlayer?.room_player_id === currentPlayer.room_player_id;
  };

  const handleDiceRoll = async (value: number) => {
    setDiceValue(value);

    if (!currentPlayer) return;

    try {
      // Update position
      const newPosition = (currentPlayer.position || 0) + value;
      
      const response = await fetch('/api/game/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: currentPlayer.room_player_id,
          position: newPosition,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update position');
      }

      // Show scanner to scan tile
      setTimeout(() => {
        setShowScanner(true);
      }, 1000);
    } catch (error) {
      console.error('Move error:', error);
      alert('Failed to update position');
    }
  };

  const handleTileScan = async (data: string) => {
    setShowScanner(false);

    if (!session || !currentPlayer) return;

    try {
      setLoading(true);

      // Parse tile data (assuming format: "tile:position" or just position number)
      let tilePosition = currentPlayer.position || 0;
      try {
        const parsedData = JSON.parse(data);
        tilePosition = parsedData.position || parsedData.tile || tilePosition;
      } catch {
        // If not JSON, try to parse as number
        const num = parseInt(data.replace(/\D/g, ''));
        if (!isNaN(num)) {
          tilePosition = num;
        }
      }

      // Fetch question
      const response = await fetch('/api/quiz/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.room_id,
          roundNumber: session.current_turn || 0,
          tilePosition,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch question');
      }

      // result.data contains {session_question, question, time_limit}
      // Combine question with metadata
      const questionData = {
        ...result.data.question,
        room_question_id: result.data.session_question.room_question_id,
        time_limit: result.data.time_limit,
      };
      
      setCurrentQuestion(questionData);
    } catch (error) {
      console.error('Tile scan error:', error);
      alert(error instanceof Error ? error.message : 'Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (answer: string, timeTaken: number) => {
    if (!currentQuestion || !currentPlayer) return;

    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionQuestionId: currentQuestion.room_question_id || currentQuestion.question_id,
          playerId: currentPlayer.room_player_id,
          answer,
          timeTaken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit answer');
      }

      setLastResult(result.data);
      setShowResults(true);
      setHasAnswered(true);

      // Check if waiting for other players
      if (!result.data.all_answered) {
        setWaitingForOthers(true);
      }

      // Turn will advance automatically when all players answer (handled by API)
      // No need to call advanceTurn manually
    } catch (error) {
      console.error('Submit answer error:', error);
      alert('Failed to submit answer');
    }
  };

  const advanceTurn = async () => {
    if (!session) return;

    try {
      const response = await fetch('/api/game/next-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.room_id }),
      });

      if (!response.ok) {
        throw new Error('Failed to advance turn');
      }

      setCurrentQuestion(null);
      setShowResults(false);
      setLastResult(null);
    } catch (error) {
      console.error('Advance turn error:', error);
    }
  };

  if (!session || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-4">
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">FlowQuest</h1>
          <div className="text-white/90">
            Round {(session.current_turn || 0) + 1} - Player {((session.current_player_index || 0) + 1)}&apos;s turn
            {isMyTurn() && <span className="ml-2 font-bold">(Your Turn!)</span>}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Question - Show to ALL players */}
            {currentQuestion && !showResults && !hasAnswered && (
              <div className="flex justify-center">
                <QuizQuestion
                  question={currentQuestion}
                  timeLimit={currentQuestion.time_limit}
                  onSubmit={handleSubmitAnswer}
                  disabled={false} // All players can answer
                />
              </div>
            )}

            {/* Waiting for other players */}
            {waitingForOthers && showResults && (
              <div className="bg-blue-50 rounded-lg shadow-lg p-8 max-w-2xl mx-auto mb-6">
                <div className="text-center">
                  <div className="text-6xl mb-4 animate-pulse">⏳</div>
                  <h2 className="text-2xl font-bold text-blue-900 mb-2">
                    Waiting for other players...
                  </h2>
                  <p className="text-blue-700">
                    You submitted your answer! Waiting for everyone else to finish.
                  </p>
                </div>
              </div>
            )}

            {/* Results */}
            {showResults && lastResult && (
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div
                    className={`text-6xl mb-4 ${
                      (lastResult.is_correct || lastResult.correct) ? '🎉' : '😞'
                    }`}
                  >
                    {(lastResult.is_correct || lastResult.correct) ? '🎉' : '😞'}
                  </div>
                  <h2
                    className={`text-3xl font-bold mb-2 ${
                      (lastResult.is_correct || lastResult.correct) ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {(lastResult.is_correct || lastResult.correct) ? 'Correct!' : 'Incorrect'}
                  </h2>
                  <p className="text-2xl text-gray-900 mb-4">
                    +{lastResult.points_earned || lastResult.pointsEarned || 0} points
                  </p>
                  {!(lastResult.is_correct || lastResult.correct) && (
                    <p className="text-gray-700 mb-2">
                      Correct answer: <strong>{lastResult.correct_answer || lastResult.correctAnswer}</strong>
                    </p>
                  )}
                  {lastResult.explanation && (
                    <p className="text-gray-600 text-sm">{lastResult.explanation}</p>
                  )}
                </div>
              </div>
            )}

            {/* Dice Roller */}
            {!currentQuestion && !showResults && isMyTurn() && (
              <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Roll the Dice!
                </h2>
                <DiceRoller
                  onRoll={handleDiceRoll}
                  disabled={loading}
                />
                {diceValue && (
                  <p className="mt-4 text-gray-700">
                    Move forward {diceValue} spaces
                  </p>
                )}
              </div>
            )}

            {/* Waiting */}
            {!currentQuestion && !showResults && !isMyTurn() && (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="animate-pulse text-4xl mb-4">⏳</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Waiting for Player {((session.current_player_index || 0) + 1)}&apos;s turn
                </h2>
                <p className="text-gray-600">It&apos;s their turn to play</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Scoreboard players={players} currentPlayerId={currentPlayer.room_player_id} />
            
            {session.status === 'in_progress' && (
              <button
                onClick={() => router.push('/')}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Leave Game
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleTileScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
