import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { LiveClassPublic } from '@/types';

interface GroupedClasses {
  live: LiveClassPublic[];
  upcoming: LiveClassPublic[];
  past: LiveClassPublic[];
}

/**
 * Loads live classes from the `live_classes_public` view (room_id masked for
 * non-premium) and keeps them fresh: a Realtime subscription on the base table
 * refetches whenever a class is added or its status flips
 * (scheduled -> live -> ended).
 */
export function useLiveClasses() {
  const [classes, setClasses] = useState<LiveClassPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data, error } = await supabase
        .from('live_classes_public')
        .select('*')
        .order('scheduled_at', { ascending: true });
      if (!active) return;
      if (error) setError(error.message);
      else setClasses(data ?? []);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel('live_classes_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_classes' },
        () => load()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const grouped: GroupedClasses = {
    live: classes.filter((c) => c.status === 'live'),
    upcoming: classes.filter((c) => c.status === 'scheduled'),
    past: classes.filter((c) => c.status === 'ended'),
  };

  return { classes, grouped, loading, error };
}
