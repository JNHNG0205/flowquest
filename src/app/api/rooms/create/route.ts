import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { createGameSession } from '@/lib/database';

/**
 * POST /api/rooms/create
 * Create a new game room
 */
export async function POST() {
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

    // Check if user already has an active room as host
    const { data: existingRoom } = await supabase
      .from('rooms')
      .select('*')
      .eq('host_id', user.id)
      .eq('is_active', true)
      .eq('status', 'waiting')
      .single();

    if (existingRoom) {
      // Return existing room instead of creating new one
      const { data: player } = await supabase
        .from('room_players')
        .select('*')
        .eq('room_id', existingRoom.room_id)
        .eq('user_id', user.id)
        .single();

      return NextResponse.json({
        success: true,
        data: { session: existingRoom, player },
      });
    }

    // Create game session
    const { session, player } = await createGameSession(user.id);

    return NextResponse.json({
      success: true,
      data: { session, player },
    });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create room' },
      { status: 500 }
    );
  }
}
