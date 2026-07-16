#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

const read = relativePath => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const failures = [];

function assertIncludes(file, needle, message) {
  const contents = read(file);
  if (!contents.includes(needle)) {
    failures.push(`${file}: ${message}`);
  }
}

function assertNotIncludes(file, needle, message) {
  const contents = read(file);
  if (contents.includes(needle)) {
    failures.push(`${file}: ${message}`);
  }
}

// Phase 2: trip covers must resolve through one client resolver and one OG resolver.
for (const file of [
  'src/utils/tripConverter.ts',
  'src/components/TripCard.tsx',
  'src/components/TripHeader.tsx',
  'src/components/share/ShareTripModal.tsx',
]) {
  assertIncludes(
    file,
    'resolveTripCoverImageUrl',
    'trip cover surfaces must import/use the canonical client cover resolver',
  );
}

for (const file of [
  'supabase/functions/generate-trip-preview/index.ts',
  'supabase/functions/generate-invite-preview/index.ts',
  'supabase/functions/get-trip-preview/index.ts',
  'supabase/functions/get-invite-preview/index.ts',
]) {
  assertIncludes(
    file,
    'resolveOgCoverImageUrl',
    'OG/share preview surfaces must import/use the canonical edge cover resolver',
  );
}

// Phase 5: privileged trip-scoped edge writes must use active membership helper.
assertIncludes(
  'supabase/functions/_shared/verifyTripMembership.ts',
  "rpc('is_active_trip_member'",
  'shared edge membership helper must call is_active_trip_member, not row-presence membership',
);
assertIncludes(
  'supabase/functions/file-upload/index.ts',
  'verifyTripMembership',
  'file-upload must use shared active-membership helper before service-role writes',
);
assertIncludes(
  'supabase/functions/send-push/index.ts',
  'verifyTripMembership',
  'send-push must verify the caller with the shared active-membership helper before fanout',
);
assertIncludes(
  'supabase/functions/send-push/index.ts',
  'userIds targeting requires tripId scope',
  'send-push must reject arbitrary userIds without a trip scope',
);
assertIncludes(
  'supabase/functions/send-push/index.ts',
  ".eq('status', 'active')",
  'send-push must fan out only to active trip members',
);
assertIncludes(
  'supabase/functions/ai-ingest/index.ts',
  'verifyTripMembership',
  'ai-ingest must use the shared active-membership helper before service-role RAG reads/writes',
);

// Phase 6: Concierge history/data hydration must not be eager during trip-shell prefetch.
assertNotIncludes(
  'src/hooks/usePrefetchTrip.ts',
  "setTimeout(() => prefetchTab(tripId, 'concierge')",
  'Concierge data prefetch must stay behind explicit tab activation',
);

// Phase 7: primary action styling must continue to prefer semantic button variants.
assertIncludes(
  'src/components/ui/button.tsx',
  'bg-primary text-primary-foreground',
  'canonical Button primary/default variant must keep the semantic primary/brand token',
);
assertNotIncludes(
  'src/components/pro/TeamOnboardingBanner.tsx',
  'bg-red-600 hover:bg-red-700 text-white',
  'primary Pro Team CTAs must use semantic Button styling instead of ad hoc hardcoded colors',
);

if (failures.length > 0) {
  console.error('Systemic hardening guard violations:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Systemic hardening guards passed.');
