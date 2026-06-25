/**
 * Distribute a total amount equally across participants in whole cents.
 * Remainder pennies are assigned deterministically to the first N participants.
 */
export function distributeEqualSplitCents(totalAmount: number, participantCount: number): number[] {
  if (participantCount <= 0) return [];
  if (!Number.isFinite(totalAmount) || totalAmount < 0) return [];

  const totalCents = Math.round(totalAmount * 100);
  const baseCents = Math.floor(totalCents / participantCount);
  const remainder = totalCents - baseCents * participantCount;

  return Array.from({ length: participantCount }, (_, index) => {
    const cents = baseCents + (index < remainder ? 1 : 0);
    return cents / 100;
  });
}

/** Sum of distributed shares — should equal totalAmount within floating tolerance. */
export function sumSplitShares(shares: number[]): number {
  return shares.reduce((sum, share) => sum + share, 0);
}

/**
 * Display amount for equal splits. When shares are uniform, returns that amount.
 * When remainder causes mixed shares, returns the lower (base) share for conservative display.
 */
export function getDisplayPerPersonAmount(totalAmount: number, participantCount: number): number {
  const shares = distributeEqualSplitCents(totalAmount, participantCount);
  if (shares.length === 0) return 0;
  return shares[0];
}

export function hasUniformSplitShares(shares: number[]): boolean {
  if (shares.length <= 1) return true;
  const first = shares[0];
  return shares.every(share => Math.abs(share - first) < 0.0001);
}
