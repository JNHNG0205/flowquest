import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';


async function signOut() {
  'use server'
  const supabase = await createClient(cookies());
  await supabase.auth.signOut();
  redirect('/login');
}

export default async function Instruments() {
  const supabase = await createClient(cookies());
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: instruments } = await supabase.from("instruments").select();

  return (
    <div className="container">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
        <h1 className="text-2xl font-semibold m-0">Instruments</h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="text-sm text-gray-600">
            Welcome, {user.user_metadata?.username || user.email}
          </span>
          <form action={signOut} className="m-0">
            <button 
              type="submit" 
              className="px-4 py-2 text-sm bg-red-600 text-white border-none rounded-md cursor-pointer hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}