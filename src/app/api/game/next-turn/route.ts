import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

/**
 * POST /api/game/next-turn
 * Advance to the next turn (simplified - just acknowledge completion)
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

    // Get session
    const { data: session } = await supabase
      .from('rooms')
      .select()
      .eq('room_id', sessionId)
      .single();

    return NextResponse.json({
      success: true,
      data: { session },
    });
  } catch (error) {
    console.error('Next turn error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to advance turn' },
      { status: 500 }
    );
  }
}
