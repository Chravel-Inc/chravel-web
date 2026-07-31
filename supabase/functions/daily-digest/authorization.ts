export type DailyDigestUserAuthz =
  | {
      ok: true;
      userId: string;
    }
  | {
      ok: false;
      error: string;
      status: 403;
    };

export function authorizeDailyDigestUser({
  authenticatedUserId,
  requestedUserId,
}: {
  authenticatedUserId: string;
  requestedUserId?: string | null;
}): DailyDigestUserAuthz {
  if (!requestedUserId || requestedUserId === authenticatedUserId) {
    return {
      ok: true,
      userId: authenticatedUserId,
    };
  }

  return {
    ok: false,
    error: 'Forbidden',
    status: 403,
  };
}
