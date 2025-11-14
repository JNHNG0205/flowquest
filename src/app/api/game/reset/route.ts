import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

/**
 * POST /api/game/reset
 * Reset game state for a new game (host only)
 * Keeps same room and players, resets scores and positions
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

    // Verify user is the host
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

    if (session.host_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the host can reset the game' },
        { status: 403 }
      );
    }

    // Reset room state
    const { data: updatedSession, error: updateError } = await supabase
      .from('rooms')
      .update({
        status: 'waiting',
        current_turn: 0,
        current_player_index: 0,
      })
      .eq('room_id', sessionId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to reset room: ${updateError.message}`);
    }

    // Reset all players' scores and positions
    const { error: playersError } = await supabase
      .from('room_players')
      .update({
        score: 0,
        position: 0,
      })
      .eq('room_id', sessionId);

    if (playersError) {
      throw new Error(`Failed to reset players: ${playersError.message}`);
    }

    // Optionally: Mark old questions as inactive (or delete them)
    // For now, we'll just leave them - they won't interfere with new game
    // If you want to clean them up, you could do:
    // await supabase.from('room_questions').update({ is_active: false }).eq('room_id', sessionId);

    return NextResponse.json({
      success: true,
      data: { session: updatedSession },
      message: 'Game reset successfully. Ready for a new game!',
    });
  } catch (error) {
    console.error('Reset game error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reset game' },
      { status: 500 }
    );
  }
}

