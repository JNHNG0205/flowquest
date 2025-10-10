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
    
    // Create room question
    const roomQuestion = await createRoomQuestion(
      sessionId,
      question.question_id,
      roundNumber,
      getTimeLimit(question.difficulty)
    );

    // Get time limit based on difficulty
    const timeLimit = getTimeLimit(question.difficulty);

    // Don't send correct answer to client
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { correct_answer, ...questionWithoutAnswer } = question;

    return NextResponse.json({
      success: true,
      data: {
        session_question: roomQuestion,
        question: questionWithoutAnswer,
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
