import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 2026-08-02 — server-side enforcement of user blocks.
 *
 * Blocking was a client-side message filter only, so a blocked user's messages still arrived over
 * realtime and were merely hidden in whichever client had the block list loaded. The edge function
 * applies a per-blocker Stream mute so the block holds across every device/session.
 *
 * The security property under test: the desired state is re-derived from user_blocks scoped to the
 * CALLER, never trusted from the request body — otherwise a forged request could mute an arbitrary
 * user on someone else's behalf.
 */

const repoRoot = resolve(__dirname, '../../..');
const syncUserBlock = readFileSync(
  resolve(repoRoot, 'supabase/functions/sync-user-block/index.ts'),
  'utf8',
);
const userSafetyService = readFileSync(
  resolve(repoRoot, 'src/services/userSafetyService.ts'),
  'utf8',
);

describe('sync-user-block edge function', () => {
  it('requires authentication before acting', () => {
    expect(syncUserBlock).toContain('requireAuth');
    expect(syncUserBlock).toMatch(/if \(auth\.response\) return auth\.response/);
  });

  it('re-derives block state from user_blocks scoped to the caller', () => {
    expect(syncUserBlock).toContain("from('user_blocks')");
    expect(syncUserBlock).toContain("eq('blocker_id', caller.id)");
    expect(syncUserBlock).toContain("eq('blocked_id', blockedUserId)");

    // The mute decision must come from the DB row, not the request body.
    expect(syncUserBlock).toMatch(/const shouldMute = !!blockRow/);
  });

  it('mutes per-blocker rather than banning (both users stay trip members)', () => {
    expect(syncUserBlock).toContain('stream.muteUser(blockedUserId, caller.id)');
    expect(syncUserBlock).toContain('stream.unmuteUser(blockedUserId, caller.id)');
    expect(syncUserBlock).not.toContain('stream.banUser');
  });

  it('rejects self-blocking', () => {
    expect(syncUserBlock).toMatch(/blockedUserId === caller\.id/);
  });
});

describe('userSafetyService block sync', () => {
  it('syncs to Stream on both block and unblock', () => {
    expect(userSafetyService).toContain("supabase.functions.invoke('sync-user-block'");
    const blockIdx = userSafetyService.indexOf('export async function blockUser');
    const unblockIdx = userSafetyService.indexOf('export async function unblockUser');
    expect(userSafetyService.indexOf('syncBlockToStream', blockIdx)).toBeGreaterThan(blockIdx);
    expect(userSafetyService.indexOf('syncBlockToStream', unblockIdx)).toBeGreaterThan(unblockIdx);
  });

  it('treats the sync as best-effort so the DB block is never lost to a chat outage', () => {
    expect(userSafetyService).toMatch(/catch \(error\)[\s\S]{0,200}Failed to sync block state/);
  });
});
