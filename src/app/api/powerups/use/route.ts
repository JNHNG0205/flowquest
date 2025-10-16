import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { consumePowerUp } from '@/lib/database';

/**
 * POST /api/powerups/use
 * Use a powerup during the player's turn
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
    const { playerId, powerupId } = body;

    if (!playerId || !powerupId) {
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

    // Use the powerup
    const result = await consumePowerUp(powerupId, playerId);

    return NextResponse.json({
      success: true,
      data: {
        success: result.success,
        effect_applied: result.effect,
        message: 'Powerup used successfully!',
      },
    });
  } catch (error) {
    console.error('Use powerup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to use powerup' },
      { status: 500 }
    );
  }
}
