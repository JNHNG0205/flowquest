import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';


async function signOut() {
  'use server'
  const supabase = await createClient(cookies());
  await supabase.auth.signOut();
  redirect('/login');
}

export default async function Home() {
  const supabase = await createClient(cookies());
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Check if user has an active room (as any player, not just host)
  const { data: playerRooms, error } = await supabase
    .from('room_players')
    .select('room_id, rooms!inner(*)')
    .eq('user_id', user.id)
    .eq('rooms.is_active', true)
    .in('rooms.status', ['waiting', 'in_progress']);

  // Get the most recent active room
  const activeRoom = playerRooms && playerRooms.length > 0 
    ? playerRooms[playerRooms.length - 1]?.rooms as any
    : null;

  // Debug: Log the query results (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Player rooms query result:', { playerRooms, error, activeRoom });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">FlowQuest</h1>
          <p className="text-xl text-white/90">
            Educational Multiplayer Board Game
          </p>
          <p className="text-white/80 mt-2">
            Welcome, {user.user_metadata?.username || user.email}!
          </p>
        </div>

        {/* Show existing room if user has one */}
        {activeRoom && (
          <div className="bg-yellow-500/90 rounded-xl shadow-2xl p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎮</span>
                  <h2 className="text-2xl font-bold text-white">
                    You have an active room
                  </h2>
                </div>
                <p className="text-white/90 mb-3">
                  Room Code: <span className="font-mono font-bold text-3xl">{activeRoom.room_code}</span>
                </p>
                <p className="text-white/80 text-sm">
                  Status: {activeRoom.status === 'waiting' ? '⏳ Waiting for players' : '🎮 Game in progress'}
                </p>
              </div>
              <Link
                href={activeRoom.status === 'waiting' 
                  ? `/room/${activeRoom.room_id}` 
                  : `/game/${activeRoom.room_id}`}
                className="bg-white text-yellow-600 px-6 py-3 rounded-lg font-bold hover:bg-yellow-50 transition-colors"
              >
                Rejoin Room →
              </Link>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Room */}
          <Link
            href="/room/create"
            className="bg-white rounded-xl shadow-2xl p-8 hover:scale-105 transition-transform cursor-pointer"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Create Room
              </h2>
              <p className="text-gray-600">
                Start a new game and invite friends to join
              </p>
            </div>
          </Link>

          {/* Join Room */}
          <Link
            href="/room/join"
            className="bg-white rounded-xl shadow-2xl p-8 hover:scale-105 transition-transform cursor-pointer"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Join Room
              </h2>
              <p className="text-gray-600">
                Enter a room code or scan QR to join
              </p>
            </div>
          </Link>
        </div>

        {/* Logout */}
        <form action={signOut} className="mt-8 text-center">
          <button
            type="submit"
            className="text-white/80 hover:text-white underline"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}