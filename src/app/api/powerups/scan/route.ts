import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { getRandomPowerUp, givePowerUpToPlayer } from '@/lib/database';

/**
 * POST /api/powerups/scan
 * Scan a tile QR code to get a random powerup
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
    const { playerId, tileData } = body;

    if (!playerId || !tileData) {
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

    // Get a random powerup
    const powerup = await getRandomPowerUp();

    // Give the powerup to the player
    const playerPowerup = await givePowerUpToPlayer(playerId, powerup.powerup_id);

    return NextResponse.json({
      success: true,
      data: {
        powerup,
        player_powerup: playerPowerup,
        message: `You found a ${powerup.name}! ${powerup.description || ''}`,
      },
    });
  } catch (error) {
    console.error('Scan powerup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to scan powerup' },
      { status: 500 }
    );
  }
}
