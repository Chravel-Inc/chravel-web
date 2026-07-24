import fs from 'fs';
import { execSync } from 'child_process';

// Permission-matrix drift: the three artifacts generated from
// config/permission-matrix.json must be in sync with it.
//   - src/types/permissionMatrix.generated.ts                    (frontend)
//   - supabase/functions/_shared/permissionMatrix.generated.ts   (edge)
//   - supabase/sql/permission_matrix_allows.generated.sql        (RLS function)
// The two .ts files must additionally be byte-identical to each other.
const FILES = {
  frontendTs: 'src/types/permissionMatrix.generated.ts',
  backendTs: 'supabase/functions/_shared/permissionMatrix.generated.ts',
  sql: 'supabase/sql/permission_matrix_allows.generated.sql',
};

const read = p => fs.readFileSync(p, 'utf8');

const before = {
  frontendTs: read(FILES.frontendTs),
  backendTs: read(FILES.backendTs),
  sql: read(FILES.sql),
};

// Frontend and edge copies are meant to be identical.
if (before.frontendTs !== before.backendTs) {
  console.error('Permission matrix drift: frontend/backend generated files differ.');
  process.exit(1);
}

// Regenerate every artifact from the canonical JSON and detect staleness.
execSync('node scripts/generate-permission-matrix.mjs', { stdio: 'ignore' });

const after = {
  frontendTs: read(FILES.frontendTs),
  backendTs: read(FILES.backendTs),
  sql: read(FILES.sql),
};

const stale = Object.keys(FILES).filter(key => before[key] !== after[key]);
if (stale.length > 0) {
  console.error(
    `Permission matrix drift: generated files are stale (${stale
      .map(key => FILES[key])
      .join(', ')}). Run node scripts/generate-permission-matrix.mjs`,
  );
  process.exit(1);
}

console.log('Permission matrix drift check passed (2 TS + 1 SQL artifact in sync).');
