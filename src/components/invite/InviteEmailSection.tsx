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
 * Email an invite link. Prefers Resend when configured; falls back to mailto.
 * For people who already have Chravel, use AddExistingMemberSection instead.
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
      const ok = await onSend(trimmed);
      if (ok) setEmail('');
    } finally {
      setSending(false);
    }
  }, [email, onSend]);

  return (
    <div className="space-y-2" role="group" aria-label="Invite by email">
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <Mail size={16} className="text-primary" aria-hidden="true" />
        <span>Email invite link</span>
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
          {sending ? 'Sending…' : 'Send'}
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        Sends the invite link by email when delivery is configured; otherwise opens a draft in your
        mail app. Best for people who still need to create an account.
      </p>
    </div>
  );
}
