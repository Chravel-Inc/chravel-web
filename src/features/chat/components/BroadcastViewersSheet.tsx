import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';

export type BroadcastViewer = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  viewed_at: string;
};

interface BroadcastViewersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  broadcastId: string | null;
  readCount: number;
}

function formatViewedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function BroadcastViewersSheet({
  open,
  onOpenChange,
  broadcastId,
  readCount,
}: BroadcastViewersSheetProps) {
  const isMobile = useIsMobile();
  const [viewers, setViewers] = useState<BroadcastViewer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !broadcastId) {
      setViewers([]);
      setError(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data, error: rpcError } = await supabase.rpc('get_broadcast_viewers', {
        p_broadcast_id: broadcastId,
      });

      if (cancelled) return;

      if (rpcError) {
        if (import.meta.env.DEV) {
          console.error('[BroadcastViewersSheet]', rpcError.message);
        }
        setError('Could not load who has seen this broadcast.');
        setViewers([]);
        setLoading(false);
        return;
      }

      const rows = (data || []) as BroadcastViewer[];
      setViewers(rows);
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, broadcastId]);

  const body = (
    <div className="space-y-3 px-1 pb-4">
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && !error && viewers.length === 0 && (
        <p className="text-sm text-muted-foreground">No one has marked this as seen yet.</p>
      )}
      {!loading &&
        viewers.map(viewer => (
          <div key={viewer.user_id} className="flex items-center gap-3 min-h-[44px]">
            <Avatar className="h-9 w-9">
              <AvatarImage src={viewer.avatar_url || undefined} alt="" />
              <AvatarFallback>{(viewer.display_name || '?').charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{viewer.display_name}</p>
              <p className="text-xs text-muted-foreground">{formatViewedAt(viewer.viewed_at)}</p>
            </div>
          </div>
        ))}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Seen by {readCount}</DrawerTitle>
            <DrawerDescription>People who opened this broadcast</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 max-h-[60vh] overflow-y-auto">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Seen by {readCount}</DialogTitle>
          <DialogDescription>People who opened this broadcast</DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] overflow-y-auto">{body}</div>
      </DialogContent>
    </Dialog>
  );
}
