import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

/**
 * POST /api/game/next-turn
 * Advance to the next player's turn, incrementing turn number when all players have played
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
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Get session and players (ordered consistently by join order)
    const { data: session, error: sessionError } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get players ordered by room_player_id (consistent order)
    const { data: players } = await supabase
      .from('room_players')
      .select('*')
      .eq('room_id', sessionId)
      .order('room_player_id', { ascending: true });

    // Calculate next player index
    const playerCount = players?.length || 0;
    const currentPlayerIndex = session.current_player_index || 0;
    const nextPlayerIndex = (currentPlayerIndex + 1) % playerCount;
    
    // If we've looped back to 0, increment the turn
    const currentTurn = session.current_turn || 0;
    const nextTurn = nextPlayerIndex === 0 ? currentTurn + 1 : currentTurn;

    // Update the session
    const { data: updatedSession, error: updateError } = await supabase
      .from('rooms')
      .update({
        current_player_index: nextPlayerIndex,
        current_turn: nextTurn,
      })
      .eq('room_id', sessionId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update turn: ${updateError.message}`);
    }

    // If we've reached 10 rounds, end the game and determine winner
    let winner: any = null;
    let finalSession = updatedSession;
    if (nextTurn >= 10) {
      try {
        // Get players ordered by score desc, then by earliest join (room_player_id) as tiebreaker
        const { data: rankedPlayers } = await supabase
          .from('room_players')
          .select('*')
          .eq('room_id', sessionId)
          .order('score', { ascending: false })
          .order('room_player_id', { ascending: true })
          .limit(1);

        winner = rankedPlayers && rankedPlayers.length > 0 ? rankedPlayers[0] : null;

        // Mark room as completed
        const { data: completedSession } = await supabase
          .from('rooms')
          .update({ status: 'completed' })
          .eq('room_id', sessionId)
          .select()
          .single();

        if (completedSession) {
          finalSession = completedSession;
        }
      } catch (e) {
        console.error('Failed to complete game:', e);
      }
    }

    return NextResponse.json({
      success: true,
      data: { 
        session: finalSession,
        nextPlayerIndex,
        nextTurn,
        completed: nextTurn >= 10,
        winner,
      },
    });
  } catch (error) {
    console.error('Next turn error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to advance turn' },
      { status: 500 }
    );
  }
}
