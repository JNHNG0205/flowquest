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

    // Validate position is within board range (1-36 for 10x10 perimeter board)
    if (position < 1 || position > 36) {
      return NextResponse.json(
        { error: 'Invalid position: Position must be between 1 and 36' },
        { status: 400 }
      );
    }

    // Verify player belongs to user
    const { data: player } = await supabase
      .from('room_players')
      .select('position')
      .eq('room_player_id', playerId)
      .eq('user_id', user.id)
      .single();

    if (!player) {
      return NextResponse.json(
        { error: 'Invalid player' },
        { status: 403 }
      );
    }

    // Get player's previous position (0 means at start, which is position 1 on board)
    const previousPosition = player.position || 0;
    const actualPreviousPosition = previousPosition === 0 ? 1 : previousPosition;

    // Strict validation: new position must be 1-6 spaces ahead of previous position
    const positionDifference = position - actualPreviousPosition;
    
    if (positionDifference < 1 || positionDifference > 6) {
      return NextResponse.json(
        { 
          error: `Invalid move! You can only move 1-6 spaces from your current position (${actualPreviousPosition}). ` +
                  `You tried to move to position ${position} (${positionDifference > 0 ? '+' : ''}${positionDifference} spaces).`
        },
        { status: 400 }
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
