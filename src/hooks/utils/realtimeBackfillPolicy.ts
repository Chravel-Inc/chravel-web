export function shouldRefreshOnForeground(visibilityState: DocumentVisibilityState): boolean {
  return visibilityState === 'visible';
}

export function shouldBackfillOnSubscribe(
  status: string,
  hasCompletedInitialSubscribe: boolean,
): boolean {
  return status === 'SUBSCRIBED' && hasCompletedInitialSubscribe;
}
