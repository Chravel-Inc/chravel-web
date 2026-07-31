import React, { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  filterScheduleForLocalDay,
  mapCalendarEventsToProSchedule,
} from '@/lib/mapCalendarToProSchedule';
import type { ProSchedule } from '@/types/pro';

interface ProDaySheetProps {
  tripId: string;
}

function formatTimeRange(item: ProSchedule): string {
  try {
    const start = new Date(item.startTime);
    const end = new Date(item.endTime);
    if (Number.isNaN(start.getTime())) return '';
    const startLabel = start.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
    if (Number.isNaN(end.getTime()) || item.endTime === item.startTime) {
      return startLabel;
    }
    const endLabel = end.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${startLabel} – ${endLabel}`;
  } catch {
    return '';
  }
}

/**
 * Lightweight day-sheet MVP: today's live calendar events for Pro trips.
 * Source of truth is trip_events (same as Calendar), not demo schedule stubs.
 */
export function ProDaySheet({ tripId }: ProDaySheetProps) {
  const [todayItems, setTodayItems] = useState<ProSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('trip_events')
        .select('id, title, start_time, end_time, location, description, event_category')
        .eq('trip_id', tripId)
        .order('start_time', { ascending: true })
        .limit(200);

      if (cancelled) return;

      if (error) {
        if (import.meta.env.DEV) {
          console.error('[ProDaySheet] failed to load calendar:', error.message);
        }
        setTodayItems([]);
        setLoading(false);
        return;
      }

      const schedule = mapCalendarEventsToProSchedule(data || []);
      setTodayItems(filterScheduleForLocalDay(schedule));
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  if (loading) {
    return (
      <div className="mb-4 rounded-xl border border-border/60 bg-white/5 p-4 animate-pulse">
        <div className="h-4 w-32 bg-muted/50 rounded mb-3" />
        <div className="h-12 bg-muted/40 rounded" />
      </div>
    );
  }

  return (
    <section
      className="mb-4 rounded-xl border border-border/60 bg-white/5 p-4"
      aria-label="Today's day sheet"
    >
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock size={16} className="text-primary" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-foreground">Today&apos;s day sheet</h3>
      </div>

      {todayItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing on the calendar for today. Add events in Calendar — they show up here
          automatically.
        </p>
      ) : (
        <ul className="space-y-2">
          {todayItems.map(item => (
            <li
              key={item.id}
              className="flex flex-col gap-0.5 rounded-lg border border-border/40 bg-background/40 px-3 py-2"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-foreground">{item.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatTimeRange(item)}
                </span>
              </div>
              {item.location ? (
                <span className="text-xs text-muted-foreground">{item.location}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
