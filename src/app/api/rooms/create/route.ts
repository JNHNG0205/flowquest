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
