export type DigestScopeDecision =
  | {
      ok: true;
      userId: string;
    }
  | {
      ok: false;
      status: 403;
      error: string;
    };

export function authorizeDigestScope(
  authenticatedUserId: string,
  requestedUserId?: string | null,
): DigestScopeDecision {
  const normalizedRequestedUserId = requestedUserId?.trim();

  if (normalizedRequestedUserId && normalizedRequestedUserId !== authenticatedUserId) {
    return {
      ok: false,
      status: 403,
      error: "Cannot access another user's digest",
    };
  }

  return {
    ok: true,
    userId: authenticatedUserId,
  };
}
