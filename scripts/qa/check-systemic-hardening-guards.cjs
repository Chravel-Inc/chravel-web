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

if (failures.length > 0) {
  console.error('Systemic hardening guard violations:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Systemic hardening guards passed.');
