import React, { useCallback, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { looksLikeEmailContact, looksLikePhoneContact } from '@/lib/phoneDigits';

interface AddExistingMemberSectionProps {
  disabled?: boolean;
  onAdd: (contact: { email?: string; phone?: string }) => Promise<boolean>;
}

type ContactMode = 'email' | 'phone';

/**
 * Add someone who already has a Chravel account by email or phone.
 * Invite links remain available for people who still need to sign up.
 */
export function AddExistingMemberSection({ disabled, onAdd }: AddExistingMemberSectionProps) {
  const [mode, setMode] = useState<ContactMode>('email');
  const [value, setValue] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = useCallback(async () => {
    const trimmed = value.trim();
    if (mode === 'email') {
      if (!looksLikeEmailContact(trimmed)) {
        toast.error('Enter a valid email address');
        return;
      }
    } else if (!looksLikePhoneContact(trimmed)) {
      toast.error('Enter a valid phone number');
      return;
    }

    setAdding(true);
    try {
      const ok = await onAdd(mode === 'email' ? { email: trimmed } : { phone: trimmed });
      if (ok) setValue('');
    } finally {
      setAdding(false);
    }
  }, [mode, onAdd, value]);

  return (
    <div className="space-y-2" role="group" aria-label="Add existing Chravel user">
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <UserPlus size={16} className="text-primary" aria-hidden="true" />
        <span>Add existing Chravel user</span>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Contact type">
        <Button
          type="button"
          role="tab"
          aria-selected={mode === 'email'}
          variant={mode === 'email' ? 'default' : 'outline'}
          className="min-h-[44px] flex-1"
          // Keep mode tabs clickable when the section is read-only (e.g. demo)
          // so users can still preview Email vs Phone UI.
          disabled={adding}
          onClick={() => {
            setMode('email');
            setValue('');
          }}
        >
          Email
        </Button>
        <Button
          type="button"
          role="tab"
          aria-selected={mode === 'phone'}
          variant={mode === 'phone' ? 'default' : 'outline'}
          className="min-h-[44px] flex-1"
          disabled={adding}
          onClick={() => {
            setMode('phone');
            setValue('');
          }}
        >
          Phone
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          type={mode === 'email' ? 'email' : 'tel'}
          inputMode={mode === 'email' ? 'email' : 'tel'}
          autoComplete={mode === 'email' ? 'email' : 'tel'}
          placeholder={mode === 'email' ? 'friend@email.com' : '+1 555 123 4567'}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleAdd();
            }
          }}
          disabled={disabled || adding}
          className="min-h-[44px]"
          aria-label={mode === 'email' ? 'Member email address' : 'Member phone number'}
        />
        <Button
          type="button"
          onClick={() => void handleAdd()}
          disabled={disabled || adding || !value.trim()}
          className="min-h-[44px] shrink-0"
        >
          {adding ? 'Adding…' : 'Add'}
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        Only works for people who already have a Chravel account with that email or phone in
        Settings. They are added directly — no invite link required.
      </p>
    </div>
  );
}
