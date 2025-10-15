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

        // Submit answer
    const { attempt, pointsEarned } = await submitAnswer(sessionQuestionId, playerId, answer, timeTaken);

    // Update room_question tracking (increment players_answered)
    const { data: roomQuestion } = await supabase
      .from('room_questions')
      .select('*, question(*)')
      .eq('room_question_id', sessionQuestionId)
      .single();

    if (!roomQuestion) {
      throw new Error('Room question not found');
    }

    const currentAnswered = roomQuestion.players_answered || 0;
    const totalPlayers = roomQuestion.total_players || 0;
    const newAnsweredCount = currentAnswered + 1;
    const allAnswered = newAnsweredCount >= totalPlayers;

    // Update the room_question
    await supabase
      .from('room_questions')
      .update({
        players_answered: newAnsweredCount,
        all_answered: allAnswered,
      })
      .eq('room_question_id', sessionQuestionId);

    // If all players answered, automatically advance the turn
    if (allAnswered) {
      const roomId = roomQuestion.room_id;
      
      // Call next-turn API
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/game/next-turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: roomId }),
      });
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit answer' },
      { status: 500 }
    );
  }
}
