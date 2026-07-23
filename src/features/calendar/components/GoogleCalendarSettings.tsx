import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { AlertTriangle, CalendarDays, CheckCircle2, Info, Trash2, X } from 'lucide-react';
import {
  fetchGoogleCalendarAccounts,
  connectGoogleCalendarAccount,
  disconnectGoogleCalendarAccount,
  GoogleCalendarAccount,
} from '../api/googleCalendarAuth';
import { useFeatureFlag } from '@/lib/featureFlags';

const MAX_ACCOUNTS = 3;

/** Official Google "G" logo as inline SVG — no external image dependency */
const GoogleLogo: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

/** Determine if a token is expired or expiring within 24h */
function isTokenStale(tokenExpiresAt: string | null): boolean {
  if (!tokenExpiresAt) return false;
  const expiry = new Date(tokenExpiresAt);
  const threshold = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return expiry <= threshold;
}

/** Human-readable "X days ago" / "today" */
function relativeDate(iso: string | null): string | null {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

export const GoogleCalendarSettings = () => {
  // Kill switch — Google Calendar OAuth is gated behind Google's OAuth
  // verification for the Calendar scope. Default false: render nothing until the
  // flag is explicitly flipped on.
  const calendarEnabled = useFeatureFlag('google_calendar_sync', false);

  const [accounts, setAccounts] = useState<GoogleCalendarAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [reconnectBannerDismissed, setReconnectBannerDismissed] = useState(false);

  useEffect(() => {
    if (!calendarEnabled) return;
    loadAccounts();
  }, [calendarEnabled]);

  if (!calendarEnabled) {
    return null;
  }

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await fetchGoogleCalendarAccounts();
      setAccounts(data);
    } catch (error: unknown) {
      toast.error('Failed to load connected calendars', {
        description: (error as Error)?.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const url = await connectGoogleCalendarAccount();
      // Redirect to Google OAuth consent screen
      window.location.href = url;
    } catch (error: unknown) {
      toast.error('Failed to initiate connection', { description: (error as Error)?.message });
      setConnecting(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      setDisconnectingId(accountId);
      await disconnectGoogleCalendarAccount(accountId);
      toast.success('Google Calendar disconnected');
      setAccounts(accounts.filter(a => a.id !== accountId));
    } catch (error: unknown) {
      toast.error('Failed to disconnect calendar', { description: (error as Error)?.message });
    } finally {
      setDisconnectingId(null);
    }
  };

  const hasStaleAccount = accounts.some(a => isTokenStale(a.token_expires_at));
  const atAccountCap = accounts.length >= MAX_ACCOUNTS;

  return (
    <Card className="w-full max-w-2xl mx-auto border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-blue-500" />
          Google Calendar
        </CardTitle>
        <CardDescription className="space-y-2">
          <span className="block">
            Connect your Google Calendar to Chravel. We request read-only access — you can
            disconnect anytime, and your tokens are encrypted at rest.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        {!loading && hasStaleAccount && !reconnectBannerDismissed && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400 flex-1">
              One of your Google Calendar connections needs to be reconnected.
            </p>
            <button
              onClick={() => setReconnectBannerDismissed(true)}
              className="text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Dismiss reconnect banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-4">
            <div className="h-6 w-6 animate-spin gold-gradient-spinner" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center bg-card">
            <div className="flex flex-col items-center gap-2">
              <CalendarDays className="h-8 w-8 text-muted-foreground mb-2" />
              <h3 className="font-medium">No Google Calendar connected</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your Google Calendar with read-only access. You can connect up to{' '}
                {MAX_ACCOUNTS} accounts.
              </p>
              <Button
                onClick={handleConnect}
                disabled={connecting}
                variant="outline"
                className="gap-2 min-h-[44px]"
                aria-label="Connect Google Calendar"
              >
                {connecting ? (
                  <div className="h-4 w-4 animate-spin gold-gradient-spinner" />
                ) : (
                  <GoogleLogo className="h-4 w-4" />
                )}
                Connect Google Calendar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
              <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <span className="font-medium text-foreground">
                    {accounts.length} of {MAX_ACCOUNTS}
                  </span>{' '}
                  calendars connected.
                </p>
              </div>
            </div>

            {accounts.map(account => {
              const stale = isTokenStale(account.token_expires_at);
              const syncedLabel = relativeDate(account.last_synced_at);

              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border p-4 bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <GoogleLogo className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{account.email}</p>
                        {stale ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            Reconnect recommended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Connected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {syncedLabel
                          ? `Last synced ${syncedLabel}`
                          : `Added ${new Date(account.created_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 shrink-0 min-h-[44px] min-w-[44px]"
                    onClick={() => handleDisconnect(account.id)}
                    disabled={disconnectingId === account.id}
                    aria-label={`Disconnect ${account.email}`}
                  >
                    {disconnectingId === account.id ? (
                      <div className="h-4 w-4 animate-spin gold-gradient-spinner" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              );
            })}

            <div className="space-y-1">
              <Button
                onClick={handleConnect}
                disabled={connecting || atAccountCap}
                variant="outline"
                className="w-full gap-2 min-h-[44px]"
                title={atAccountCap ? `Maximum ${MAX_ACCOUNTS} calendars allowed` : undefined}
                aria-label="Connect another Google Calendar"
              >
                {connecting ? (
                  <div className="h-4 w-4 animate-spin gold-gradient-spinner" />
                ) : (
                  <CalendarDays className="h-4 w-4" />
                )}
                Connect another calendar
              </Button>
              {atAccountCap && (
                <p className="text-xs text-muted-foreground text-center">
                  All {MAX_ACCOUNTS} calendar slots are in use. Remove one above to connect a
                  different account.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
