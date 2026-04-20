import { toast } from 'sonner';
import type { MessageResponse } from 'stream-chat';
import { getStreamClient } from '@/services/stream/streamClient';

export type StreamMessageUpdatePayload = Pick<Partial<MessageResponse>, 'id' | 'text'>;

export interface StreamUpdateResult {
  ok: boolean;
  errorCode?: number | string;
}

/**
 * Extracts a Stream-canonical error code from any thrown error shape.
 * Stream errors expose `code` (numeric), `StatusCode`/`status`, and
 * `response.data.code`. We capture all reliable signals.
 */
function extractStreamErrorDetails(error: unknown): {
  code?: number | string;
  status?: number;
  message: string;
  data?: unknown;
} {
  const err = error as {
    code?: number | string;
    StatusCode?: number;
    status?: number;
    message?: string;
    response?: { data?: { code?: number | string; message?: string } };
  };
  return {
    code: err?.code ?? err?.response?.data?.code,
    status: err?.StatusCode ?? err?.status,
    message: err?.message ?? err?.response?.data?.message ?? 'Unknown Stream error',
    data: err?.response?.data,
  };
}

export async function updateStreamMessage(
  payload: StreamMessageUpdatePayload,
): Promise<StreamUpdateResult> {
  const client = getStreamClient();

  if (!client) {
    toast.error('Chat connection unavailable. Please try again.');
    return { ok: false };
  }

  try {
    await client.updateMessage(payload);
    return { ok: true };
  } catch (error) {
    const details = extractStreamErrorDetails(error);
    // Always log structured Stream error (not just DEV) — needed to triage
    // permissions vs. ownership vs. auth failures in production.
    console.error('[TripChat] Stream updateMessage failed:', {
      code: details.code,
      status: details.status,
      message: details.message,
      data: details.data,
    });
    const codeSuffix = details.code !== undefined ? ` (code ${details.code})` : '';
    toast.error(`Failed to edit message${codeSuffix}`);
    return { ok: false, errorCode: details.code };
  }
}
