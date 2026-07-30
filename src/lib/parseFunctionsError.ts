/**
 * Extract a user-facing message from supabase.functions.invoke failures.
 * Non-2xx responses put the JSON body on FunctionsHttpError.context (Response).
 */

export type ParsedFunctionsError = {
  message: string;
  errorCode?: string;
  status?: number;
};

const ADD_MEMBER_ERROR_MESSAGES: Record<string, string> = {
  USER_NOT_FOUND: 'No Chravel account matches that email or phone.',
  ALREADY_MEMBER: 'That person is already on this trip.',
  TRIP_FULL: 'This trip is full. Upgrade or remove a member to add someone.',
  FORBIDDEN: "You don't have permission to add members to this trip.",
  UNAUTHORIZED: 'Sign in to add members.',
};

export async function parseFunctionsInvokeError(
  error: unknown,
  data?: { error?: string; error_code?: string; message?: string } | null,
): Promise<ParsedFunctionsError> {
  if (typeof data?.error_code === 'string' && ADD_MEMBER_ERROR_MESSAGES[data.error_code]) {
    return {
      message: ADD_MEMBER_ERROR_MESSAGES[data.error_code],
      errorCode: data.error_code,
    };
  }

  if (typeof data?.error === 'string' && data.error.trim()) {
    const code =
      typeof data.error_code === 'string'
        ? data.error_code
        : Object.keys(ADD_MEMBER_ERROR_MESSAGES).find(k => data.error === k);
    if (code && ADD_MEMBER_ERROR_MESSAGES[code]) {
      return { message: ADD_MEMBER_ERROR_MESSAGES[code], errorCode: code };
    }
    return { message: data.error, errorCode: data.error_code };
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return { message: data.message };
  }

  const context =
    error && typeof error === 'object' && 'context' in error
      ? (error as { context?: unknown }).context
      : undefined;

  if (context instanceof Response) {
    try {
      const body = (await context.clone().json()) as {
        error?: string;
        error_code?: string;
        message?: string;
      };
      const code = typeof body.error_code === 'string' ? body.error_code : undefined;
      if (code && ADD_MEMBER_ERROR_MESSAGES[code]) {
        return {
          message: ADD_MEMBER_ERROR_MESSAGES[code],
          errorCode: code,
          status: context.status,
        };
      }
      if (typeof body.error === 'string' && ADD_MEMBER_ERROR_MESSAGES[body.error]) {
        return {
          message: ADD_MEMBER_ERROR_MESSAGES[body.error],
          errorCode: body.error,
          status: context.status,
        };
      }
      if (typeof body.error === 'string' && body.error.trim()) {
        return { message: body.error, errorCode: code, status: context.status };
      }
      if (typeof body.message === 'string' && body.message.trim()) {
        return { message: body.message, status: context.status };
      }
    } catch {
      // body not JSON
    }
    return {
      message: 'Something went wrong. Please try again.',
      status: context.status,
    };
  }

  if (error instanceof Error && error.message && !/failed to fetch/i.test(error.message)) {
    return { message: error.message };
  }

  return { message: 'Could not reach the server. Check your connection and try again.' };
}

export function mapAddMemberErrorCode(code: string | undefined): string | null {
  if (!code) return null;
  return ADD_MEMBER_ERROR_MESSAGES[code] ?? null;
}
