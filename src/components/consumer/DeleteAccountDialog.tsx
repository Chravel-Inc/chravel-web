import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logAuthEvent } from '@/utils/authTelemetry';
import { deleteAccountImmediately } from '@/lib/accountDeletion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Shared account-deletion confirmation dialog.
 * Confirmation is unified across every auth provider: the user types the word
 * `delete` and clicks the destructive action. Server-side deletion is authorized
 * by the active session JWT + `confirmation` payload — no client-side password
 * re-auth is required (email/password users would have had to type their password
 * previously; that extra hurdle has been removed for parity with OAuth users).
 */
export const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleOpenChange = useCallback(
    (next: boolean) => {
      onOpenChange(next);
      if (!next) {
        setConfirmText('');
      }
    },
    [onOpenChange],
  );

  const handleDeleteAccount = useCallback(async () => {
    if (confirmText.trim().toLowerCase() !== 'delete') return;

    const finalConfirmed = window.confirm(
      'FINAL CONFIRMATION\n\n' +
        'This will IMMEDIATELY and PERMANENTLY delete your ChravelApp account and all ' +
        'associated data — profile, trips you own, messages, uploaded media, payment ' +
        'history, AI Concierge history, notifications, and preferences.\n\n' +
        'There is NO 30-day grace period. There is NO way to recover this account or ' +
        'its data after you click OK.\n\n' +
        'Click OK to delete your account right now, or Cancel to keep your account.',
    );
    if (!finalConfirmed) return;

    setIsDeleting(true);
    try {
      const result = await deleteAccountImmediately();
      if (result.success === false) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      logAuthEvent('account_deletion_requested');
      onOpenChange(false);
      setConfirmText('');

      toast({
        title: 'Account deleted',
        description: result.message,
      });

      await supabase.auth.signOut().catch(() => undefined);
      navigate('/', { replace: true });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete your account. Please contact privacy@chravelapp.com',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  }, [confirmText, navigate, onOpenChange]);

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="bg-gray-900 border border-red-500/30">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-400">Delete Your Account?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300 space-y-3">
            <p>
              This action is <strong>immediate and cannot be undone</strong>. The following will be
              permanently removed:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Your profile and personal information</li>
              <li>All trips you've created</li>
              <li>Your messages and media uploads</li>
              <li>Your subscription and payment history</li>
            </ul>
            <p className="text-sm text-gray-400">
              You will be signed out as soon as deletion completes.
            </p>
            <p className="pt-2">
              To confirm, type <strong>delete</strong> below. No password required — your active
              session authorizes the deletion. Your account will be removed immediately.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="Type delete to confirm"
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              disabled={isDeleting}
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isDeleting}
            className="bg-gray-700 text-white hover:bg-gray-600"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={confirmText.trim().toLowerCase() !== 'delete' || isDeleting}
            className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete Account Permanently'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
