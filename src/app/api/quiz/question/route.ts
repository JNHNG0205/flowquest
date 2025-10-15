import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { getRandomQuestion, createRoomQuestion, getTimeLimit } from '@/lib/database';

/**
 * POST /api/quiz/question
 * Fetch a new question for the current turn
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
    const { sessionId, roundNumber, difficulty } = body;

    if (!sessionId || roundNumber === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get random question
    const question = await getRandomQuestion(sessionId, difficulty);
    
    // Get total number of active players in the room
    const { data: players, error: playersError } = await supabase
      .from('room_players')
      .select('room_player_id')
      .eq('room_id', sessionId);

    if (playersError) {
      throw new Error('Failed to fetch players');
    }

    const totalPlayers = players?.length || 0;
    
    // Create room question with total_players set
    const roomQuestion = await createRoomQuestion(
      sessionId,
      question.question_id,
      roundNumber,
      getTimeLimit(question.difficulty)
    );

    // Update the room_question with player tracking info
    await supabase
      .from('room_questions')
      .update({
        total_players: totalPlayers,
        players_answered: 0,
        all_answered: false,
      })
      .eq('room_question_id', roomQuestion.room_question_id);

    // Get time limit based on difficulty
    const timeLimit = getTimeLimit(question.difficulty);

    // Don't send correct answer to client
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { correct_answer, ...questionWithoutAnswer } = question;

    // Ensure options is an array (parse if it's a JSON string)
    let options = questionWithoutAnswer.options;
    if (typeof options === 'string') {
      try {
        options = JSON.parse(options);
      } catch (e) {
        console.error('Failed to parse options:', e);
        options = [];
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        session_question: roomQuestion,
        question: {
          ...questionWithoutAnswer,
          options: options || [],
        },
        time_limit: timeLimit,
      },
    });
  } catch (error) {
    console.error('Fetch question error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch question' },
      { status: 500 }
    );
  }
}
