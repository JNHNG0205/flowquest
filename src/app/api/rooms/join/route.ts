import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { joinGameSession } from '@/lib/database';

/**
 * POST /api/rooms/join
 * Join an existing game room
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
    const { roomCode } = body;

    if (!roomCode || roomCode.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid room code' },
        { status: 400 }
      );
    }

    // Join game session
    const { session, player, players } = await joinGameSession(roomCode, user.id);

    return NextResponse.json({
      success: true,
      data: { session, player, players },
    });
  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to join room' },
      { status: 500 }
    );
  }
}
