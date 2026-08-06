import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type UnsubscribeState = 'working' | 'done' | 'invalid' | 'error';

/**
 * Public landing page for the one-click unsubscribe link embedded in every
 * outgoing email (send-email-with-retry). Invokes the unsubscribe-email edge
 * function with the anon key so it works logged-out and regardless of the
 * function's platform JWT gating. No auth, no data beyond the signed token.
 */
const UnsubscribePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<UnsubscribeState>('working');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setState('invalid');
      return;
    }

    let cancelled = false;
    supabase.functions
      .invoke('unsubscribe-email', { body: { token } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          // invoke wraps every non-2xx response as a FunctionsHttpError with
          // the raw Response on .context. The function returns 400 only for
          // an invalid/expired token; a 500 means the token was fine but the
          // DB write failed — that must not tell the user their link is bad
          // (which reads as "give up") when "try again" is the honest answer.
          const status = (error as { context?: { status?: number } })?.context?.status;
          setState(status === 400 ? 'invalid' : 'error');
        } else if (data?.ok) {
          setState('done');
        } else {
          setState('error');
        }
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <main className="max-w-md text-center space-y-4">
        {state === 'working' && (
          <>
            <h1 className="text-2xl font-semibold text-foreground">Updating your preferences…</h1>
            <p className="text-muted-foreground">One moment.</p>
          </>
        )}
        {state === 'done' && (
          <>
            <h1 className="text-2xl font-semibold text-foreground">You're unsubscribed</h1>
            <p className="text-muted-foreground">
              You'll no longer receive email notifications from Chravel.
            </p>
            <p className="text-muted-foreground">
              Changed your mind? Re-enable them any time in{' '}
              <Link to="/settings" className="text-primary underline">
                notification settings
              </Link>
              .
            </p>
          </>
        )}
        {state === 'invalid' && (
          <>
            <h1 className="text-2xl font-semibold text-foreground">This link didn't work</h1>
            <p className="text-muted-foreground">
              The unsubscribe link is invalid or has expired. You can manage email notifications in{' '}
              <Link to="/settings" className="text-primary underline">
                notification settings
              </Link>
              .
            </p>
          </>
        )}
        {state === 'error' && (
          <>
            <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
            <p className="text-muted-foreground">
              We couldn't update your preferences. Please try again, or use{' '}
              <Link to="/settings" className="text-primary underline">
                notification settings
              </Link>
              .
            </p>
          </>
        )}
      </main>
    </div>
  );
};

export default UnsubscribePage;
