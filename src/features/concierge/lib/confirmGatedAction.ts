import { supabase } from '@/integrations/supabase/client';

/**
 * A concierge tool call that the server refused to execute until the user
 * explicitly confirms (destructive or high-blast-radius mutations).
 * Shape comes from the toolRouter fail-closed response
 * (supabase/functions/_shared/security/toolRouter.ts).
 */
export interface ConciergeConfirmationRequest {
  /** Client-generated id for React keys + idempotency of the confirmed retry */
  id: string;
  toolName: string;
  /** Schema-sanitized args echoed by the server; retried verbatim on confirm */
  requestedArgs: Record<string, unknown>;
  /** True for delete-class tools — render the scarier variant */
  destructive: boolean;
  message: string;
}

export interface GatedActionResult {
  success: boolean;
  actionType?: string;
  message?: string;
  error?: string;
  [key: string]: unknown;
}

/**
 * Re-invoke a confirmation-gated concierge tool with the user's explicit
 * confirmation. The server-side gate (toolRouter) only executes when
 * confirmation_gate reaches it via executeToolSecurely's confirmationGranted
 * option — which execute-concierge-tool sets from the explicit userConfirmed
 * body flag below. The model cannot grant it: confirmation_gate in tool args
 * is stripped server-side.
 *
 * The request id doubles as the idempotency key so double-clicks or retries
 * cannot apply a destructive mutation twice.
 */
export async function confirmGatedConciergeAction(
  tripId: string,
  request: ConciergeConfirmationRequest,
): Promise<GatedActionResult> {
  const { data, error } = await supabase.functions.invoke<GatedActionResult>(
    'execute-concierge-tool',
    {
      body: {
        toolName: request.toolName,
        tripId,
        args: request.requestedArgs,
        userConfirmed: true,
        idempotencyKey: `confirm_${request.id}`,
      },
    },
  );

  if (error) {
    return { success: false, error: error.message || 'Failed to execute action' };
  }
  return data ?? { success: false, error: 'Empty response from tool execution' };
}
