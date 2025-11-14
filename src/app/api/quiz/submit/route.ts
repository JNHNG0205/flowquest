import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { submitAnswer } from '@/lib/database';

/**
 * POST /api/quiz/submit
 * Submit an answer to a question
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient(cookies());
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionQuestionId, playerId, answer, timeTaken, powerupEffects } = body;

    if (!sessionQuestionId || !playerId || answer === undefined || timeTaken === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Allow empty string for timeout cases - will be treated as incorrect answer
    const finalAnswer = answer || '';

    // Verify player belongs to user
    const { data: player } = await supabase
      .from('room_players')
      .select()
      .eq('room_player_id', playerId)
      .eq('user_id', user.id)
      .single();

    if (!player) {
      return NextResponse.json(
        { error: 'Invalid player' },
        { status: 403 }
      );
    }

    // Check if player already answered this question
    const { data: existingAttempt, error: checkError } = await supabase
      .from('question_attempts')
      .select('attempt_id')
      .eq('room_question_id', sessionQuestionId)
      .eq('room_player_id', playerId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors when not found

    if (existingAttempt) {
      return NextResponse.json(
        { error: 'Already answered this question' },
        { status: 400 }
      );
    }


    // Submit answer with powerup effects
    // Empty answer (timeout) will be treated as incorrect with penalty
    const { attempt, pointsEarned } = await submitAnswer(
      sessionQuestionId, 
      playerId, 
      finalAnswer, 
      timeTaken,
      powerupEffects
    );
    

    // Get room_question info
    const { data: roomQuestion } = await supabase
      .from('room_questions')
      .select('*, question(*)')
      .eq('room_question_id', sessionQuestionId)
      .single();

    if (!roomQuestion) {
      throw new Error('Room question not found');
    }

    const totalPlayers = roomQuestion.total_players || 0;
    let newAnsweredCount = 1;
    let allAnswered = false;


    // Try atomic increment function first (preferred method)
    const { data: newCount, error: rpcError } = await supabase
      .rpc('increment_players_answered', {
        question_id: sessionQuestionId
      });

    if (rpcError) {
      console.warn('RPC function not available, using fallback method:', rpcError.message);
      
      // Fallback: Use optimistic locking with multiple retries
      let retries = 3;
      let success = false;
      
      while (retries > 0 && !success) {
        try {
          // Get the latest count
          const { data: latest } = await supabase
            .from('room_questions')
            .select('players_answered')
            .eq('room_question_id', sessionQuestionId)
            .single();
          
          const currentCount = latest?.players_answered || 0;
          newAnsweredCount = currentCount + 1;
          
          // Try to update
          const { error: updateError } = await supabase
            .from('room_questions')
            .update({
              players_answered: newAnsweredCount,
            })
            .eq('room_question_id', sessionQuestionId)
            .eq('players_answered', currentCount); // Optimistic lock
          
          if (!updateError) {
            success = true;
            allAnswered = newAnsweredCount >= totalPlayers;
          } else {
            retries--;
            if (retries > 0) {
              // Wait a bit before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 50 * (4 - retries)));
            }
          }
        } catch (err) {
          retries--;
          if (retries === 0) {
            console.error('Fallback update failed:', err);
            // Don't throw - answer was already recorded
          }
        }
      }
    } else {
      // RPC succeeded
      newAnsweredCount = newCount || 1;
      allAnswered = newAnsweredCount >= totalPlayers;
    }


    // Update all_answered flag if all players have answered
    if (allAnswered) {
      const { error: flagError } = await supabase
        .from('room_questions')
        .update({ all_answered: true })
        .eq('room_question_id', sessionQuestionId);
      
    }

    // If all players answered, automatically advance the turn
    if (allAnswered) {
      const roomId = roomQuestion.room_id;
      
      
      try {
        // Get session and players
        const { data: currentSession } = await supabase
          .from('rooms')
          .select('*')
          .eq('room_id', roomId)
          .single();

        const { data: roomPlayers } = await supabase
          .from('room_players')
          .select('*')
          .eq('room_id', roomId)
          .order('room_player_id', { ascending: true });

        if (currentSession && roomPlayers) {
          const playerCount = roomPlayers.length;
          const currentPlayerIndex = currentSession.current_player_index || 0;
          const nextPlayerIndex = (currentPlayerIndex + 1) % playerCount;
          
          // If we've looped back to 0, increment the turn
          const currentTurn = currentSession.current_turn || 0;
          const nextTurn = nextPlayerIndex === 0 ? currentTurn + 1 : currentTurn;

          // Update the session directly
          const { data: updatedSession, error: turnError } = await supabase
            .from('rooms')
            .update({
              current_player_index: nextPlayerIndex,
              current_turn: nextTurn,
            })
            .eq('room_id', roomId);

          if (turnError) {
            console.error('Failed to advance turn:', turnError);
          } else {
            // If 10 rounds reached, complete the game and determine winner
            if (nextTurn >= 10) {
              try {
                const { data: rankedPlayers } = await supabase
                  .from('room_players')
                  .select('*')
                  .eq('room_id', roomId)
                  .order('score', { ascending: false })
                  .order('room_player_id', { ascending: true })
                  .limit(1);

                const winner = rankedPlayers && rankedPlayers.length > 0 ? rankedPlayers[0] : null;

                await supabase
                  .from('rooms')
                  .update({ status: 'completed' })
                  .eq('room_id', roomId);
              } catch (e) {
                console.error('Failed to complete game after final round:', e);
              }
            }
          }
        }
      } catch (turnErr) {
        console.error('Error advancing turn:', turnErr);
        // Don't throw - answer was still recorded successfully
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        attempt,
        is_correct: attempt.is_correct,
        points_earned: pointsEarned,
        correct_answer: roomQuestion?.question?.correct_answer,
        explanation: null,
        all_answered: allAnswered,
        players_answered: newAnsweredCount,
        total_players: totalPlayers,
      },
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit answer' },
      { status: 500 }
    );
  }
}
