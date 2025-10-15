'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Room, RoomPlayer, Question } from '@/types/database.types';

interface CurrentQuestion extends Question {
  room_question_id?: string;
  time_limit: number;
}

export function useGameRealtime(roomId: string | null) {
  const [session, setSession] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!roomId) return;

    // Initial fetch
    const fetchGameState = async () => {
      const { data: roomData } = await supabase
        .from('rooms')
        .select()
        .eq('room_id', roomId)
        .single();

      const { data: playersData } = await supabase
        .from('room_players')
        .select('*')
        .eq('room_id', roomId)
        .order('room_player_id', { ascending: true }); // Use stable order, not score!

      if (roomData) setSession(roomData);
      if (playersData) setPlayers(playersData);
    };

    fetchGameState();

    // Subscribe to changes
    const gameChannel = supabase
      .channel(`game:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('🎮 Room update received:', payload);
          if (payload.eventType === 'UPDATE') {
            const newSession = payload.new as Room;
            console.log('🔄 Setting NEW session state:', { 
              new_turn: newSession.current_turn,
              new_player: newSession.current_player_index,
              room_id: newSession.room_id
            });
            // Force a new object reference to trigger React re-render
            setSession({ ...newSession });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          console.log('Player update:', payload);
          // Refetch all players on any change
          const { data: playersData } = await supabase
            .from('room_players')
            .select('*')
            .eq('room_id', roomId)
            .order('room_player_id', { ascending: true }); // Use stable order, not score!

          if (playersData) setPlayers(playersData);
        }
      )
      .subscribe();

    setChannel(gameChannel);

    return () => {
      gameChannel.unsubscribe();
    };
  }, [roomId]);

  return { session, players, channel };
}

export function useQuizRealtime(roomId: string | null) {
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [answers, setAnswers] = useState<Record<string, { answer: string; room_player_id: string }>>({});
  const supabase = createClient();

  useEffect(() => {
    if (!roomId) return;

    const quizChannel = supabase
      .channel(`quiz:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_questions',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          console.log('New question:', payload);
          // Fetch full question details
          const { data } = await supabase
            .from('room_questions')
            .select('*, question(*)')
            .eq('room_question_id', payload.new.room_question_id)
            .single();

          if (data) {
            setCurrentQuestion(data);
            setAnswers({}); // Reset answers for new question
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'question_attempts',
        },
        async (payload) => {
          console.log('New answer:', payload);
          setAnswers((prev) => ({
            ...prev,
            [payload.new.room_player_id]: payload.new,
          }));
        }
      )
      .subscribe();

    return () => {
      quizChannel.unsubscribe();
    };
  }, [roomId]);

  return { currentQuestion, answers };
}
