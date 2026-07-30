import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../../..');
const read = (path: string) => readFileSync(resolve(repoRoot, path), 'utf8');

describe('2026-07-24 repo-wide hardening regressions', () => {
  it('moves organization invite acceptance onto a transactional auth-bound RPC', () => {
    const migration = read(
      'supabase/migrations/20260724162000_accept_organization_invite_secure.sql',
    );
    const edgeFunction = read('supabase/functions/accept-organization-invite/index.ts');

    expect(migration).toContain('v_auth_uid uuid := auth.uid()');
    expect(migration).toContain('FROM public.organizations');
    expect(migration).toContain('FOR UPDATE');
    expect(migration).toContain("SET seats_used = v_active_member_count + 1");
    expect(migration).toContain('organization_seats');
    expect(edgeFunction).toContain("rpc(\n      'accept_organization_invite_secure'");
    expect(edgeFunction).not.toContain(".from('organization_members').insert(");
    expect(edgeFunction).not.toContain(".update({ seats_used: org.seats_used + 1 })");
  });

  it('keeps payment message edits atomic with split redistribution on the server', () => {
    const migration = read(
      'supabase/migrations/20260724162100_update_payment_message_atomic.sql',
    );
    const paymentService = read('src/services/paymentService.ts');

    expect(migration).toContain('FROM public.trip_payment_messages');
    expect(migration).toContain('FOR UPDATE');
    expect(migration).toContain('VERSION_CONFLICT');
    expect(migration).toContain('FROM public.payment_splits');
    expect(paymentService).toContain("'update_payment_message_atomic'");
    expect(paymentService).not.toContain(".from('payment_splits')\n          .select('id')");
  });

  it('cleans up orphaned uploads and returns a signed URL for private trip-files', () => {
    const fileUpload = read('supabase/functions/file-upload/index.ts');

    expect(fileUpload).toContain('async function cleanupUploadedTripFile');
    expect(fileUpload).toContain(".createSignedUrl(uploadData.path, 60 * 60 * 24 * 365)");
    expect(fileUpload).toContain('file_url: signedUrlData.signedUrl');
    expect(fileUpload).toContain('await cleanupUploadedTripFile(supabase, uploadData.path);');
    expect(fileUpload).toContain('downloadUrl: signedUrlData.signedUrl');
  });
});
