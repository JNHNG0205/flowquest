import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { getPlayerPowerUps } from '@/lib/database';

/**
 * GET /api/powerups/player?playerId=xxx
 * Get player's current powerups
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json(
        { error: 'Missing playerId parameter' },
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

    // Get player's powerups
    const powerups = await getPlayerPowerUps(playerId);

    return NextResponse.json({
      success: true,
      data: {
        powerups,
        total_count: powerups.length,
      },
    });
  } catch (error) {
    console.error('Get player powerups error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get powerups' },
      { status: 500 }
    );
  }
}
