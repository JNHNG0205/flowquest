import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

/**
 * POST /api/rooms/start
 * Start a game session (host only)
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

    // Verify host and update status
    const { data: session, error } = await supabase
      .from('rooms')
      .update({ status: 'in_progress' })
      .eq('room_id', sessionId)
      .eq('host_id', user.id)
      .select()
      .single();

    if (error || !session) {
      throw new Error('Only the host can start the game');
    }

    return NextResponse.json({
      success: true,
      data: { session },
    });
  } catch (error) {
    console.error('Start game error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start game' },
      { status: 500 }
    );
  }
}
