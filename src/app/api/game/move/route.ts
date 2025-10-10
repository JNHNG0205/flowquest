import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { updatePlayerPosition} from '@/lib/database';

/**
 * POST /api/game/move
 * Update player's board position
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
    const { playerId, position } = body;

    if (!playerId || position === undefined) {
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

    // Update position
    await updatePlayerPosition(playerId, position);

    return NextResponse.json({
      success: true,
      data: { position },
    });
  } catch (error) {
    console.error('Move player error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update position' },
      { status: 500 }
    );
  }
}
