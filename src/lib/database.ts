import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import type {
  Room,
  RoomPlayer,
  Question,
  RoomQuestion,
  QuestionAttempt,
  DifficultyLevel,
} from '@/types/database.types';

/**
 * Generate a unique 6-digit room code
 */
export async function generateRoomCode(): Promise<string> {
  const supabase = await createClient(cookies());
  let code: string;
  let isUnique = false;

  while (!isUnique) {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    const { data } = await supabase
      .from('rooms')
      .select('room_id')
      .eq('room_code', code)
      .eq('is_active', true)
      .single();

    if (!data) {
      isUnique = true;
      return code;
    }
  }

  throw new Error('Failed to generate unique room code');
}

/**
 * Create a new game room
 */
export async function createGameSession(hostId: string): Promise<{ session: Room; player: RoomPlayer }> {
  const supabase = await createClient(cookies());
  const roomCode = await generateRoomCode();

  // Create room
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({
      room_code: roomCode,
      host_id: hostId,
      is_active: true,
      status: 'waiting',
      current_turn: 0,
      current_player_index: 0,
    })
    .select()
    .single();

  if (roomError || !room) {
    throw new Error(`Failed to create room: ${roomError?.message}`);
  }

  // Add host as first player
  const { data: player, error: playerError } = await supabase
    .from('room_players')
    .insert({
      room_id: room.room_id,
      user_id: hostId,
      score: 0,
      position: 0,
    })
    .select()
    .single();

  if (playerError || !player) {
    throw new Error(`Failed to add host as player: ${playerError?.message}`);
  }

  return { session: room, player };
}

/**
 * Join an existing game room
 */
export async function joinGameSession(
  roomCode: string,
  userId: string
): Promise<{ session: Room; player: RoomPlayer; players: RoomPlayer[] }> {
  const supabase = await createClient(cookies());

  // Find room
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select()
    .eq('room_code', roomCode)
    .eq('is_active', true)
    .eq('status', 'waiting')
    .single();

  if (roomError || !room) {
    throw new Error('Room not found or game already started');
  }

  // Check if user already joined
  const { data: existingPlayer } = await supabase
    .from('room_players')
    .select()
    .eq('room_id', room.room_id)
    .eq('user_id', userId)
    .single();

  if (existingPlayer) {
    // Get all players
    const { data: players } = await supabase
      .from('room_players')
      .select('*')
      .eq('room_id', room.room_id)
      .order('position', { ascending: true });

    return { session: room, player: existingPlayer, players: players || [] };
  }

  // Add new player
  const { data: player, error: playerError } = await supabase
    .from('room_players')
    .insert({
      room_id: room.room_id,
      user_id: userId,
      score: 0,
      position: 0,
    })
    .select()
    .single();

  if (playerError || !player) {
    throw new Error(`Failed to join room: ${playerError?.message}`);
  }

  // Get all players
  const { data: players } = await supabase
    .from('room_players')
    .select('*')
    .eq('room_id', room.room_id)
    .order('position', { ascending: true });

  return { session: room, player, players: players || [] };
}

/**
 * Get a random question that hasn't been asked in this room
 */
export async function getRandomQuestion(roomId: string, difficulty?: string): Promise<Question> {
  const supabase = await createClient(cookies());

  // Get questions already asked in this room
  const { data: askedQuestions } = await supabase
    .from('room_questions')
    .select('question_id')
    .eq('room_id', roomId);

  const askedIds = askedQuestions?.map((rq) => rq.question_id) || [];

  // Build query
  let query = supabase.from('question').select();

  if (askedIds.length > 0) {
    query = query.not('question_id', 'in', `(${askedIds.join(',')})`);
  }

  if (difficulty) {
    query = query.eq('difficulty', difficulty);
  }

  const { data: questions, error } = await query;

  if (error || !questions || questions.length === 0) {
    throw new Error('No more questions available');
  }

  // Return random question
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
}

/**
 * Create a room question for the current round
 */
