export type PushTokenAuthorizationDecision =
  | {
      ok: true;
      targetTokens: string[];
    }
  | {
      ok: false;
      status: 403 | 404;
      error: string;
    };

export function authorizeOwnedPushTokens(params: {
  requestedTokens?: string[];
  ownedTokens: string[];
}): PushTokenAuthorizationDecision {
  const ownedTokens = Array.from(
    new Set(
      params.ownedTokens
        .map(token => token.trim())
        .filter(token => token.length > 0),
    ),
  );

  if (ownedTokens.length === 0) {
    return {
      ok: false,
      status: 404,
      error: 'No active push tokens found for this user',
    };
  }

  const requestedTokens = Array.from(
    new Set(
      (params.requestedTokens ?? [])
        .map(token => token.trim())
        .filter(token => token.length > 0),
    ),
  );

  if (requestedTokens.length === 0) {
    return {
      ok: true,
      targetTokens: ownedTokens,
    };
  }

  const ownedSet = new Set(ownedTokens);
  const unauthorized = requestedTokens.filter(token => !ownedSet.has(token));
  if (unauthorized.length > 0) {
    return {
      ok: false,
      status: 403,
      error: 'Cannot send push notifications to tokens not owned by the authenticated user',
    };
  }

  return {
    ok: true,
    targetTokens: requestedTokens,
  };
}
