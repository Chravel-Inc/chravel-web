import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleGoogleCalendarCallback } from '../features/calendar/api/googleCalendarAuth';
import { toast } from 'sonner';

export const GoogleCalendarCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      const userCancelled = errorParam === 'access_denied';
      if (userCancelled) {
        toast.info('Google Calendar connection cancelled');
        navigate('/settings', { state: { section: 'integrations' } });
      } else {
        setError(`Google returned an error: ${errorParam}`);
        toast.error('Failed to connect Google Calendar', { description: errorParam });
        setTimeout(() => navigate('/settings', { state: { section: 'integrations' } }), 3000);
      }
      return;
    }

    if (!code || !state) {
      setError('Invalid callback parameters');
      toast.error('Invalid callback parameters');
      setTimeout(() => navigate('/settings', { state: { section: 'integrations' } }), 3000);
      return;
    }

    const processCallback = async () => {
      try {
        const { email } = await handleGoogleCalendarCallback(code, state);
        toast.success(`Successfully connected ${email}`);
        navigate('/settings', { state: { section: 'integrations' } });
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : 'Failed to complete Google Calendar connection',
        );
        toast.error('Failed to complete Google Calendar connection');
        setTimeout(() => navigate('/settings', { state: { section: 'integrations' } }), 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="max-w-md text-center space-y-4">
        {error ? (
          <>
            <div className="text-destructive font-medium text-lg">Connection Failed</div>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm">Redirecting back to settings...</p>
          </>
        ) : (
          <>
            <div className="h-8 w-8 mx-auto animate-spin gold-gradient-spinner" />
            <h2 className="text-xl font-medium">Connecting your Google Calendar...</h2>
            <p className="text-muted-foreground">
              Please wait while we securely complete the setup.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