export async function createRoomQuestion(
  roomId: string,
  questionId: string,
  roundNumber: number,
  timeLimit?: number
): Promise<RoomQuestion> {
  const supabase = await createClient(cookies());

  const { data, error } = await supabase
    .from('room_questions')
    .insert({
      room_id: roomId,
      question_id: questionId,
      round_number: roundNumber,
      time_limit: timeLimit,
    })
    .select('*, question(*)')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create room question: ${error?.message}`);
  }

  return data;
}

/**
 * Submit a player's answer
 */
export async function submitAnswer(
  roomQuestionId: string,
  roomPlayerId: string,
  answerGiven: string,
  timeTaken: number
): Promise<{ attempt: QuestionAttempt; pointsEarned: number }> {
  const supabase = await createClient(cookies());

  console.log('submitAnswer called with:', { roomQuestionId, roomPlayerId, answerGiven, timeTaken });

  // Get the question to check correct answer
  const { data: roomQuestion, error: questionError } = await supabase
    .from('room_questions')
    .select('*, question(*)')
    .eq('room_question_id', roomQuestionId)
    .single();

  console.log('Room question lookup:', { found: !!roomQuestion, error: questionError });

  if (!roomQuestion || !roomQuestion.question) {
    throw new Error('Question not found');
  }

  const isCorrect = answerGiven === roomQuestion.question.correct_answer;
  
  console.log('Points calculated:', { isCorrect });

  // First, insert the attempt WITHOUT answer_order
  // We'll calculate order based on created_at timestamp after insertion
  const { data: attempt, error: attemptError } = await supabase
    .from('question_attempts')
    .insert({
      room_question_id: roomQuestionId,
      room_player_id: roomPlayerId,
      is_correct: isCorrect,
      answer_time: timeTaken,
      // Don't set answer_order yet - will calculate after insertion
    })
    .select()
    .single();

  console.log('Attempt insert:', { success: !!attempt, error: attemptError });

  if (attemptError || !attempt) {
    console.error('Failed to record attempt:', attemptError);
    throw new Error(`Failed to record attempt: ${attemptError?.message}`);
  }

  // Now get all attempts ordered by creation time to determine answer order
  const { data: allAttempts } = await supabase
    .from('question_attempts')
    .select('attempt_id, created_at')
    .eq('room_question_id', roomQuestionId)
    .order('created_at', { ascending: true });

  // Find this attempt's order (1-indexed)
  const answerOrder = (allAttempts?.findIndex(a => a.attempt_id === attempt.attempt_id) ?? -1) + 1 || 1;

  // Update the attempt with the correct answer_order
  await supabase
    .from('question_attempts')
    .update({ answer_order: answerOrder })
    .eq('attempt_id', attempt.attempt_id);

  console.log('Answer order assigned:', answerOrder);
  
  // Calculate points based on correctness, difficulty, time, and answer order
  let pointsEarned = 0;
  if (isCorrect) {
    const difficulty = roomQuestion.question.difficulty?.toLowerCase() || 'medium';
    const basePointsMap: Record<string, number> = {
      easy: 10,
      medium: 15,
      hard: 20,
    };
    const basePoints = basePointsMap[difficulty] || 10;

    const timeLimit = roomQuestion.time_limit || getTimeLimit(difficulty);

    // Time bonus: faster answers get more points (up to 30% bonus)
    const timeBonus = Math.max(0, (timeLimit - timeTaken) / timeLimit) * 0.3;
    
    // Speed bonus: first to answer gets extra points (up to 20% bonus)
    // 1st place: +20%, 2nd place: +10%, 3rd place: +5%
    let speedBonus = 0;
    if (answerOrder === 1) speedBonus = 0.20;
    else if (answerOrder === 2) speedBonus = 0.10;
    else if (answerOrder === 3) speedBonus = 0.05;
    
    pointsEarned = Math.round(basePoints * (1 + timeBonus + speedBonus));
  }

  console.log('Final points calculated:', { pointsEarned });

  // Update player score
  if (pointsEarned > 0) {
    // Get current score
    const { data: currentPlayer } = await supabase
      .from('room_players')
      .select('score')
      .eq('room_player_id', roomPlayerId)
      .single();

    if (currentPlayer) {
      const { error: scoreError } = await supabase
        .from('room_players')
        .update({ score: currentPlayer.score + pointsEarned })
        .eq('room_player_id', roomPlayerId);

      if (scoreError) {
        console.error('Failed to update score:', scoreError);
      }
    }
  }

  return { attempt, pointsEarned };
}

/**
 * Update player's board position
 */
export async function updatePlayerPosition(roomPlayerId: string, newPosition: number): Promise<void> {
  const supabase = await createClient(cookies());

  const { error } = await supabase
    .from('room_players')
    .update({ position: newPosition })
    .eq('room_player_id', roomPlayerId);

  if (error) {
    throw new Error(`Failed to update position: ${error.message}`);
  }
}

/**
 * Get game state
 */
export async function getGameState(roomId: string) {
  const supabase = await createClient(cookies());

  const { data: room } = await supabase
    .from('rooms')
    .select()
    .eq('room_id', roomId)
    .single();

  const { data: players } = await supabase
    .from('room_players')
    .select('*')
    .eq('room_id', roomId)
    .order('score', { ascending: false });

  return { session: room, players: players || [] };
}

/**
 * Get time limit for difficulty
 */
export function getTimeLimit(difficulty: string | null | undefined): number {
  if (!difficulty) return 30;
  
  return {
    easy: 20,
    medium: 35,
    hard: 50,
  }[difficulty.toLowerCase()] || 30;
}
