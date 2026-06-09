import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { DEMO } from '@/demo/demo';

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  at: number;
}

/**
 * Realtime chat for a live class, using Supabase broadcast (ephemeral messages)
 * + presence (participant count). No DB table needed — messages live for the
 * duration of the session. `self: true` so the sender sees their own message.
 */
export function useLiveChat(roomKey: string, displayName: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (DEMO) {
      setParticipants(1);
      setMessages([
        { id: 'm1', user: 'Instructor', text: 'Welcome to the live class! 👋', at: 0 },
      ]);
      return;
    }
    const channel = supabase.channel(`live:${roomKey}`, {
      config: { broadcast: { self: true }, presence: { key: displayName } },
    });

    channel
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        setMessages((prev) => [...prev, payload as ChatMessage]);
      })
      .on('presence', { event: 'sync' }, () => {
        setParticipants(Object.keys(channel.presenceState()).length);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.track({ user: displayName, online_at: Date.now() });
        }
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomKey, displayName]);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        user: displayName,
        text: trimmed,
        at: Date.now(),
      };
      if (DEMO) {
        setMessages((prev) => [...prev, message]);
        return;
      }
      const channel = channelRef.current;
      if (!channel) return;
      channel.send({ type: 'broadcast', event: 'message', payload: message });
    },
    [displayName]
  );

  return { messages, participants, send };
}
