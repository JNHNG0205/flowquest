'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useGameRealtime, useQuizRealtime } from '@/hooks/useGameRealtime';
import { Scoreboard } from '@/components/Scoreboard';
import { DiceRoller } from '@/components/DiceRoller';
import { QuizQuestion } from '@/components/QuizQuestion';
import { QRScanner } from '@/components/QRScanner';
import { PowerupDisplay } from '@/components/PowerupDisplay';
import { PowerupModal } from '@/components/PowerupModal';
import { PowerupActivationModal } from '@/components/PowerupActivationModal';
import type { SessionPlayer, Question, PowerUpType, PowerUp} from '@/types/database.types';

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
  const [showPowerupModal, setShowPowerupModal] = useState(false);
  const [powerupModalData, setPowerupModalData] = useState<{
    powerup: PowerUp | null;
    message: string;
  } | null>(null);
  const [powerupRefreshTrigger, setPowerupRefreshTrigger] = useState(0);
  const [showPowerupActivationModal, setShowPowerupActivationModal] = useState(false);
  const [powerupActivationData, setPowerupActivationData] = useState<{
    powerupType: string;
    message: string;
  } | null>(null);
  // Powerup effect states
  const [activePowerups, setActivePowerups] = useState<{
    extraTime?: boolean;
    skipQuestion?: boolean;
    doublePoints?: boolean;
    hint?: boolean;
    shield?: boolean;
  }>({});
  // Game flow states
  const [gamePhase, setGamePhase] = useState<'dice' | 'question' | 'answering' | 'results' | 'waiting'>('dice');
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [myResult, setMyResult] = useState<{ 
    correct?: boolean;
    is_correct?: boolean; 
    pointsEarned?: number;
    points_earned?: number; 
    correctAnswer?: string;
    correct_answer?: string;
    explanation?: string;
  } | null>(null);
  const [renderKey, setRenderKey] = useState(0); // Force re-render key
  
  // Track previous turn/player to detect changes
  const prevTurnRef = useRef<number | null>(null);
  const prevPlayerIndexRef = useRef<number | null>(null);
  const lastQuestionIdRef = useRef<string | null>(null);
  const resultsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Update question from realtime - Phase 2: Question Phase
  useEffect(() => {
    if (realtimeQuestion) {
      const roomQuestion = realtimeQuestion as any;
      
      // Check if this is a nested structure (from realtime) or flat (from API)
      if (roomQuestion.question) {
        // Nested structure from realtime - flatten it
        let options = roomQuestion.question.options;
        
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
        
        setCurrentQuestion(flattenedQuestion as CurrentQuestion);
        lastQuestionIdRef.current = roomQuestion.room_question_id;
      } else {
        // Already flat structure
        setCurrentQuestion(roomQuestion as CurrentQuestion);
        lastQuestionIdRef.current = roomQuestion.room_question_id;
      }
      
      // Transition to question phase - show question to ALL players
      setGamePhase('question');
      setDiceValue(null);
      setHasAnswered(false);
      setMyResult(null);
    }
  }, [realtimeQuestion]);

  // Reset UI when turn changes - Phase 1: Dice Phase
  useEffect(() => {
    if (!session) return;
    
    const currentTurn = session.current_turn;
    const currentPlayerIndex = session.current_player_index;
    
    // Check if turn or player actually changed
    const turnChanged = prevTurnRef.current !== null && prevTurnRef.current !== currentTurn;
    const playerChanged = prevPlayerIndexRef.current !== null && prevPlayerIndexRef.current !== currentPlayerIndex;
    
    if (turnChanged || playerChanged) {
      // Clear any existing results timeout
      if (resultsTimeoutRef.current) {
        clearTimeout(resultsTimeoutRef.current);
        resultsTimeoutRef.current = null;
      }
      
      // If we're in answering phase and have a result, show results first
      if (gamePhase === 'answering' && hasAnswered && myResult) {
        setGamePhase('results');
        
        // Show results for 2 seconds, then advance to next turn
        resultsTimeoutRef.current = setTimeout(() => {
          setGamePhase('dice');
          setCurrentQuestion(null);
          setHasAnswered(false);
          setMyResult(null);
          setDiceValue(null);
          lastQuestionIdRef.current = null;
          
          // Force React to re-render by updating render key
          setRenderKey(prev => prev + 1);
          resultsTimeoutRef.current = null;
        }, 2000); // Show results for 2 seconds
        
        return () => {
          if (resultsTimeoutRef.current) {
            clearTimeout(resultsTimeoutRef.current);
            resultsTimeoutRef.current = null;
          }
        };
      } else if (gamePhase === 'results') {
        // If we're already in results phase, show results for 2 seconds before advancing
        resultsTimeoutRef.current = setTimeout(() => {
          setGamePhase('dice');
          setCurrentQuestion(null);
          setHasAnswered(false);
          setMyResult(null);
          setDiceValue(null);
          lastQuestionIdRef.current = null;
          
          // Force React to re-render by updating render key
          setRenderKey(prev => prev + 1);
          resultsTimeoutRef.current = null;
        }, 2000); // Show results for 2 seconds
        
        return () => {
          if (resultsTimeoutRef.current) {
            clearTimeout(resultsTimeoutRef.current);
            resultsTimeoutRef.current = null;
          }
        };
      } else {
        // Reset to dice phase for new turn
        setGamePhase('dice');
        setCurrentQuestion(null);
        setHasAnswered(false);
        setMyResult(null);
        setDiceValue(null);
        lastQuestionIdRef.current = null;
        
        // Force React to re-render by updating render key
        setRenderKey(prev => prev + 1);
      }
    }
    
    // Update refs
    prevTurnRef.current = currentTurn ?? null;
    prevPlayerIndexRef.current = currentPlayerIndex ?? null;
  }, [session?.current_turn, session?.current_player_index]);

  // Show results phase when all players have answered (detected by turn change)
  useEffect(() => {
    if (gamePhase === 'answering' && hasAnswered && myResult) {
      // We're waiting for other players to finish
      // The turn change will trigger when all players have answered
      // and the turn change effect will handle showing results
    }
  }, [gamePhase, hasAnswered, myResult]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resultsTimeoutRef.current) {
        clearTimeout(resultsTimeoutRef.current);
      }
    };
  }, []);

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
      let tileType = 'question'; // Default to question tile
      try {
        const parsedData = JSON.parse(data);
        tilePosition = parsedData.position || parsedData.tile || tilePosition;
        tileType = parsedData.type || 'question'; // Get tile type from QR data
      } catch {
        // If not JSON, try to parse as number
        const num = parseInt(data.replace(/\D/g, ''));
        if (!isNaN(num)) {
          tilePosition = num;
        }
      }

      // Determine if this tile gives a powerup or question based on QR data
      const isPowerupTile = tileType === 'powerup';

      if (isPowerupTile) {
        // Try to get a powerup
        try {
          const powerupResponse = await fetch('/api/powerups/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              playerId: currentPlayer.room_player_id,
              tileData: data,
            }),
          });

          const powerupResult = await powerupResponse.json();

          if (powerupResult.success) {
            // Trigger powerup display refresh
            setPowerupRefreshTrigger(prev => prev + 1);
            
            // Show powerup modal
            setPowerupModalData({
              powerup: powerupResult.data.powerup,
              message: powerupResult.data.message
            });
            setShowPowerupModal(true);
            
            // Advance to next turn after getting powerup
            setTimeout(async () => {
              try {
                const response = await fetch('/api/game/next-turn', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sessionId: session.room_id,
                  }),
                });

                if (!response.ok) {
                  throw new Error('Failed to advance turn');
                }
              } catch (error) {
                console.error('Next turn error:', error);
              }
            }, 1000); // Small delay to ensure powerup is processed
            
            return;
          } else {
            // If powerup failed (e.g., player has max powerups), fall back to question
            console.log('Powerup scan failed, falling back to question:', powerupResult.error);
          }
        } catch (powerupError) {
          // If powerup API fails, fall back to question
          console.log('Powerup scan error, falling back to question:', powerupError);
        }
      }

      // Fetch question (either as primary choice or fallback)
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
          powerupEffects: {
            doublePoints: activePowerups.doublePoints || false,
            shield: activePowerups.shield || false,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit answer');
      }

      // Store my result and transition to answering phase (waiting for others)
      setMyResult(result.data);
      setHasAnswered(true);
      
      // Check if all players have answered
      if (result.data.all_answered) {
        // All players have answered, show results immediately
        setGamePhase('results');
        
        // Clear any existing timeout
        if (resultsTimeoutRef.current) {
          clearTimeout(resultsTimeoutRef.current);
        }
        
        // Set a timeout to advance to next turn after showing results
        resultsTimeoutRef.current = setTimeout(() => {
          setGamePhase('dice');
          setCurrentQuestion(null);
          setHasAnswered(false);
          setMyResult(null);
          setDiceValue(null);
          lastQuestionIdRef.current = null;
          
          // Force React to re-render by updating render key
          setRenderKey(prev => prev + 1);
          resultsTimeoutRef.current = null;
        }, 2000); // Show results for 2 seconds
      } else {
        // Still waiting for other players
        setGamePhase('answering');
      }

      // The API will automatically advance the turn when all players answer
      // The results phase will be triggered by the turn change
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
      setGamePhase('dice');
      setMyResult(null);
    } catch (error) {
      console.error('Advance turn error:', error);
    }
  };

  const handleUsePowerup = async (powerupId: string, powerupType: PowerUpType) => {
    // Activate powerup effect
    setActivePowerups(prev => ({
      ...prev,
      [powerupType === 'extra_time' ? 'extraTime' :
       powerupType === 'skip_question' ? 'skipQuestion' :
       powerupType === 'double_points' ? 'doublePoints' :
       powerupType === 'hint' ? 'hint' :
       powerupType === 'shield' ? 'shield' : 'extraTime']: true
    }));

    // Handle special powerup effects
    if (powerupType === 'skip_question' && gamePhase === 'question' && !hasAnswered) {
      // Skip question = auto correct with points
      try {
        const response = await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionQuestionId: currentQuestion?.room_question_id || currentQuestion?.question_id,
            playerId: currentPlayer?.room_player_id,
            answer: 'SKIPPED_WITH_POWERUP',
            timeTaken: 1, // Minimal time for skip
            powerupEffects: {
              doublePoints: activePowerups.doublePoints || false,
              shield: false, // Skip question doesn't need shield
            },
          }),
        });

        if (response.ok) {
          const result = await response.json();
          // Store the result and transition to answering phase
          setMyResult(result.data);
          setHasAnswered(true);
          setGamePhase('answering');
          
          // Clear the skip question effect since it's been used
          clearPowerupEffect('skip_question');
          alert('⏭️ Question skipped with powerup! You got points for the correct answer.');
          return;
        }
      } catch (error) {
        console.error('Skip question error:', error);
      }
    }

    // Show activation modal
    const messages = {
      extra_time: '⏰ Extra Time activated! +10 seconds on the current question.',
      skip_question: '⏭️ Skip Question activated! You can skip the current question and get full points.',
      double_points: '💎 Double Points activated! Your answer to this question will give double points.',
      hint: '💡 Hint activated! You\'ll get a hint for the current question.',
      shield: '🛡️ Shield activated! Your answer to this question won\'t count against you if wrong.'
    };
    
    setPowerupActivationData({
      powerupType,
      message: messages[powerupType] || 'Powerup activated!'
    });
    setShowPowerupActivationModal(true);
    
    // Trigger immediate refresh of powerup display
    setPowerupRefreshTrigger(prev => prev + 1);
  };

  const handleClosePowerupModal = () => {
    setShowPowerupModal(false);
    setPowerupModalData(null);
  };

  const handleClosePowerupActivationModal = () => {
    setShowPowerupActivationModal(false);
    setPowerupActivationData(null);
  };

  // Clear powerup effects after they're used
  const clearPowerupEffect = (powerupType: PowerUpType) => {
    setActivePowerups(prev => ({
      ...prev,
      [powerupType === 'extra_time' ? 'extraTime' :
       powerupType === 'skip_question' ? 'skipQuestion' :
       powerupType === 'double_points' ? 'doublePoints' :
       powerupType === 'hint' ? 'hint' :
       powerupType === 'shield' ? 'shield' : 'extraTime']: false
    }));
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
                <div>Game Phase: {gamePhase}</div>
                <div>Has Question: {currentQuestion ? 'Yes' : 'No'}</div>
                <div>Has Answered: {hasAnswered ? 'Yes' : 'No'}</div>
                <div>Is My Turn: {isMyTurn() ? 'Yes' : 'No'}</div>
                <div>My Result: {myResult ? 'Yes' : 'No'}</div>
                <div>Current Turn: {session?.current_turn}</div>
                <div>Current Player Index: {session?.current_player_index}</div>
              </div>
            )}

            {/* Phase 1: Dice Roll Phase */}
            {gamePhase === 'dice' && isMyTurn() && (
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

            {/* Phase 1: Waiting for current player to roll dice */}
            {gamePhase === 'dice' && !isMyTurn() && (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="animate-pulse text-4xl mb-4">⏳</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Waiting for Player {((session.current_player_index || 0) + 1)}&apos;s turn
                </h2>
                <p className="text-gray-600">It&apos;s their turn to roll the dice</p>
              </div>
            )}

            {/* Phase 2: Question Phase - Show question to ALL players */}
            {gamePhase === 'question' && currentQuestion && !hasAnswered && (
              <div className="space-y-6">
                {/* Powerup Display for All Players */}
                <div className="flex justify-center">
                  <div className="bg-white rounded-lg shadow-lg p-4 max-w-md w-full">
                    <PowerupDisplay 
                      playerId={currentPlayer.room_player_id}
                      onUsePowerup={handleUsePowerup}
                      disabled={false}
                      refreshTrigger={powerupRefreshTrigger}
                    />
                  </div>
                </div>
                
                {/* Question */}
                <div className="flex justify-center">
                  <QuizQuestion
                    question={currentQuestion}
                    timeLimit={currentQuestion.time_limit + (activePowerups.extraTime ? 10 : 0)}
                    onSubmit={handleSubmitAnswer}
                    disabled={false} // All players can answer
                    activePowerups={activePowerups}
                    onClearPowerup={clearPowerupEffect}
                  />
                </div>
              </div>
            )}

            {/* Phase 3: Answering Phase - Waiting for other players to finish */}
            {gamePhase === 'answering' && hasAnswered && (
              <div className="bg-blue-50 rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-6xl mb-4 animate-pulse">⏳</div>
                  <h2 className="text-2xl font-bold text-blue-900 mb-2">
                    Waiting for other players...
                  </h2>
                  <p className="text-blue-700">
                    You submitted your answer! Waiting for everyone else to finish.
                  </p>
                  {myResult && (
                    <div className="mt-4 p-4 bg-white rounded-lg">
                      <p className="text-sm text-gray-600">Your score:</p>
                      <p className="text-2xl font-bold text-blue-900">
                        +{myResult.points_earned || myResult.pointsEarned || 0} points
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Phase 4: Results Phase - Show results to ALL players for 2 seconds */}
            {gamePhase === 'results' && myResult && (
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className={`text-6xl mb-4 ${myResult.is_correct || myResult.correct ? 'text-green-500' : 'text-red-500'}`}>
                    {myResult.is_correct || myResult.correct ? '✅' : '❌'}
                  </div>
                  <h2 className={`text-2xl font-bold mb-2 ${myResult.is_correct || myResult.correct ? 'text-green-900' : 'text-red-900'}`}>
                    {myResult.is_correct || myResult.correct ? 'Correct!' : 'Incorrect'}
                  </h2>
                  <p className="text-gray-700 mb-4">
                    {myResult.is_correct || myResult.correct 
                      ? `You earned ${myResult.points_earned || myResult.pointsEarned || 0} points!`
                      : `The correct answer was: ${myResult.correct_answer || myResult.correctAnswer}`
                    }
                  </p>
                  <div className="animate-pulse text-sm text-gray-500">
                    Showing results for 2 seconds...
                  </div>
                </div>
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

      {/* Powerup Modal */}
      {showPowerupModal && powerupModalData && (
        <PowerupModal
          isOpen={showPowerupModal}
          onClose={handleClosePowerupModal}
          powerup={powerupModalData.powerup}
          message={powerupModalData.message}
        />
      )}

      {/* Powerup Activation Modal */}
      {showPowerupActivationModal && powerupActivationData && (
        <PowerupActivationModal
          isOpen={showPowerupActivationModal}
          onClose={handleClosePowerupActivationModal}
          powerupType={powerupActivationData.powerupType}
          message={powerupActivationData.message}
        />
      )}
    </div>
  );
}
