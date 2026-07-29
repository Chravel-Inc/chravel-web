import React, { useState, useCallback } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface InviteEmailSectionProps {
  disabled?: boolean;
  onSend: (email: string) => Promise<boolean> | boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Organizer "invite by email" field wired to the existing mailto invite helper.
 */
export function InviteEmailSection({ disabled, onSend }: InviteEmailSectionProps) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = useCallback(async () => {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      toast.error('Enter a valid email address');
      return;
    }
    setSending(true);
    try {
      await onSend(trimmed);
    } finally {
      setSending(false);
    }
  }, [email, onSend]);

  return (
    <div className="space-y-2" role="group" aria-label="Invite by email">
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <Mail size={16} className="text-primary" aria-hidden="true" />
        <span>Invite by email</span>
      </div>
      <div className="flex gap-2">
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="friend@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleSend();
            }
          }}
          disabled={disabled || sending}
          className="min-h-[44px]"
          aria-label="Invitee email address"
        />
        <Button
          type="button"
          onClick={() => void handleSend()}
          disabled={disabled || sending || !email.trim()}
          className="min-h-[44px] shrink-0"
        >
          Send
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        Opens your email app with the invite link ready to send.
      </p>
    </div>
  );
}
