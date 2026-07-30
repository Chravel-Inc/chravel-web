import React, { useState } from 'react';
import {
  ShieldAlert,
  Trash2,
  Copy,
  CheckSquare,
  DollarSign,
  Settings2,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  confirmGatedConciergeAction,
  type ConciergeConfirmationRequest,
} from '@/features/concierge/lib/confirmGatedAction';
import { getConciergeInvalidationKeys } from '@/lib/conciergeInvalidation';
import { ConciergeActionCard } from './ConciergeActionCard';

interface ConciergeConfirmCardProps {
  request: ConciergeConfirmationRequest;
  tripId: string;
}

/** Display config for the confirmation-gated tools (see aiSecurityBoundary.ts). */
const GATED_TOOL_CONFIG: Record<string, { icon: React.ElementType; verb: string }> = {
  deleteCalendarEvent: { icon: Trash2, verb: 'Delete calendar event' },
  bulkDeleteCalendarEvents: { icon: Trash2, verb: 'Delete multiple calendar events' },
  deleteTask: { icon: Trash2, verb: 'Delete task' },
  updateTripDetails: { icon: Settings2, verb: 'Update trip details' },
  addExpense: { icon: DollarSign, verb: 'Log expense' },
  duplicateCalendarEvent: { icon: Copy, verb: 'Duplicate calendar event' },
  cloneActivity: { icon: Copy, verb: 'Clone activity' },
  bulkMarkTasksDone: { icon: CheckSquare, verb: 'Mark multiple tasks complete' },
};

/** Best-effort human summary of what the tool is about to do, from its args. */
function summarizeArgs(toolName: string, args: Record<string, unknown>): string | null {
  const s = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
  switch (toolName) {
    case 'deleteCalendarEvent':
    case 'duplicateCalendarEvent':
      return s(args.title) || s(args.event_title) || s(args.event_id);
    case 'deleteTask':
      return s(args.title) || s(args.task_title) || s(args.task_id);
    case 'addExpense': {
      const amount = typeof args.amount === 'number' ? args.amount : null;
      const desc = s(args.description) || s(args.title);
      if (amount != null && desc) return `${desc} — ${amount}`;
      return desc || (amount != null ? String(amount) : null);
    }
    case 'updateTripDetails':
      return s(args.name) || s(args.title) || 'Trip settings';
    case 'bulkDeleteCalendarEvents': {
      const ids = args.event_ids;
      return Array.isArray(ids) ? `${ids.length} event${ids.length === 1 ? '' : 's'}` : null;
    }
    case 'bulkMarkTasksDone': {
      const ids = args.task_ids;
      return Array.isArray(ids) ? `${ids.length} task${ids.length === 1 ? '' : 's'}` : null;
    }
    case 'cloneActivity': {
      const clones = args.clones;
      return Array.isArray(clones)
        ? `${clones.length} cop${clones.length === 1 ? 'y' : 'ies'}`
        : null;
    }
    default:
      return null;
  }
}

type CardState = 'idle' | 'confirming' | 'cancelled';

/**
 * Inline confirm/cancel card for concierge actions the server fail-closed on
 * (confirmation-gated mutations). Confirming re-invokes the tool with
 * confirmation_gate=true; the result replaces this card with the standard
 * action-result card.
 */
export const ConciergeConfirmCard: React.FC<ConciergeConfirmCardProps> = ({ request, tripId }) => {
  const [state, setState] = useState<CardState>('idle');
  const [result, setResult] = useState<{
    actionType: string;
    success: boolean;
    message: string;
  } | null>(null);
  const queryClient = useQueryClient();

  const config = GATED_TOOL_CONFIG[request.toolName];
  const Icon = config?.icon ?? ShieldAlert;
  const verb = config?.verb ?? request.toolName;
  const summary = summarizeArgs(request.toolName, request.requestedArgs);

  const handleConfirm = async () => {
    if (state === 'confirming') return;
    setState('confirming');
    const res = await confirmGatedConciergeAction(tripId, request);
    setResult({
      actionType: (res.actionType as string) || request.toolName,
      success: !!res.success,
      message: (res.message as string) || (res.error as string) || '',
    });
    if (res.success) {
      for (const key of getConciergeInvalidationKeys(request.toolName, tripId)) {
        queryClient.invalidateQueries({ queryKey: key as unknown as unknown[] });
      }
    }
  };

  // After execution: show the standard result card in place of the prompt.
  if (result) {
    return <ConciergeActionCard action={result} />;
  }

  if (state === 'cancelled') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-500/30 bg-gray-500/10 p-2.5 text-xs text-gray-400">
        <X size={14} className="shrink-0" />
        Cancelled — nothing was changed.
      </div>
    );
  }

  const borderColor = request.destructive ? 'border-red-500/40' : 'border-yellow-500/40';
  const bgColor = request.destructive ? 'bg-red-500/10' : 'bg-yellow-500/10';
  const iconColor = request.destructive ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} p-3 text-sm`}>
      <div className="flex items-start gap-2">
        <Icon size={16} className={`mt-0.5 shrink-0 ${iconColor}`} />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-white/90">
            {verb}
            {summary ? `: ${summary}` : ''}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">
            {request.destructive
              ? 'This cannot be undone. Confirm to proceed.'
              : 'The Concierge needs your confirmation to apply this change.'}
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-2 pl-6">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={state === 'confirming'}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
            request.destructive
              ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
              : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
          }`}
        >
          {state === 'confirming' ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Check size={12} />
          )}
          {state === 'confirming' ? 'Applying…' : 'Confirm'}
        </button>
        <button
          type="button"
          onClick={() => setState('cancelled')}
          disabled={state === 'confirming'}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-60"
        >
          <X size={12} />
          Cancel
        </button>
      </div>
    </div>
  );
};
