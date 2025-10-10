import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

/**
 * POST /api/rooms/leave
 * Leave a game room
 */
export async function POST(request: Request) {
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

    const { roomId } = await request.json();

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    // Remove player from room
    const { error: deleteError } = await supabase
      .from('room_players')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', user.id);

    if (deleteError) {
      throw deleteError;
    }

    // Check how many players are left in the room
    const { data: remainingPlayers, error: countError } = await supabase
      .from('room_players')
      .select('room_player_id')
      .eq('room_id', roomId);

    if (countError) {
      throw countError;
    }

    // If no players left, mark room as inactive
    if (!remainingPlayers || remainingPlayers.length === 0) {
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ 
          is_active: false,
          status: 'completed'
        })
        .eq('room_id', roomId);

      if (updateError) {
        console.error('Error updating room status:', updateError);
        // Don't throw - player removal succeeded
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Left room successfully',
      roomClosed: remainingPlayers.length === 0
    });
  } catch (error) {
    console.error('Leave room error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to leave room' },
      { status: 500 }
    );
  }
}
