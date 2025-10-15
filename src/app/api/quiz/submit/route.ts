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
    const { sessionQuestionId, playerId, answer, timeTaken } = body;

    if (!sessionQuestionId || !playerId || !answer || timeTaken === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

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
    const { data: existingAttempt } = await supabase
      .from('question_attempts')
      .select('attempt_id')
      .eq('room_question_id', sessionQuestionId)
      .eq('room_player_id', playerId)
      .single();

    if (existingAttempt) {
      return NextResponse.json(
        { error: 'Already answered this question' },
        { status: 400 }
      );
    }

    // Submit answer
    const { attempt, pointsEarned } = await submitAnswer(sessionQuestionId, playerId, answer, timeTaken);

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

    console.log('📊 Before increment - Total players:', totalPlayers, 'Players answered:', roomQuestion.players_answered);

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

    console.log('📊 After increment - Players answered:', newAnsweredCount, 'Total:', totalPlayers, 'All answered:', allAnswered);

    // Update all_answered flag if all players have answered
    if (allAnswered) {
      const { error: flagError } = await supabase
        .from('room_questions')
        .update({ all_answered: true })
        .eq('room_question_id', sessionQuestionId);
      
      console.log('Updated all_answered flag:', flagError ? 'FAILED' : 'SUCCESS', flagError);
    }

    // If all players answered, automatically advance the turn
    if (allAnswered) {
      const roomId = roomQuestion.room_id;
      
      console.log('🎯 All players answered! Advancing turn for room:', roomId);
      
      // Call next-turn API
      const nextTurnResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/game/next-turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: roomId }),
      });
      
      const nextTurnResult = await nextTurnResponse.json();
      console.log('Next turn result:', nextTurnResult);
      
      if (!nextTurnResponse.ok) {
        console.error('Failed to advance turn:', nextTurnResult);
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
