import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { getGameState } from '@/lib/database';

/**
 * GET /api/game/state?sessionId=xxx
 * Get current game state
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
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Get game state
    const { session, players } = await getGameState(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { session, players },
    });
  } catch (error) {
    console.error('Get game state error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get game state' },
      { status: 500 }
    );
  }
}
