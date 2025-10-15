'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [renderKey, setRenderKey] = useState(0); // Force re-render key
  
  // Track previous turn/player to detect changes
  const prevTurnRef = useRef<number | null>(null);
  const prevPlayerIndexRef = useRef<number | null>(null);
  const lastQuestionIdRef = useRef<string | null>(null);

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
      console.log('📩 Received realtime question:', realtimeQuestion);
      console.log('📩 Current session state:', { turn: session?.current_turn, playerIndex: session?.current_player_index });
      
      const roomQuestion = realtimeQuestion as any;
      
      // Check if this is a nested structure (from realtime) or flat (from API)
      if (roomQuestion.question) {
        // Nested structure from realtime - flatten it
        let options = roomQuestion.question.options;
        console.log('Question options before parsing:', options);
        
        if (typeof options === 'string') {
          try {
            options = JSON.parse(options);
          } catch (e) {
            console.error('Failed to parse options:', e);
            options = [];
          }
        }
        
        // Flatten the structure to match CurrentQuestion interface
        const flattenedQuestion = {
          ...roomQuestion.question,
          options: options || [],
          room_question_id: roomQuestion.room_question_id,
          time_limit: roomQuestion.time_limit || 60,
        };
        
        console.log('Flattened question:', flattenedQuestion);
        console.log('🎯 SETTING NEW QUESTION - clearing results and answer states');
        setCurrentQuestion(flattenedQuestion as CurrentQuestion);
        lastQuestionIdRef.current = roomQuestion.room_question_id; // Track question ID
      } else {
        // Already flat structure
        console.log('🎯 SETTING NEW QUESTION - clearing results and answer states');
        setCurrentQuestion(roomQuestion as CurrentQuestion);
        lastQuestionIdRef.current = roomQuestion.room_question_id; // Track question ID
      }
      
      // IMPORTANT: Clear results when new question arrives
      console.log('🧹 Clearing results/answers for NEW question');
      setShowResults(false);
      setDiceValue(null);
      setHasAnswered(false); // Reset for new question
      setWaitingForOthers(false);
      setLastResult(null); // Clear previous results
    }
  }, [realtimeQuestion, session?.current_turn, session?.current_player_index]);

  // Reset UI when turn changes (all players have answered and turn advanced)
  useEffect(() => {
    if (!session) return;
    
    const currentTurn = session.current_turn;
    const currentPlayerIndex = session.current_player_index;
    
    console.log('🔄 Session updated - Current turn:', currentTurn, 'Player index:', currentPlayerIndex);
    
    // Check if turn or player actually changed
    const turnChanged = prevTurnRef.current !== null && prevTurnRef.current !== currentTurn;
    const playerChanged = prevPlayerIndexRef.current !== null && prevPlayerIndexRef.current !== currentPlayerIndex;
    
    console.log('🔍 Change detection:', { 
      turnChanged, 
      playerChanged,
      prevTurn: prevTurnRef.current,
      currentTurn,
      prevPlayerIndex: prevPlayerIndexRef.current,
      currentPlayerIndex 
    });
    
    if (turnChanged || playerChanged) {
      console.log('✅✅✅ TURN/PLAYER CHANGED - CLEARING ALL STATE NOW ✅✅✅');
      
      // Clear everything - fresh start for the new turn
      setCurrentQuestion(null);
      setShowResults(false);
      setLastResult(null);
      setHasAnswered(false);
      setWaitingForOthers(false);
      setDiceValue(null);
      lastQuestionIdRef.current = null;
      
      // Force React to re-render by updating render key
      setRenderKey(prev => prev + 1);
      
      console.log('State cleared - showResults set to FALSE, currentQuestion set to NULL');
    }
    
    // Update refs
    prevTurnRef.current = currentTurn ?? null;
    prevPlayerIndexRef.current = currentPlayerIndex ?? null;
  }, [session?.current_turn, session?.current_player_index]);

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

  const leaveRoom = async () => {
    if (!session || !confirm('Are you sure you want to leave the game? You cannot rejoin after leaving.')) {
      return;
    }

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
      alert(err instanceof Error ? err.message : 'Failed to leave room');
      setLoading(false);
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
          <div className="lg:col-span-2 space-y-6" key={renderKey}>
            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-800 text-white p-4 rounded text-xs space-y-1">
                <div className="font-bold text-green-400">Render Key: {renderKey}</div>
                <div>Has Question: {currentQuestion ? 'Yes' : 'No'}</div>
                <div>Show Results: {showResults ? 'Yes' : 'No'}</div>
                <div>Has Answered: {hasAnswered ? 'Yes' : 'No'}</div>
                <div>Waiting: {waitingForOthers ? 'Yes' : 'No'}</div>
                <div>Is My Turn: {isMyTurn() ? 'Yes' : 'No'}</div>
                <div>Last Result: {lastResult ? 'Yes' : 'No'}</div>
                <div className="pt-2 border-t border-gray-600 mt-2">
                  <div>Condition 1 (Question): {currentQuestion && !hasAnswered ? '✅ YES' : '❌ NO'}</div>
                  <div>Condition 2 (Waiting): {hasAnswered && waitingForOthers && !currentQuestion ? '✅ YES' : '❌ NO'}</div>
                  <div>Condition 3 (Dice): {!currentQuestion && !hasAnswered && !waitingForOthers && isMyTurn() ? '✅ YES' : '❌ NO'}</div>
                  <div>Condition 4 (Wait Turn): {!currentQuestion && !hasAnswered && !waitingForOthers && !isMyTurn() ? '✅ YES' : '❌ NO'}</div>
                </div>
              </div>
            )}

            {/* Priority 1: Show question if available and player hasn't answered */}
            {currentQuestion && !hasAnswered && (
              <div className="flex justify-center">
                <QuizQuestion
                  question={currentQuestion}
                  timeLimit={currentQuestion.time_limit}
                  onSubmit={handleSubmitAnswer}
                  disabled={false} // All players can answer
                />
              </div>
            )}

            {/* Priority 2: Show waiting screen if answered but waiting for others */}
            {hasAnswered && waitingForOthers && !currentQuestion && (
              <div className="bg-blue-50 rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-6xl mb-4 animate-pulse">⏳</div>
                  <h2 className="text-2xl font-bold text-blue-900 mb-2">
                    Waiting for other players...
                  </h2>
                  <p className="text-blue-700">
                    You submitted your answer! Waiting for everyone else to finish.
                  </p>
                  {lastResult && (
                    <div className="mt-4 p-4 bg-white rounded-lg">
                      <p className="text-sm text-gray-600">Your score:</p>
                      <p className="text-2xl font-bold text-blue-900">
                        +{lastResult.points_earned || lastResult.pointsEarned || 0} points
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Priority 3: Show dice roller if it's player's turn and no question */}
            {!currentQuestion && !hasAnswered && !waitingForOthers && isMyTurn() && (
              <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Your Turn - Roll the Dice!
                </h2>
                <DiceRoller
                  onRoll={handleDiceRoll}
                  disabled={loading}
                />
                {diceValue && (
                  <p className="mt-4 text-gray-700">
                    You rolled {diceValue}! Move forward {diceValue} spaces
                  </p>
                )}
              </div>
            )}

            {/* Priority 4: Show waiting screen if not player's turn */}
            {!currentQuestion && !hasAnswered && !waitingForOthers && !isMyTurn() && (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="animate-pulse text-4xl mb-4">⏳</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Waiting for Player {((session.current_player_index || 0) + 1)}&apos;s turn
                </h2>
                <p className="text-gray-600">It&apos;s their turn to roll the dice</p>
              </div>
            )}

            {/* Fallback: Show if nothing else matches */}
            {!currentQuestion && 
             !(hasAnswered && waitingForOthers) && 
             !((!hasAnswered && !waitingForOthers && isMyTurn())) && 
             !((!hasAnswered && !waitingForOthers && !isMyTurn())) && (
              <div className="bg-yellow-50 rounded-lg shadow-lg p-8 text-center">
                <div className="text-4xl mb-4">🤔</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Loading game state...
                </h2>
                <p className="text-gray-600 text-sm">Check debug panel above</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Scoreboard players={players} currentPlayerId={currentPlayer.room_player_id} />
            
            {session.status === 'in_progress' && (
              <button
                onClick={leaveRoom}
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Leaving...' : 'Leave Game'}
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
