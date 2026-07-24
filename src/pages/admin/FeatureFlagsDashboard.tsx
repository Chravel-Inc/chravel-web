import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  rollout_percentage: number;
  description: string | null;
  updated_at: string | null;
}

interface Draft {
  enabled: boolean;
  rollout_percentage: number;
}

/**
 * Calls the super-admin-only `feature-flags-admin` edge function. Authorization is
 * enforced SERVER-SIDE; this screen is gated by <InternalAdminRoute> for UX only.
 */
async function invokeAdmin<T>(body: Record<string, unknown>): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) throw new Error('No active session — please sign in again.');

  const { data, error } = await supabase.functions.invoke('feature-flags-admin', {
    body,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (error) throw error;
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String((data as { error: unknown }).error));
  }
  return data as T;
}

function draftsFromFlags(rows: FeatureFlag[]): Record<string, Draft> {
  return Object.fromEntries(
    rows.map(f => [f.key, { enabled: f.enabled, rollout_percentage: f.rollout_percentage }]),
  );
}

export default function FeatureFlagsDashboard() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { flags: rows } = await invokeAdmin<{ flags: FeatureFlag[] }>({ action: 'list' });
        if (!mounted) return;
        setFlags(rows);
        setDrafts(draftsFromFlags(rows));
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load feature flags');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setDraft = useCallback((key: string, patch: Partial<Draft>) => {
    setDrafts(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }, []);

  const isDirty = useCallback(
    (flag: FeatureFlag): boolean => {
      const draft = drafts[flag.key];
      if (!draft) return false;
      return draft.enabled !== flag.enabled || draft.rollout_percentage !== flag.rollout_percentage;
    },
    [drafts],
  );

  const handleSave = useCallback(
    async (key: string) => {
      const draft = drafts[key];
      if (!draft) return;

      const pct = Number(draft.rollout_percentage);
      if (!Number.isInteger(pct) || pct < 0 || pct > 100) {
        toast.error('Rollout % must be a whole number between 0 and 100.');
        return;
      }

      setSavingKey(key);
      try {
        const { flag } = await invokeAdmin<{ flag: FeatureFlag }>({
          action: 'update',
          key,
          enabled: draft.enabled,
          rollout_percentage: pct,
        });
        setFlags(prev => prev.map(f => (f.key === key ? flag : f)));
        setDrafts(prev => ({
          ...prev,
          [key]: { enabled: flag.enabled, rollout_percentage: flag.rollout_percentage },
        }));
        toast.success(`Updated "${key}" — takes effect within ~60s.`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Failed to update "${key}".`);
      } finally {
        setSavingKey(null);
      }
    },
    [drafts],
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Feature Flags</h1>
      <p className="text-sm text-slate-400 mb-6">
        Toggle runtime kill switches and set rollout percentage. Changes are live in production
        within ~60 seconds (no redeploy). Flip a flag off to instantly disable a feature.
      </p>

      {loading && <p className="text-slate-400">Loading feature flags…</p>}

      {error && !loading && (
        <div className="border border-red-800 rounded-lg p-4 bg-red-950/40 text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="border border-slate-700 rounded-lg bg-slate-900/50 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flag</TableHead>
                <TableHead className="w-24 text-center">Enabled</TableHead>
                <TableHead className="w-28 text-center">Rollout %</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {flags.map(flag => {
                const draft = drafts[flag.key] ?? {
                  enabled: flag.enabled,
                  rollout_percentage: flag.rollout_percentage,
                };
                const dirty = isDirty(flag);
                return (
                  <TableRow key={flag.key}>
                    <TableCell>
                      <div className="font-mono text-sm">{flag.key}</div>
                      {flag.description && (
                        <div className="text-xs text-slate-400 mt-1">{flag.description}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={draft.enabled}
                        onCheckedChange={checked => setDraft(flag.key, { enabled: checked })}
                        aria-label={`Toggle ${flag.key}`}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={draft.rollout_percentage}
                        onChange={e =>
                          setDraft(flag.key, { rollout_percentage: Number(e.target.value) })
                        }
                        className="w-20 mx-auto text-center"
                        aria-label={`Rollout percentage for ${flag.key}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        disabled={!dirty || savingKey === flag.key}
                        onClick={() => handleSave(flag.key)}
                      >
                        {savingKey === flag.key ? 'Saving…' : 'Save'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {flags.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-slate-400 py-6">
                    No feature flags found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
